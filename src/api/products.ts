import { supabase } from '../lib/supabase';
import { type Product } from '../lib/types';

export interface ProductPayload {
  name: string
  price: number
  image: string
  images?: string[] | null
  category: string
  description?: string | null
  rating?: number | null
  stock?: number
  warranty_months?: number | null
  is_active?: boolean
}

const isMissingColumnError = (error: any, columnName: string) =>
  error?.code === 'PGRST204' || String(error?.message || '').includes(`'${columnName}'`)

const createMissingColumnMessage = (columnName: string) =>
  `The products.${columnName} column is missing in Supabase. Run the latest product/admin migration, then try again.`

const withoutUnsupportedColumns = (
  payload: ProductPayload | Partial<ProductPayload>,
  columns: Array<'description' | 'rating' | 'stock' | 'warranty_months' | 'is_active' | 'images'>,
) => {
  const nextPayload = { ...payload }

  columns.forEach((column) => {
    if (column in nextPayload) {
      delete nextPayload[column]
    }
  })

  return nextPayload
}

const saveProductWithFallback = async (
  operation: (payload: ProductPayload | Partial<ProductPayload>) => Promise<{ data: any; error: any }>,
  payload: ProductPayload | Partial<ProductPayload>,
) => {
  let activePayload = { ...payload }
  let lastResult = await operation(activePayload)

  for (const column of ['description', 'rating', 'stock', 'warranty_months', 'is_active', 'images'] as const) {
    if (!lastResult.error || !isMissingColumnError(lastResult.error, column)) {
      break
    }

    activePayload = withoutUnsupportedColumns(activePayload, [column])
    lastResult = await operation(activePayload)
  }

  if (
    lastResult.error &&
    (isMissingColumnError(lastResult.error, 'stock') || isMissingColumnError(lastResult.error, 'rating') || isMissingColumnError(lastResult.error, 'warranty_months') || isMissingColumnError(lastResult.error, 'images')) &&
    ('is_active' in activePayload || 'stock' in activePayload || 'rating' in activePayload || 'warranty_months' in activePayload || 'images' in activePayload)
  ) {
    activePayload = withoutUnsupportedColumns(activePayload, ['rating', 'stock', 'warranty_months', 'is_active', 'images'])
    lastResult = await operation(activePayload)
  }

  return lastResult
}

const normalizeProductPrice = (value: unknown): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string') {
    const numericValue = Number(value.replace(/[^0-9.]+/g, ''))
    if (Number.isFinite(numericValue)) {
      return numericValue
    }
  }

  return 0
}

const normalizeNullableNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') {
    return null
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string') {
    const numericValue = Number(value.replace(/[^0-9.]+/g, ''))
    if (Number.isFinite(numericValue)) {
      return numericValue
    }
  }

  return null
}

const normalizeStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === 'string' ? item.trim() : ''))
      .filter(Boolean)
  }

  if (typeof value === 'string') {
    const trimmedValue = value.trim()
    if (!trimmedValue) return []

    if (trimmedValue.startsWith('[') && trimmedValue.endsWith(']')) {
      try {
        const parsedValue = JSON.parse(trimmedValue)
        return normalizeStringArray(parsedValue)
      } catch {
        // Fall back to plain-text splitting below.
      }
    }

    return trimmedValue
      .split(/\r?\n|[,|]/)
      .map((item) => item.trim())
      .filter(Boolean)
  }

  return []
}

const extractSingleRow = <T>(data: T | T[] | null | undefined): T | null => {
  if (Array.isArray(data)) {
    return data[0] ?? null
  }

  return data ?? null
}

const mapProductRecord = (product: any): Product => ({
  ...product,
  image:
    (typeof product?.image === 'string' && product.image.trim()) ||
    normalizeStringArray(product?.images ?? product?.image_urls ?? product?.gallery_images ?? product?.additional_images)[0] ||
    '',
  images: Array.from(
    new Set(
      [
        typeof product?.image === 'string' ? product.image.trim() : '',
        ...normalizeStringArray(product?.images ?? product?.image_urls ?? product?.gallery_images ?? product?.additional_images),
      ].filter(Boolean),
    ),
  ),
  image_labels: normalizeStringArray(product?.image_labels ?? product?.gallery_image_labels ?? product?.image_captions),
  price: normalizeProductPrice(product?.price),
  rating: normalizeNullableNumber(product?.rating),
  review_count: normalizeNullableNumber(product?.review_count),
  stock: normalizeNullableNumber(product?.stock) ?? 0,
  warranty_months: normalizeNullableNumber(product?.warranty_months),
})

const fetchProductRecordById = async (productId: string) => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .maybeSingle()

  if (error) throw error
  if (!data) {
    throw new Error('Product not found after update.')
  }

  return data
}

export const productsApi = {
  // Fetch active products
  async fetchProducts() {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('fetchProducts active filter failed, retrying without is_active:', error);

      const { data: fallbackData, error: fallbackError } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (fallbackError) {
        console.error('Error fetching products:', fallbackError);
        return [];
      }

      console.log('fetchProducts fallback data:', fallbackData);
      return (fallbackData ?? []).map(mapProductRecord);
    }

    console.log('fetchProducts data:', data);
    return (data ?? []).map(mapProductRecord);
  },

  async fetchAllProducts() {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching all products:', error);
      return [];
    }

    return (data ?? []).map(mapProductRecord);
  },

  async fetchProductById(productId: string) {
    const data = await fetchProductRecordById(productId)

    return mapProductRecord(data);
  },

  async createProduct(payload: ProductPayload) {
    const { data, error } = await saveProductWithFallback(
      async (nextPayload) =>
        await supabase
          .from('products')
          .insert(nextPayload)
          .select(),
      payload,
    )

    if (error) throw error;

    const productRecord = extractSingleRow(data)
    if (!productRecord) {
      throw new Error('Product created but no product record was returned.')
    }

    return mapProductRecord(productRecord);
  },

  async updateProduct(productId: string, payload: Partial<ProductPayload>) {
    const { data, error } = await saveProductWithFallback(
      async (nextPayload) =>
        await supabase
          .from('products')
          .update(nextPayload)
          .eq('id', productId)
          .select(),
      payload,
    )

    if (error) throw error;

    const productRecord = extractSingleRow(data) ?? await fetchProductRecordById(productId)
    return mapProductRecord(productRecord);
  },

  async updateProductStock(productId: string, stock: number, isActive?: boolean) {
    const payload: Partial<ProductPayload> = {
      stock,
    }

    if (typeof isActive === 'boolean') {
      payload.is_active = isActive
    }

    const { error } = await supabase
      .from('products')
      .update(payload)
      .eq('id', productId)

    if (error) {
      if (isMissingColumnError(error, 'stock')) {
        throw new Error(createMissingColumnMessage('stock'))
      }

      if (isMissingColumnError(error, 'is_active')) {
        throw new Error(createMissingColumnMessage('is_active'))
      }

      throw error
    }

    const productRecord = await fetchProductRecordById(productId)
    const savedStock = Number(normalizeNullableNumber(productRecord?.stock) ?? 0)

    if (savedStock !== stock) {
      throw new Error('Stock update did not persist in Supabase. Please verify the latest admin migration and product RLS policies.')
    }

    return mapProductRecord(productRecord)
  },

  async deleteProduct(productId: string) {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);

    if (error) throw error;
  }
};
