import React, { useMemo } from 'react';
import { type CartItem } from '../lib/types';

// ── Icons ────────────────────────────────────────────────────────────────
const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-rose-500">
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
  </svg>
);

import { type User } from '@supabase/supabase-js';

interface CartPageProps {
  cartItems: CartItem[];
  onClose: () => void;
  updateQuantity: (id: string, delta: number) => void;
  removeItem: (id: string) => void;
  onCheckout: () => void;
  user?: User | null;
}

export const CartPage: React.FC<CartPageProps> = ({ cartItems, onClose, updateQuantity, removeItem, onCheckout, user }) => {
  if (!user) {
    return (
      <div className="fixed inset-0 z-50 bg-[#F9FAFB]/95 dark:bg-[#0f172a]/95 overflow-y-auto px-4 py-6 flex flex-col justify-center items-center animate-fade-in">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-md w-full text-center shadow-xl border border-gray-100 dark:border-slate-800 animate-scale-in">
          <div className="w-16 h-16 mx-auto bg-red-100 dark:bg-red-900/30 text-red-500 rounded-full flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" /></svg>
          </div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Login Required</h2>
          <p className="text-gray-500 dark:text-slate-400 mb-6">Please log in to view and manage your cart securely.</p>
          <button onClick={onClose} className="px-6 py-3 bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-white rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-slate-700 transition">Go Back</button>
        </div>
      </div>
    );
  }
  // Parsing Price like '₹1,299' into Number
  const totalAmount = useMemo(() => {
    return cartItems.reduce((acc, item) => {
      const numericPrice = typeof item.price === 'number' ? item.price : Number(String(item.price).replace(/[^0-9.-]+/g, ""));
      return acc + (numericPrice * item.quantity);
    }, 0);
  }, [cartItems]);

  return (
    <div className="fixed inset-0 z-50 bg-[#F9FAFB]/95 dark:bg-[#0f172a]/95 overflow-y-auto px-4 py-6 flex flex-col animate-fade-in">
      <div className="max-w-2xl w-full mx-auto flex-1 flex flex-col pt-4 lg:pt-10 pb-20">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl lg:text-3xl font-black text-gray-900 dark:text-white">Your Cart</h1>
          <button 
            onClick={onClose}
            className="p-2 lg:p-3 rounded-full bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-400 shadow-sm hover:scale-105 active:scale-95 transition-all"
          >
             <CloseIcon />
          </button>
        </div>

        {/* Content */}
        {cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 text-center animate-fade-in">
            <div className="w-24 h-24 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-4xl mb-6 shadow-inner">
              🛒
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Cart is Empty</h2>
            <p className="text-sm text-gray-500 dark:text-slate-400 mb-8">Looks like you haven't added any products yet.</p>
            <button 
              onClick={onClose}
              className="px-8 py-3.5 rounded-xl bg-blue-600 text-white font-bold tap-scale shadow-lg shadow-blue-500/20"
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">
            {/* Main Items List */}
            <div className="flex-1 space-y-4 lg:space-y-5">
              {cartItems.map((item, idx) => (
                <div key={item.id} className="bg-white dark:bg-slate-800 rounded-[20px] p-4 flex gap-4 items-center shadow-sm border border-gray-100 dark:border-slate-700/50 animate-slide-up" style={{ animationDelay: `${idx * 50}ms` }}>
                  {/* Image */}
                  <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-xl overflow-hidden bg-gray-50 dark:bg-slate-900/50 shrink-0">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 dark:text-white text-sm lg:text-base truncate mb-1">{item.name}</h3>
                    <p className="font-extrabold text-blue-600 dark:text-blue-400 mb-3">{item.price}</p>
                    
                    {/* Controls */}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center w-max bg-gray-50 dark:bg-slate-900/50 rounded-xl p-1 border border-gray-100 dark:border-slate-700">
                        <button 
                          onClick={() => updateQuantity(item.id, -1)}
                          className="w-7 h-7 lg:w-8 lg:h-8 flex items-center justify-center rounded-lg bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 shadow-sm hover:bg-gray-100 dark:hover:bg-slate-700 active:scale-95 transition-all text-lg leading-none"
                        >−</button>
                        <span className="w-8 text-center text-sm font-bold text-gray-900 dark:text-white">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, 1)}
                          className="w-7 h-7 lg:w-8 lg:h-8 flex items-center justify-center rounded-lg bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 shadow-sm hover:bg-gray-100 dark:hover:bg-slate-700 active:scale-95 transition-all text-lg leading-none"
                        >+</button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Remove specific */}
                  <div className="self-start">
                    <button 
                      onClick={() => removeItem(item.id)}
                      className="p-2.5 rounded-full bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 transition-colors tap-scale"
                    >
                       <TrashIcon />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary Sidebar */}
            <div className="lg:w-[320px] shrink-0">
              <div className="bg-white dark:bg-slate-800 rounded-[20px] p-6 shadow-sm border border-gray-100 dark:border-slate-700/50 sticky top-24">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Order Summary</h3>
                
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-sm text-gray-500 dark:text-slate-400">
                    <span>Subtotal</span>
                    <span className="font-bold text-gray-900 dark:text-white">₹{totalAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-500 dark:text-slate-400">
                    <span>Taxes & Fees</span>
                    <span className="font-bold text-gray-900 dark:text-white">₹0.00</span>
                  </div>
                  <div className="border-t border-gray-100 dark:border-slate-700/50 pt-4 mt-2" />
                  <div className="flex justify-between text-base lg:text-lg text-gray-900 dark:text-white font-black">
                    <span>Total</span>
                    <span>₹{totalAmount.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <button 
                  className="w-full py-4 rounded-xl bg-gray-900 dark:bg-blue-600 text-white font-bold tap-scale shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 mb-3"
                  onClick={onCheckout}
                >
                  Proceed to Checkout
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </button>
                <div className="text-center">
                  <p className="text-[10px] text-gray-400 dark:text-slate-500 uppercase font-bold tracking-widest flex items-center justify-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" /></svg>
                    Secure Checkout
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPage;
