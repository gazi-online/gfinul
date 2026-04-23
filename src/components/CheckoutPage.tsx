import React, { useState, useMemo } from 'react';
import { type CartItem } from '../lib/types';
import { EmailInput, isValidEmail } from './EmailInput';
import { TextInput } from './TextInput';
import { useToast } from './toast/useToast';

const getReadableErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim()) {
      return message;
    }
  }

  return fallback;
};

const BackIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5 text-blue-600">
    <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
  </svg>
);

import { type User } from '@supabase/supabase-js';

export interface CheckoutPageProps {
  cartItems: CartItem[];
  onClose: () => void;
  onPlaceOrder: (orderDetails: any) => Promise<void> | void;
  user?: User | null;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({ cartItems, onClose, onPlaceOrder, user }) => {
  const { addToast } = useToast();
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'cod'>('upi');
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [shippingDetails, setShippingDetails] = useState({
    fullName: String(user?.user_metadata?.full_name || ''),
    phone: '',
    email: String(user?.email || ''),
    address: '',
  });

  if (!user) {
    return (
      <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 rounded-[32px] p-8 max-w-sm w-full text-center shadow-xl border border-gray-100 dark:border-slate-800 animate-scale-in">
          <div className="w-16 h-16 mx-auto bg-red-100 dark:bg-red-900/30 text-red-500 rounded-full flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          </div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Access Denied</h2>
          <p className="text-gray-500 dark:text-slate-400 mb-6">Please log in to proceed to checkout securely.</p>
          <button onClick={onClose} className="px-6 py-3 bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-white rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-slate-700 transition">Go Back</button>
        </div>
      </div>
    );
  }

  const subtotal = useMemo(() => {
    return cartItems.reduce((acc, item) => {
      const numericPrice = typeof item.price === 'number' ? item.price : Number(String(item.price).replace(/[^0-9.-]+/g, ""));
      return acc + (numericPrice * item.quantity);
    }, 0);
  }, [cartItems]);

  const tax = subtotal * 0.18; // 18% dummy tax
  const total = subtotal + tax - discount;

  const handleApplyCoupon = () => {
    if (couponCode.toLowerCase() === 'civic20') {
      setDiscount(subtotal * 0.20);
      addToast({
        type: 'success',
        title: 'Coupon applied',
        message: '20% discount has been added to this order.',
      });
    } else {
      setDiscount(0);
      addToast({
        type: 'error',
        title: 'Invalid coupon',
        message: 'Try CIVIC20 to apply the promo code.',
      });
    }
  };

  const validateCheckoutDetails = () => {
    if (cartItems.length === 0) {
      return 'Your cart is empty.';
    }

    if (!shippingDetails.fullName.trim()) {
      return 'Enter the full name for delivery.';
    }

    if (!shippingDetails.phone.trim() || shippingDetails.phone.replace(/\D/g, '').length < 10) {
      return 'Enter a valid phone number.';
    }

    if (!shippingDetails.email.trim() || !isValidEmail(shippingDetails.email)) {
      return 'Enter a valid email address.';
    }

    if (!shippingDetails.address.trim()) {
      return 'Enter the complete delivery address.';
    }

    return null;
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) {
      return;
    }

    const validationMessage = validateCheckoutDetails();
    if (validationMessage) {
      setSubmitError(validationMessage);
      addToast({
        type: 'error',
        title: 'Checkout incomplete',
        message: validationMessage,
      });
      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);
    addToast({
      type: 'info',
      title: 'Processing order',
      message: 'We are confirming your items and creating the order now.',
    });

    try {
      await Promise.resolve(onPlaceOrder({ paymentMethod, total, discount, shippingDetails }));
      addToast({
        type: 'success',
        title: 'Order placed',
        message: 'Your order has been placed successfully.',
      });
    } catch (placeOrderError) {
      const message = getReadableErrorMessage(placeOrderError, 'We could not place your order right now.');
      setSubmitError(message);
      addToast({
        type: 'error',
        title: 'Order failed',
        message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#F9FAFB] dark:bg-[#0f172a] overflow-y-auto w-full animate-fade-in flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={onClose}
            className="p-2 rounded-full bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700 transition tap-scale"
          >
            <BackIcon />
          </button>
          <h1 className="text-xl font-black text-gray-900 dark:text-white">Checkout</h1>
        </div>
        <div className="text-sm font-bold text-gray-500 dark:text-slate-400">Step 2/3</div>
      </header>

      {/* Main Content */}
      <div className="flex-1 max-w-6xl mx-auto w-full px-4 lg:px-8 py-6 lg:py-10 grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8 lg:gap-12 pb-32">
        <form id="checkout-form" onSubmit={handlePlaceOrder} className="space-y-8">
          
          {/* Shipping Address */}
          <section className="bg-white dark:bg-slate-800 rounded-3xl p-6 lg:p-8 shadow-sm border border-gray-100 dark:border-slate-700/50">
            <h2 className="text-lg lg:text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 flex items-center justify-center text-sm">1</span>
              Shipping Address
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-5">
              <div className="col-span-1 md:col-span-2">
                <TextInput
                  label="Full Name"
                  value={shippingDetails.fullName}
                  onChange={(nextValue) => setShippingDetails((prev) => ({ ...prev, fullName: nextValue }))}
                  placeholder="e.g. John Doe"
                  required
                />
              </div>
              <div>
                <TextInput
                  label="Phone Number"
                  type="tel"
                  value={shippingDetails.phone}
                  onChange={(nextValue) => setShippingDetails((prev) => ({ ...prev, phone: nextValue }))}
                  placeholder="+91 98765 43210"
                  required
                />
              </div>
              <div>
                <EmailInput
                  label="Email Address"
                  value={shippingDetails.email}
                  onChange={(nextValue) => setShippingDetails((prev) => ({ ...prev, email: nextValue }))}
                  placeholder="john@example.com"
                  required
                />
              </div>
              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-1.5">Complete Address</label>
                <textarea
                  required
                  rows={3}
                  value={shippingDetails.address}
                  onChange={(event) => setShippingDetails((prev) => ({ ...prev, address: event.target.value }))}
                  placeholder="Apartment, Studio, or Floor..."
                  className="w-full bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-gray-900 dark:text-white font-medium resize-none"
                ></textarea>
              </div>
            </div>
          </section>

          {/* Payment Options */}
          <section className="bg-white dark:bg-slate-800 rounded-3xl p-6 lg:p-8 shadow-sm border border-gray-100 dark:border-slate-700/50">
            <h2 className="text-lg lg:text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 flex items-center justify-center text-sm">2</span>
              Payment Method
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { id: 'upi', label: 'UPI / QR', desc: 'GPay, PhonePe' },
                { id: 'card', label: 'Card', desc: 'Visa, MasterCard' },
                { id: 'cod', label: 'Cash on Delivery', desc: 'Pay at Doorstep' },
              ].map(method => {
                const isActive = paymentMethod === method.id;
                return (
                  <div 
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id as 'upi' | 'card' | 'cod')}
                    className={`cursor-pointer rounded-2xl p-4 border-2 transition-all duration-300 tap-scale relative ${isActive ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-900/20' : 'border-gray-100 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600'}`}
                  >
                    {isActive && <div className="absolute top-3 right-3"><CheckCircleIcon /></div>}
                    <h3 className={`font-bold mb-1 ${isActive ? 'text-blue-700 dark:text-blue-400' : 'text-gray-800 dark:text-slate-200'}`}>{method.label}</h3>
                    <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">{method.desc}</p>
                  </div>
                )
              })}
            </div>
            
