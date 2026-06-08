import React from 'react';
import { motion } from 'framer-motion';
import { Star, MapPin } from 'lucide-react';

const resolveImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:image')) {
    return url;
  }
  const baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
  if (url.startsWith('/')) {
    return `${baseUrl}${url}`;
  }
  return `${baseUrl}/${url}`;
};

export const PlaceCard = ({
  images,
  logo,
  tagline,
  tags,
  rating,
  title,
  hostType,
  address,
  description,
  onClick
}) => {
  const bannerImg = images && images[0] ? images[0] : '';
  const timingText = tags && tags[0] ? tags[0] : '30-40 mins';
  const addressText = address || hostType || 'Hyderabad';

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      whileHover={{ 
        scale: 0.98,
        transition: { duration: 0.2 }
      }}
      onClick={onClick}
      className="w-full overflow-hidden bg-transparent cursor-pointer text-left select-none flex flex-col space-y-3"
    >
      {/* Banner Image Container */}
      <div className="relative aspect-[16/10] w-full rounded-[20px] overflow-hidden bg-slate-100 shadow-sm shrink-0 group">
        <img
          src={resolveImageUrl(bannerImg)}
          alt={title}
          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
        />

        {/* Dark linear gradient overlay at bottom of banner image */}
        <div className="absolute inset-x-0 bottom-0 h-[60px] bg-gradient-to-t from-black/85 via-black/35 to-transparent pointer-events-none z-10"></div>
        
        {/* Bold Swiggy-Style Discount/Tagline text */}
        <div className="absolute bottom-3 left-4 z-20 font-black text-white text-[18px] tracking-tight uppercase drop-shadow-sm line-clamp-1 pr-4">
          {tagline ? tagline : "50% OFF UPTO ₹100"}
        </div>
      </div>

      {/* Details Container */}
      <div className="px-1.5 space-y-1">
        {/* Restaurant Title */}
        <h3 className="text-[17px] font-black text-slate-800 tracking-tight leading-tight truncate">
          {title}
        </h3>

        {/* Rating and Timings line */}
        <div className="flex items-center gap-1.5 text-[14px] font-extrabold text-slate-800">
          <span className="text-slate-700 font-extrabold text-[13px] tracking-tight shrink-0">{timingText}</span>
        </div>

        {/* Cuisines / Category List (Tagline description or defaults) */}
        <div className="text-[13px] font-extrabold text-slate-400 truncate tracking-tight">
          {tagline ? tagline : "Continental, Indian, Beverages, Desserts"}
        </div>

        {/* Location / Address */}
        <div className="text-[13px] font-extrabold text-slate-400 truncate tracking-tight flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>{addressText}</span>
        </div>
      </div>
    </motion.div>
  );
};
