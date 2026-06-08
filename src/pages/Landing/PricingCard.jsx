import React from 'react';
import { motion } from 'framer-motion';

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

const CheckIcon = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={cn('w-5 h-5', className)}
  >
    <path
      fillRule="evenodd"
      d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
      clipRule="evenodd"
    />
  </svg>
);

const PricingCard = React.forwardRef(
  (
    {
      className,
      variant = 'default',
      planName,
      description,
      price,
      billingCycle,
      features,
      buttonText,
      isCurrentPlan = false,
      icon,
      onSelect,
      ...props
    },
    ref
  ) => {
    // Card styles based on variant
    const isPopular = variant === 'popular';
    
    const cardBase = 'relative flex flex-col p-8 rounded-3xl border transition-all duration-300';
    const variantStyles = isPopular
      ? 'bg-slate-950 border-slate-950 shadow-2xl -translate-y-2 text-white'
      : 'bg-white border-slate-200 shadow-sm hover:border-slate-300 text-slate-900';

    return (
      <motion.div
        ref={ref}
        className={cn(cardBase, variantStyles, className)}
        {...props}
        whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
      >
        {/* Popular Badge */}
        {isPopular && (
          <div className="absolute top-0 right-8 -translate-y-1/2 bg-white text-slate-950 text-[10px] font-bold uppercase tracking-wider px-4 py-1.5 rounded-full shadow-md border border-slate-200">
            POPULAR PLAN
          </div>
        )}

        {/* Header */}
        <div className="flex items-center gap-4 mb-4">
          {icon && (
            <div className={`flex items-center justify-center w-12 h-12 rounded-2xl ${isPopular ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-900'}`}>
              {icon}
            </div>
          )}
          <div>
            <h3 className={`text-xl font-bold ${isPopular ? 'text-white' : 'text-slate-900'}`}>{planName}</h3>
            <p className={`text-sm ${isPopular ? 'text-slate-400' : 'text-slate-500'}`}>{description}</p>
          </div>
        </div>

        {/* Price */}
        <div className="my-4 flex items-baseline gap-2">
          <span className={`text-4xl font-black ${isPopular ? 'text-white' : 'text-slate-900'}`}>₹{price}</span>
          <span className={`text-sm font-medium ${isPopular ? 'text-slate-400' : 'text-slate-500'}`}>/ {billingCycle}</span>
        </div>

        {/* Features */}
        <ul className="mt-6 space-y-3.5 text-xs flex-1 mb-8">
          {features.map((feature, index) => {
            const isHighlighted = feature.toLowerCase().includes('try 1 month') || feature.toLowerCase().includes('free trial');
            return (
              <li key={index} className="flex items-center gap-3">
                <CheckIcon className={cn(
                  "w-4 h-4 flex-shrink-0", 
                  isPopular 
                    ? (isHighlighted ? "text-[#ccff00]" : "text-white") 
                    : (isHighlighted ? "text-red-500" : "text-slate-900")
                )} />
                <span className={cn(
                  isPopular 
                    ? (isHighlighted ? 'text-[#ccff00] font-extrabold' : 'text-slate-300') 
                    : (isHighlighted ? 'text-red-600 font-extrabold' : 'text-slate-600')
                )}>
                  {feature}
                </span>
              </li>
            );
          })}
        </ul>

        {/* Button */}
        <button
          onClick={onSelect}
          disabled={isCurrentPlan}
          className={cn(
            "w-full py-3 rounded-xl font-bold text-xs transition-all duration-300 mt-auto cursor-pointer",
            isCurrentPlan
              ? "bg-slate-200 text-slate-500 cursor-not-allowed"
              : isPopular
              ? "bg-[#ccff00] hover:bg-[#bbf000] text-slate-950 font-black shadow-md shadow-[#ccff00]/10 hover:scale-[1.02]"
              : "bg-slate-900 hover:bg-slate-800 text-white shadow-sm hover:scale-[1.02]"
          )}
        >
          {isCurrentPlan ? 'Current plan' : buttonText}
        </button>

      </motion.div>
    );
  }
);

PricingCard.displayName = 'PricingCard';

export default PricingCard;
