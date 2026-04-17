import { supabase } from '../lib/supabase';
import { type CartItem } from '../lib/types';

const WARRANTY_MONTHS = 12;

const isMissingProductColumnError = (error: any, columnName: string) =>
  error?.code === '42703' ||
  error?.code === 'PGRST204' ||
  String(error?.message || '').includes(`'${columnName}'`);

const isMissingRpcFunctionError = (error: any, functionName: string) =>
  error?.code === '42883' ||
  error?.code === 'PGRST202' ||
  String(error?.message || '').toLowerCase().includes(functionName.toLowerCase());

const normalizeAmount = (value: unknown) => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
};

const validateStockAvailability = async (cartItems: CartItem[]) => {
  const productIds = cartItems.map((item) => item.id);
  if (productIds.length === 0) {
    throw new Error('Your cart is empty.');
  }

  try {
    const { data: stockRows, error: stockError } = await supabase
      .from('products')
      .select('id, stock, is_active, name')
      .in('id', productIds);

    if (stockError) throw stockError;

    const stockMap = new Map(stockRows?.map((row: any) => [row.id, row]));
    for (const item of cartItems) {
      const stockRow = stockMap.get(item.id);
      if (!stockRow) continue;

      const availableStock = Number(stockRow.stock ?? 0);
      if (stockRow.is_active === false || availableStock <= 0) {
        throw new Error(`${stockRow.name || item.name} is out of stock or unavailable.`);
      }

      if (availableStock < item.quantity) {
        throw new Error(`Only ${availableStock} unit(s) left for ${stockRow.name || item.name}.`);
      }
    }
  } catch (stockValidationError: any) {
    if (
      !isMissingProductColumnError(stockValidationError, 'stock') &&
      !isMissingProductColumnError(stockValidationError, 'is_active')
    ) {
      throw stockValidationError;
    }
  }
};

const reduceInventoryStock = async (cartItems: CartItem[]) => {
  try {
    const productIds = cartItems.map((item) => item.id);
    const { data: stockRows, error: stockError } = await supabase
      .from('products')
      .select('id, stock')
      .in('id', productIds);

    if (stockError) throw stockError;

    const stockMap = new Map(stockRows?.map((row: any) => [row.id, Number(row.stock ?? 0)]));
    await Promise.all(
      cartItems.map(async (item) => {
        const currentStock = stockMap.get(item.id);
        if (currentStock === undefined) return;

        const nextStock = Math.max(0, currentStock - item.quantity);
        const { error } = await supabase
          .from('products')
          .update({ stock: nextStock })
          .eq('id', item.id);

        if (error) throw error;
      }),
    );
  } catch (inventoryError: any) {
    if (!isMissingProductColumnError(inventoryError, 'stock')) {
      throw inventoryError;
    }
  }
};

const createWarrantyRecords = async (userId: string, orderId: string, cartItems: CartItem[]) => {
  const warrantyStart = new Date().toISOString().split('T')[0];
  const warrantyEndDate = new Date();
  warrantyEndDate.setMonth(warrantyEndDate.getMonth() + WARRANTY_MONTHS);
  const warrantyEnd = warrantyEndDate.toISOString().split('T')[0];

  const warrantyRecords = cartItems.map((item) => ({
    user_id: userId,
    product_id: item.id,
    order_id: orderId,
    warranty_start_date: warrantyStart,
    warranty_end_date: warrantyEnd,
    status: 'active',
  }));

  const { error: warrantyError } = await supabase
    .from('warranties')
    .insert(warrantyRecords);

  if (warrantyError) {
    console.error('Warranty creation failed:', warrantyError);
  }
};

const createOrderClientFallback = async (userId: string, cartItems: CartItem[]) => {
  await validateStockAvailability(cartItems);

  const total = cartItems.reduce((acc, item) => acc + (normalizeAmount(item.price) * item.quantity), 0);
  const { data: orderData, error: orderError } = await supabase
    .from('orders')
    .insert({
      user_id: userId,
      total,
      status: 'pending',
    })
    .select()
    .single();

  if (orderError) throw orderError;

  const lineItems = cartItems.map((item) => ({
    order_id: orderData.id,
    product_id: item.id,
    quantity: item.quantity,
    price: normalizeAmount(item.price),
  }));

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(lineItems);

  if (itemsError) throw itemsError;

  await reduceInventoryStock(cartItems);
  await createWarrantyRecords(userId, orderData.id, cartItems);
  await supabase.from('cart').delete().eq('user_id', userId);

  return orderData;
};