            {/* Contextual payment info based on selection */}
            {paymentMethod === 'card' && (
              <div className="mt-6 pt-6 border-t border-gray-100 dark:border-slate-700 animate-fade-in grid grid-cols-2 gap-4">
                 <div className="col-span-2">
                   <label className="block text-xs font-bold text-gray-500 mb-1">Card Number</label>
                   <input type="text" placeholder="0000 0000 0000 0000" className="w-full bg-transparent border-b-2 border-gray-200 dark:border-slate-700 pb-2 focus:outline-none focus:border-blue-500 text-gray-900 dark:text-white font-mono" />
                 </div>
                 <div>
                   <label className="block text-xs font-bold text-gray-500 mb-1">Expiry</label>
                   <input type="text" placeholder="MM/YY" className="w-full bg-transparent border-b-2 border-gray-200 dark:border-slate-700 pb-2 focus:outline-none focus:border-blue-500 text-gray-900 dark:text-white font-mono" />
                 </div>
                 <div>
                   <label className="block text-xs font-bold text-gray-500 mb-1">CVV</label>
                   <input type="password" placeholder="•••" className="w-full bg-transparent border-b-2 border-gray-200 dark:border-slate-700 pb-2 focus:outline-none focus:border-blue-500 text-gray-900 dark:text-white font-mono" />
                 </div>
              </div>
            )}
          </section>

