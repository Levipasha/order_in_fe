import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Play, Volume2, VolumeX, Tv, Clock, CheckCircle2, AlertCircle, Sparkles, QrCode, Check } from 'lucide-react';
import { apiRequest } from '../../utils/api';
import Loader from '../Loader';
import { socket, joinRoom } from '../../utils/socket';

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

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

export default function QueueTvView({ restaurantSlug, onBack }) {
  const [orders, setOrders] = useState([]);
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [timeString, setTimeString] = useState('');
  const [dateString, setDateString] = useState('');

  const shouldReduceMotion = useReducedMotion();
  const shouldAnimate = !shouldReduceMotion;

  const prevReadyIdsRef = useRef(new Set());
  const initialLoadRef = useRef(true);

  // 1. Clock timer
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setDateString(now.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // 2. synthesized chime sound using Web Audio API
  const playDingDong = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      
      // Tone 1: G5 (783.99 Hz)
      const osc1 = audioCtx.createOscillator();
      const gain1 = audioCtx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(783.99, audioCtx.currentTime);
      gain1.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.8);
      osc1.connect(gain1);
      gain1.connect(audioCtx.destination);
      osc1.start();
      osc1.stop(audioCtx.currentTime + 0.8);

      // Tone 2: E5 (659.25 Hz) after 250ms
      setTimeout(() => {
        if (audioCtx.state === 'closed') return;
        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(659.25, audioCtx.currentTime);
        gain2.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.8);
        osc2.connect(gain2);
        gain2.connect(audioCtx.destination);
        osc2.start();
        osc2.stop(audioCtx.currentTime + 0.8);
      }, 250);
    } catch (err) {
      console.warn("Dingdong audio synthesis failed:", err);
    }
  };

  const renderOrderCard = (order, variant) => {
    const isReady = variant === 'ready';
    
    // Determine cover image
    const firstItemWithImage = (order.items || []).find(i => i.image);
    const coverImage = firstItemWithImage 
      ? resolveImageUrl(firstItemWithImage.image)
      : 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=600&auto=format&fit=crop';

    // Name / Title: Main item name or Order ID
    const mainItem = order.items && order.items[0];
    const mainTitle = mainItem 
      ? `${mainItem.name}${mainItem.quantity > 1 ? ` (x${mainItem.quantity})` : ''}`
      : `Order #${order.id?.slice(-4).toUpperCase()}`;

    // Description: remaining items list
    const remainingItems = order.items && order.items.slice(1);
    const description = (remainingItems && remainingItems.length > 0)
      ? remainingItems.map(i => `${i.name} x${i.quantity}`).join(', ')
      : order.tableNo ? 'Dine-in Order' : 'Counter Pickup Order';


    const containerVariants = {
      rest: { 
        scale: 1,
        y: 0,
      },
      hover: shouldAnimate ? { 
        scale: 1.02, 
        y: -4,
        transition: { 
          type: "spring", 
          stiffness: 400, 
          damping: 28,
          mass: 0.6,
        }
      } : {},
    };

    const imageVariants = {
      rest: { scale: 1 },
      hover: { scale: 1.05 },
    };

    const contentVariants = {
      hidden: { 
        opacity: 0, 
        y: 20,
      },
      visible: { 
        opacity: 1, 
        y: 0,
        transition: {
          type: "spring",
          stiffness: 400,
          damping: 28,
          mass: 0.6,
          staggerChildren: 0.08,
          delayChildren: 0.1,
        },
      },
    };

    const itemVariants = {
      hidden: { 
        opacity: 0, 
        y: 15,
        scale: 0.95,
      },
      visible: { 
        opacity: 1, 
        y: 0,
        scale: 1,
        transition: {
          type: "spring",
          stiffness: 400,
          damping: 25,
          mass: 0.5,
        },
      },
    };

    const letterVariants = {
      hidden: { 
        opacity: 0, 
        scale: 0.8,
      },
      visible: { 
        opacity: 1, 
        scale: 1,
        transition: {
          type: "spring",
          damping: 8,
          stiffness: 200,
          mass: 0.8,
        },
      },
    };

    return (
      <motion.div
        key={order.id}
        initial="rest"
        whileHover="hover"
        variants={containerVariants}
        className={cn(
          "relative w-full h-80 rounded-3xl overflow-hidden shadow-md cursor-pointer group backdrop-blur-sm border",
          isReady ? "border-emerald-200" : "border-slate-200"
        )}
      >
        {/* Full Cover Image */}
        <motion.img
          src={coverImage}
          alt={mainTitle}
          className="absolute inset-0 w-full h-full object-cover"
          variants={imageVariants}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />

        {/* Smooth Blur Overlay - Multiple layers for seamless fade */}
        <div className="absolute inset-0 bg-gradient-to-t from-white/95 via-white/40 via-white/20 via-white/10 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-white/90 via-white/60 via-white/30 via-white/15 via-white/8 to-transparent backdrop-blur-[0.5px]" />
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white/85 via-white/40 to-transparent backdrop-blur-sm" />

        {/* Content */}
        <motion.div 
          variants={contentVariants}
          initial="hidden"
          animate="visible"
          className="absolute bottom-0 left-0 right-0 p-5 space-y-3 text-left"
        >
          {/* Name and Verification */}
          <motion.div variants={itemVariants} className="flex items-center gap-2">
            <motion.h2 
              className="text-lg font-black text-slate-800 tracking-tight leading-tight line-clamp-1 flex-1"
              variants={{
                visible: {
                  transition: {
                    staggerChildren: 0.02,
                  }
                }
              }}
            >
              {mainTitle.split("").map((letter, index) => (
                <motion.span
                  key={index}
                  variants={letterVariants}
                  className="inline-block"
                >
                  {letter === " " ? "\u00A0" : letter}
                </motion.span>
              ))}
            </motion.h2>

            {isReady ? (
              <motion.div 
                variants={itemVariants}
                className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500 text-white shrink-0 shadow-sm"
                whileHover={{ 
                  scale: 1.1, 
                  rotate: 5,
                  transition: { type: "spring", stiffness: 400, damping: 20 }
                }}
              >
                <Check className="w-3 h-3" />
              </motion.div>
            ) : (
              <motion.div 
                variants={itemVariants}
                className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-500 text-white shrink-0 shadow-sm"
              >
                <Clock className="w-3 h-3 animate-spin" style={{ animationDuration: '3s' }} />
              </motion.div>
            )}
          </motion.div>

          {/* Description / Extra items */}
          <motion.p 
            variants={itemVariants}
            className="text-slate-500 text-xs font-bold leading-relaxed line-clamp-2 h-8"
          >
            {description}
          </motion.p>

          {/* Order Info Badge as Follow Button replacement */}
          <motion.div
            variants={itemVariants}
            whileHover={{ 
              scale: 1.02,
              transition: { type: "spring", stiffness: 400, damping: 25 }
            }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              "w-full py-2.5 px-4 rounded-2xl font-black text-xs text-center border shadow-sm transition-all duration-200 select-none",
              isReady 
                ? "bg-emerald-500 border-emerald-600 text-white" 
                : "bg-amber-500 border-amber-600 text-white"
            )}
          >
            {order.tableNo ? `TABLE ${order.tableNo.toUpperCase()}` : 'COUNTER PICKUP'}
          </motion.div>
        </motion.div>

        {/* Pulse beacon inside ready card */}
        {isReady && (
          <div className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping z-10"></div>
        )}
      </motion.div>
    );
  };

  const fetchQueueRef = useRef(null);

  // 3. Define the main queue fetcher & start polling fallback
  useEffect(() => {
    let active = true;

    const fetchQueue = async () => {
      if (!restaurantSlug) return;
      try {
        const res = await apiRequest(`/orders/public/queue/${restaurantSlug}`);
        if (!active) return;
        
        if (res.success) {
          setOrders(res.orders || []);
          if (res.restaurant) {
            setRestaurant(res.restaurant);
          }
          setError(null);

          // Check if any order has newly transitioned to "ready"
          const currentReadyIds = new Set(
            (res.orders || [])
              .filter(o => o.orderStatus === 'ready')
              .map(o => o.id || o._id)
          );

          if (!initialLoadRef.current) {
            let hasNewReady = false;
            for (let id of currentReadyIds) {
              if (!prevReadyIdsRef.current.has(id)) {
                hasNewReady = true;
                break;
              }
            }
            if (hasNewReady) {
              playDingDong();
            }
          } else {
            initialLoadRef.current = false;
          }

          prevReadyIdsRef.current = currentReadyIds;
        } else {
          setError(res.error || "Failed to load queue details.");
        }
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchQueueRef.current = fetchQueue;
    fetchQueue();

    const interval = setInterval(fetchQueue, 8000); // 8s polling fallback

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [restaurantSlug, soundEnabled]);

  // 4. Socket.IO Room Join & Instant updates
  useEffect(() => {
    if (!restaurant?._id) return;

    joinRoom(`queue_${restaurant._id}`);

    const handleQueueUpdate = (data) => {
      console.log('📡 Lobby TV received real-time queue status push:', data);
      if (fetchQueueRef.current) {
        fetchQueueRef.current();
      }
    };

    socket.on('queue_update', handleQueueUpdate);

    return () => {
      socket.off('queue_update', handleQueueUpdate);
    };
  }, [restaurant?._id]);

  // Derived columns
  const preparingOrders = useMemo(() => {
    return orders.filter(o => o.orderStatus === 'placed' || o.orderStatus === 'preparing');
  }, [orders]);

  const readyOrders = useMemo(() => {
    return orders.filter(o => o.orderStatus === 'ready');
  }, [orders]);

  if (loading && !restaurant) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col items-center justify-center gap-4">
        <Loader message="Opening Lobby Queue TV Channel..." size="w-28 h-28" dark={false} />
      </div>
    );
  }

  // ── REJECTION / EXPIRATION SCREEN OVERLAYS ──────────────────────────
  if (restaurant && restaurant.isApproved === false) {
    const primaryColor = restaurant.theme?.primaryColor || '#ff385c';
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col items-center justify-center p-8 select-none font-sans">
        <div className="bg-white border border-slate-200 rounded-[32px] shadow-xl p-10 max-w-xl text-center space-y-6 flex flex-col items-center">
          {restaurant.logo ? (
            <img src={resolveImageUrl(restaurant.logo)} className="w-24 h-24 rounded-3xl object-contain bg-white p-2 border border-slate-200 shadow-sm" alt="logo" />
          ) : (
            <div className="w-24 h-24 rounded-3xl flex items-center justify-center text-4xl font-black text-white" style={{ backgroundColor: primaryColor }}>
              {restaurant.name?.charAt(0) || '🏪'}
            </div>
          )}
          <h2 className="text-3xl font-black tracking-tight text-slate-900">{restaurant.name || 'Restaurant Queue'}</h2>
          <div className="h-0.5 w-16" style={{ backgroundColor: primaryColor }}></div>
          <p className="text-base font-bold text-slate-600 leading-relaxed">
            Contact Orderin support to know your rejection
          </p>
        </div>
      </div>
    );
  }

  if (restaurant && (restaurant.subscriptionActive === false || restaurant.isActive === false)) {
    const primaryColor = restaurant.theme?.primaryColor || '#ff385c';
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col items-center justify-center p-8 select-none font-sans">
        <div className="bg-white border border-slate-200 rounded-[32px] shadow-xl p-10 max-w-xl text-center space-y-6 flex flex-col items-center">
          {restaurant.logo ? (
            <img src={resolveImageUrl(restaurant.logo)} className="w-24 h-24 rounded-3xl object-contain bg-white p-2 border border-slate-200 shadow-sm" alt="logo" />
          ) : (
            <div className="w-24 h-24 rounded-3xl flex items-center justify-center text-4xl font-black text-white" style={{ backgroundColor: primaryColor }}>
              {restaurant.name?.charAt(0) || '🏪'}
            </div>
          )}
          <h2 className="text-3xl font-black tracking-tight text-slate-900">{restaurant.name || 'Restaurant Queue'}</h2>
          <div className="h-0.5 w-16" style={{ backgroundColor: primaryColor }}></div>
          <p className="text-base font-bold text-slate-600 leading-relaxed">
            Please renew your profile for the further services in that
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col justify-between overflow-hidden select-none">
      
      {/* ── TOP HEADLINE BAR ────────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-200 py-3.5 px-6 flex justify-between items-center shadow-sm">
        
        {/* Left branding */}
        <div className="flex items-center gap-4">
          {restaurant?.logo ? (
            <img src={resolveImageUrl(restaurant.logo)} className="w-12 h-12 rounded-2xl object-contain bg-white p-1 border border-slate-200 shadow-sm" alt="logo" />
          ) : (
            <div className="w-12 h-12 rounded-2xl bg-red-500 flex items-center justify-center text-xl font-black text-white">
              {restaurant?.name?.charAt(0) || '🏪'}
            </div>
          )}
          <div className="text-left">
            <h1 className="text-xl font-black tracking-tight text-slate-900">{restaurant?.name || 'Restaurant Queue'}</h1>
            <span className="text-[10px] uppercase font-black tracking-widest text-emerald-600 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span> Live Kitchen Display
            </span>
          </div>
        </div>

        {/* Center Title */}
        <div className="hidden md:flex items-center gap-2.5 bg-slate-50 border border-slate-200 px-6 py-2 rounded-2xl">
          <Tv className="w-5 h-5 text-red-500 animate-pulse" />
          <span className="text-xs uppercase font-extrabold tracking-widest text-slate-600">Order Collection Screen</span>
        </div>

        {/* Right Info Controls */}
        <div className="flex items-center gap-6">
          
          {/* Sound Enabler switch */}
          <button 
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              if (!soundEnabled) {
                setTimeout(() => playDingDong(), 100);
              }
            }} 
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition text-xs font-black uppercase tracking-wider cursor-pointer ${
              soundEnabled 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100' 
                : 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden sm:inline">{soundEnabled ? 'Chime ON' : 'Muted'}</span>
          </button>

          {/* Time & Date */}
          <div className="text-right">
            <div className="text-lg font-black text-slate-900 font-mono tracking-wider">{timeString}</div>
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{dateString}</div>
          </div>

        </div>
      </div>

      {/* ── ERROR ALERT BANNER ─────────────────────────────────────────── */}
      {error && (
        <div className="bg-red-50 border-b border-red-200 py-2.5 px-6 flex items-center gap-2.5 text-xs text-red-600">
          <AlertCircle className="w-4.5 h-4.5 text-red-500 flex-shrink-0" />
          <p className="font-bold">TV Channel Offline: {error}. Attempting auto-reconnection...</p>
        </div>
      )}

      {/* ── CORE WIDESCREEN DOUBLE COLUMN QUEUE SCREEN ─────────────────── */}
      <div className="flex-grow grid grid-cols-2 gap-0 overflow-hidden relative">
        
        {/* Divider line between preparing and ready */}
        <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-slate-200 shadow-md z-10"></div>

        {/* LEFT COLUMN: IN PREPARATION */}
        <div className="p-8 flex flex-col gap-6 overflow-hidden bg-white">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-amber-200 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 border border-amber-100">
                <Clock className="w-5.5 h-5.5 animate-spin" style={{ animationDuration: '6s' }} />
              </div>
              <div className="text-left">
                <h2 className="text-2xl font-black uppercase tracking-wider text-amber-600">Preparing</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Now Cooking in Kitchen</p>
              </div>
            </div>
            <span className="text-sm font-black text-amber-700 bg-amber-50 border border-amber-100 px-3.5 py-1 rounded-full font-mono">
              {preparingOrders.length} ORDERS
            </span>
          </div>

          {/* Grid Layout of Preparing Orders */}
          <div className="flex-1 overflow-y-auto no-scrollbar pt-2">
            {preparingOrders.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <AnimatePresence>
                  {preparingOrders.map(order => renderOrderCard(order, 'preparing'))}
                </AnimatePresence>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center gap-3 opacity-60">
                <span className="text-4xl">🍳</span>
                <p className="text-xs uppercase font-extrabold text-slate-400 tracking-wider">No active cooking orders</p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: READY FOR COLLECTION */}
        <div className="p-8 flex flex-col gap-6 overflow-hidden bg-slate-50/50">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-emerald-200 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 border border-emerald-100">
                <CheckCircle2 className="w-5.5 h-5.5 animate-bounce" />
              </div>
              <div className="text-left">
                <h2 className="text-2xl font-black uppercase tracking-wider text-emerald-600">Ready</h2>
                <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest animate-pulse">Please Collect from Counter</p>
              </div>
            </div>
            <span className="text-sm font-black text-emerald-700 bg-emerald-50 border border-emerald-100 px-3.5 py-1 rounded-full font-mono">
              {readyOrders.length} ORDERS
            </span>
          </div>

          {/* Grid Layout of Ready Orders */}
          <div className="flex-1 overflow-y-auto no-scrollbar pt-2">
            {readyOrders.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <AnimatePresence>
                  {readyOrders.map(order => renderOrderCard(order, 'ready'))}
                </AnimatePresence>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center gap-3 opacity-60">
                <span className="text-4xl">🔔</span>
                <p className="text-xs uppercase font-extrabold text-slate-400 tracking-wider">Awaiting ready notifications</p>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