export const ordersApi = {
  async fetchCart(userId: string) {
    const { data, error } = await supabase
      .from('cart')
      .select('*, products(*)')
      .eq('user_id', userId);
    if (error) throw error;
    return data;
  },

  async addToCart(userId: string, productId: string, quantity: number = 1) {
    if (quantity <= 0) {
      throw new Error('Quantity must be at least 1.');
    }

    const { data: existingCart } = await supabase
      .from('cart')
      .select('*')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .single();

    try {
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('name, stock, is_active')
        .eq('id', productId)
        .single();

      if (productError) throw productError;

      const availableStock = Number(productData?.stock ?? 0);
      const requestedTotal = Number(existingCart?.quantity ?? 0) + quantity;

      if (productData?.is_active === false || availableStock <= 0) {
        throw new Error(`${productData?.name || 'This product'} is out of stock.`);
      }

      if (requestedTotal > availableStock) {
        throw new Error(`Only ${availableStock} unit(s) available right now.`);
      }
    } catch (validationError: any) {
      if (
        !isMissingProductColumnError(validationError, 'stock') &&
        !isMissingProductColumnError(validationError, 'is_active')
      ) {
        throw validationError;
      }
    }

    if (existingCart) {
      const { error } = await supabase
        .from('cart')
        .update({ quantity: existingCart.quantity + quantity })
        .eq('id', existingCart.id);
      if (error) throw error;
      return;
    }

    const { error } = await supabase
      .from('cart')
      .insert({ user_id: userId, product_id: productId, quantity });
    if (error) throw error;
  },

  async updateCartQuantity(userId: string, productId: string, quantity: number) {
    if (quantity <= 0) {
      throw new Error('Quantity must be at least 1.');
    }

    try {
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('name, stock, is_active')
        .eq('id', productId)
        .single();

      if (productError) throw productError;

      const availableStock = Number(productData?.stock ?? 0);
      if (productData?.is_active === false || availableStock <= 0) {
        throw new Error(`${productData?.name || 'This product'} is out of stock.`);
      }

      if (quantity > availableStock) {
        throw new Error(`Only ${availableStock} unit(s) available right now.`);
      }
    } catch (validationError: any) {
      if (
        !isMissingProductColumnError(validationError, 'stock') &&
        !isMissingProductColumnError(validationError, 'is_active')
      ) {
        throw validationError;
      }
    }

    const { error } = await supabase
      .from('cart')
      .update({ quantity })
      .eq('user_id', userId)
      .eq('product_id', productId);
    if (error) throw error;
  },

  async removeByProductId(userId: string, productId: string) {
    const { error } = await supabase
      .from('cart')
      .delete()
      .eq('user_id', userId)
      .eq('product_id', productId);
    if (error) throw error;
  },

  async removeCartItem(cartId: string) {
    const { error } = await supabase
      .from('cart')
      .delete()
      .eq('id', cartId);
    if (error) throw error;
  },

  async fetchUserOrders(userId: string) {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*, products(name, image, category))')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async createOrder(userId: string, cartItems: CartItem[]) {
    try {
      const { data, error } = await supabase.rpc('process_checkout', {
        p_user_id: userId,
        p_warranty_months: WARRANTY_MONTHS,
      });

      if (error) {
        if (!isMissingRpcFunctionError(error, 'process_checkout')) {
          throw error;
        }
      } else if (data) {
        return Array.isArray(data) ? data[0] : data;
      }
    } catch (rpcError: any) {
      if (!isMissingRpcFunctionError(rpcError, 'process_checkout')) {
        throw rpcError;
      }
    }

    return await createOrderClientFallback(userId, cartItems);
  },

  async fetchAllOrders() {
    const { data, error } = await supabase
      .from('orders')
      .select('*, users(name, email, phone), order_items(*, products(name, image, category))')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  async updateOrderStatus(orderId: string, status: string) {
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId);
    if (error) throw error;
  },
};