        </form>

        {/* Summary Sidebar */}
        <div className="relative">
          <div className="sticky top-28 space-y-6">
            
            {/* Apply Coupon */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-slate-700/50">
               <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Promo Code</h3>
               <div className="flex gap-2">
                 <input 
                   type="text" 
                   value={couponCode}
                   onChange={e => setCouponCode(e.target.value)}
                   placeholder="e.g. CIVIC20" 
                   className="flex-1 bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm font-bold uppercase placeholder-gray-400 focus:outline-none" 
                 />
                 <button onClick={handleApplyCoupon} type="button" className="bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-white font-bold px-4 rounded-xl text-sm hover:bg-gray-200 dark:hover:bg-slate-600 transition">
                   Apply
                 </button>
               </div>
            </div>

            {/* Order Summary */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-slate-700/50">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Order Details</h3>
              
              {/* Iterating Cart Items quickly */}
              <div className="space-y-3 mb-6 max-h-48 overflow-y-auto scrollbar-none pr-2">
                {cartItems.map(item => (
                  <div key={item.id} className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-slate-900 shrink-0 overflow-hidden">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-gray-900 dark:text-white truncate">{item.name}</p>
                        <p className="text-gray-500 dark:text-slate-400 text-xs text-left">Qty: {item.quantity}</p>
                      </div>
                    </div>
                    <span className="font-bold text-gray-900 dark:text-white shrink-0 ml-4">{item.price}</span>
                  </div>
                ))}
              </div>
              
              <div className="border-t border-gray-100 dark:border-slate-700/50 pt-4 space-y-3 mb-6">
                <div className="flex justify-between text-sm text-gray-500 dark:text-slate-400">
                  <span>Subtotal</span>
                  <span className="font-bold text-gray-900 dark:text-white">₹{subtotal.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-500 dark:text-slate-400">
                  <span>Estimated Tax</span>
                  <span className="font-bold text-gray-900 dark:text-white">₹{tax.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-emerald-500 font-bold">
                    <span>Discount</span>
                    <span>-₹{discount.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                  </div>
                )}
                <div className="border-t border-gray-100 dark:border-slate-700/50 pt-4 mt-2" />
                <div className="flex flex-col">
                  <div className="flex justify-between text-xl text-gray-900 dark:text-white font-black">
                    <span>Total</span>
                    <span className="text-blue-600 dark:text-blue-400">₹{total.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                  </div>
                  <span className="text-[10px] text-gray-400 mt-1 text-right">Including all taxes</span>
                </div>
              </div>

              {submitError ? (
                <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 dark:border-rose-900/40 dark:bg-rose-900/20 dark:text-rose-300">
                  {submitError}
                </div>
              ) : null}

              <button 
                form="checkout-form"
                type="submit"
                disabled={isSubmitting || cartItems.length === 0}
                className="w-full py-4 rounded-xl bg-gray-900 dark:bg-blue-600 text-white font-bold tap-scale shadow-lg shadow-blue-500/10 hover:shadow-xl transition-all disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? 'Processing...' : 'Place Order'}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default CheckoutPage;
