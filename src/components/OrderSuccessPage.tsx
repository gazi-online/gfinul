import React from 'react';

interface OrderSuccessPageProps {
  orderId: string;
  onTrackOrder: () => void;
  onGoHome: () => void;
}

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-10 h-10 lg:w-14 lg:h-14 text-emerald-500">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
);

export const OrderSuccessPage: React.FC<OrderSuccessPageProps> = ({ orderId, onTrackOrder, onGoHome }) => {
  return (
    <div className="fixed inset-0 z-[100] bg-white dark:bg-slate-900 flex flex-col items-center justify-center p-6 animate-fade-in">
      <div className="max-w-md w-full text-center">
        {/* Success Icon Animation */}
        <div className="mb-8 lg:mb-10 flex justify-center">
          <div className="w-20 h-20 lg:w-28 lg:h-28 bg-emerald-50 dark:bg-emerald-900/30 rounded-full flex items-center justify-center animate-scale-in shadow-xl shadow-emerald-500/10">
            <CheckIcon />
          </div>
        </div>

        {/* Text */}
        <h2 className="text-2xl lg:text-4xl font-black text-gray-900 dark:text-white mb-3 lg:mb-4">
          Order Placed Successfully!
        </h2>
        <p className="text-gray-500 dark:text-slate-400 text-sm lg:text-lg mb-8 lg:mb-12 font-medium">
          Your order has been confirmed and is being processed.
        </p>

        {/* Order Info Card */}
        <div className="bg-gray-50 dark:bg-slate-800 rounded-[24px] p-6 lg:p-8 border border-gray-100 dark:border-slate-700/50 mb-10 lg:mb-12">
          <span className="text-[10px] lg:text-xs font-black uppercase tracking-widest text-gray-400 dark:text-slate-500 block mb-2">
            Identifier Number
          </span>
          <span className="text-lg lg:text-2xl font-mono font-bold text-blue-600 dark:text-blue-400">
            #{orderId}
          </span>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-4">
          <button
            onClick={onTrackOrder}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 lg:py-5 rounded-2xl font-bold text-sm lg:text-lg shadow-xl shadow-blue-500/20 active:scale-[0.98] transition-all"
          >
            Track My Order
          </button>
          <button
            onClick={onGoHome}
            className="w-full bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-900 dark:text-white py-4 lg:py-5 rounded-2xl font-bold text-sm lg:text-lg active:scale-[0.98] transition-all"
          >
            Go Back Home
          </button>
        </div>

        <p className="mt-10 lg:mt-16 text-[10px] lg:text-xs text-gray-400 dark:text-slate-500 font-medium">
          A confirmation email has been sent to your registered address.
        </p>
      </div>
    </div>
  );
};

export default OrderSuccessPage;
