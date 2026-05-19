import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Utensils, Sparkles, Plus, ChevronRight, ChevronLeft, Check, Star, Clock, MapPin } from 'lucide-react';
import { subscriptionPlans } from '../../data/mockData';

export default function LandingPage({
  restaurants,
  setSelectedRestaurantSlug,
  setCurrentView,
  setActiveTableNo
}) {
  const scrollRef = useRef(null);

  const scrollCards = (direction) => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.85;
    el.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  const [isDragging, setIsDragging] = useState(false);
  const [dragMoved, setDragMoved] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handlePointerDown = (e) => {
    setIsDragging(true);
    setDragMoved(false);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handlePointerLeave = () => {
    setIsDragging(false);
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    if (Math.abs(walk) > 10) {
      setDragMoved(true);
    }
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="space-y-12"
    >
      {/* Hero section */}
      <div className="relative text-center py-20 px-6 rounded-3xl overflow-hidden bg-slate-900 border border-white/5 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 via-red-500/5 to-red-500/10 z-0"></div>
        <div className="relative z-10 max-w-3xl mx-auto space-y-6">
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase"
          >
            <Sparkles className="w-4 h-4 animate-spin text-yellow-300" />
            Next-Gen Multi-Restaurant SaaS Platform
          </motion.div>
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight leading-tight text-white">
            Launch Your Brand-Customized <span className="text-gradient">Digital QR Menu</span>
          </h1>
          <p className="text-lg text-white max-w-2xl mx-auto font-light">
            Empower table ordering, real-time live menus, dynamic glassmorphic styles, and unified SaaS billing. Loved by 500+ restaurants worldwide.
          </p>

        </div>
      </div>

      {/* Subscription SaaS Details */}
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold">Premium SaaS Plans</h2>
          <p className="text-slate-400 text-sm mt-1">Choose the ultimate package fitted for your dining operations</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {subscriptionPlans.map((plan, idx) => (
            <div
              key={plan.id}
              className={`p-6 rounded-3xl border flex flex-col justify-between transition-all duration-300 hover:scale-105 ${
                idx === 1
                  ? 'bg-gradient-to-b from-red-950/20 to-slate-900 border-red-500 shadow-xl shadow-red-500/10 relative text-white'
                  : 'bg-slate-900/60 border-white/5 hover:border-white/15'
              }`}
            >
              <div>
                {idx === 1 && (
                  <span className="bg-red-500 text-white text-[10px] font-bold tracking-wider px-2.5 py-0.5 rounded-full uppercase absolute -translate-y-9">
                    Popular Plan
                  </span>
                )}
                <h3 className={`text-lg font-bold ${idx === 1 ? 'text-white' : 'text-slate-100'}`}>{plan.name}</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-3xl font-black text-white">₹{plan.price}</span>
                  <span className={`${idx === 1 ? 'text-red-400 font-medium' : 'text-slate-400'} text-xs`}>/ {plan.period}</span>
                </div>
                <ul className="mt-6 space-y-3.5 text-xs">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Check className={`w-4 h-4 flex-shrink-0 ${idx === 1 ? 'text-red-500' : 'text-green-500'}`} />
                      <span className={idx === 1 ? 'text-white font-medium' : 'text-slate-400'}>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <button
                onClick={() => setCurrentView('login')}
                className={`mt-8 w-full py-2.5 rounded-xl font-bold text-xs transition ${
                  idx === 1
                    ? 'bg-red-500 hover:bg-red-600 text-white shadow shadow-red-500/30'
                    : 'bg-white/5 hover:bg-white/10 text-slate-100'
                }`}
              >
                Select {plan.name}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Explore Section */}
      <div id="explore" className="space-y-6 pt-6 min-w-0">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Active Marketplace Restaurants</h2>
            <p className="text-slate-400 text-sm mt-1">
              Swipe or use arrows to browse — tap a card to open its mobile food menu portal
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => scrollCards('left')}
              aria-label="Scroll restaurants left"
              className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 hover:text-white transition"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => scrollCards('right')}
              aria-label="Scroll restaurants right"
              className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 hover:text-white transition"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="relative -mx-4 px-4 sm:-mx-0 sm:px-0">
          <div
            ref={scrollRef}
            onPointerDown={handlePointerDown}
            onPointerLeave={handlePointerLeave}
            onPointerUp={handlePointerUp}
            onPointerMove={handlePointerMove}
            className="flex flex-nowrap gap-6 overflow-x-auto overflow-y-hidden pb-6 scroll-smooth snap-x snap-mandatory custom-scrollbar scrollbar-thin scrollbar-thumb-slate-500 scrollbar-track-slate-100"
            style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
          >
          {restaurants.map((rest) => (
            <div
              key={rest.id}
              onClick={(e) => {
                if (dragMoved) {
                  e.preventDefault();
                  e.stopPropagation();
                  return;
                }
                setSelectedRestaurantSlug(rest.slug);
                setCurrentView('customer');
                setActiveTableNo('');
              }}
              className="flex-shrink-0 w-[300px] md:w-[360px] snap-start group rounded-3xl overflow-hidden bg-slate-900/60 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl border border-white/5 hover:border-white/20"
            >
              {/* Banner image with dark gradient removed */}
              <div className="relative h-48 overflow-hidden bg-slate-900">
                <img
                  src={rest.banner}
                  alt={rest.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                {rest.featured && (
                  <span className="absolute top-4 left-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-bold tracking-wide px-3 py-1 rounded-full uppercase shadow">
                    🔥 Featured Partner
                  </span>
                )}
                {rest.subscriptionPlan && (
                  <span className="absolute top-4 right-4 bg-slate-900/80 backdrop-blur border border-white/20 text-slate-300 text-[10px] font-semibold px-2 py-0.5 rounded uppercase">
                    {rest.subscriptionPlan} Plan
                  </span>
                )}
              </div>

              {/* Card info */}
              <div className="p-6 space-y-4">
                <div className="flex gap-4 items-start">
                  <img
                    src={rest.logo}
                    alt={rest.name}
                    className="w-14 h-14 rounded-2xl object-contain bg-slate-800 p-2 border border-white/10"
                  />
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold tracking-tight text-white group-hover:text-red-400 transition">
                      {rest.name}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1 font-semibold text-yellow-400">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        {rest.rating}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {rest.timings.open} - {rest.timings.close}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/5 flex justify-between items-center text-xs text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    <span className="truncate max-w-[150px]">{rest.contact.address}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {rest.tables.slice(0, 3).map(tab => (
                      <span
                        key={tab.tableNo}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedRestaurantSlug(rest.slug);
                          setActiveTableNo(tab.tableNo);
                          setCurrentView('customer');
                        }}
                        className="bg-white/5 border border-white/10 hover:bg-indigo-600 hover:text-white px-2 py-0.5 rounded text-[10px] transition"
                      >
                        Table {tab.tableNo}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
