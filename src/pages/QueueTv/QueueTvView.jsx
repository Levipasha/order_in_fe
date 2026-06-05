import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Volume2, VolumeX, Tv, Clock, CheckCircle2, AlertCircle, Sparkles, QrCode } from 'lucide-react';
import { apiRequest } from '../../utils/api';
import Loader from '../Loader';
import { socket, joinRoom } from '../../utils/socket';

export default function QueueTvView({ restaurantSlug, onBack }) {
  const [orders, setOrders] = useState([]);
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [timeString, setTimeString] = useState('');
  const [dateString, setDateString] = useState('');

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

  const fetchQueueRef = useRef(null);

  // 3. Define the main queue fetcher & start polling fallback
  useEffect(() => {
    let active = true;

    const fetchQueue = async () => {
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

  // QR Code URL for Dine-in orders
  const publicMenuUrl = `${window.location.origin}/restaurant/${restaurantSlug}`;
  const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(publicMenuUrl)}&color=000000&bgcolor=ffffff`;

  if (loading && !restaurant) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center gap-4">
        <Loader message="Opening Lobby Queue TV Channel..." size="w-28 h-28" dark={true} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans flex flex-col justify-between overflow-hidden select-none select-none">
      
      {/* ── TOP HEADLINE BAR ────────────────────────────────────────────── */}
      <div className="bg-slate-900 border-b-2 border-slate-800 py-3 px-6 flex justify-between items-center shadow-lg">
        
        {/* Left branding */}
        <div className="flex items-center gap-4">
          {restaurant?.logo ? (
            <img src={restaurant.logo} className="w-12 h-12 rounded-2xl object-contain bg-white p-1 border border-slate-700 shadow-md" alt="logo" />
          ) : (
            <div className="w-12 h-12 rounded-2xl bg-red-600 flex items-center justify-center text-xl font-black">
              {restaurant?.name?.charAt(0) || '🏪'}
            </div>
          )}
          <div>
            <h1 className="text-xl font-black tracking-tight text-white">{restaurant?.name || 'Restaurant Queue'}</h1>
            <span className="text-[10px] uppercase font-black tracking-widest text-emerald-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span> Live Kitchen Display
            </span>
          </div>
        </div>

        {/* Center Title */}
        <div className="hidden md:flex items-center gap-2.5 bg-slate-950 border border-slate-800 px-6 py-2 rounded-2xl shadow-inner">
          <Tv className="w-5 h-5 text-red-500 animate-pulse" />
          <span className="text-xs uppercase font-extrabold tracking-widest text-slate-300">Order Collection Screen</span>
        </div>

        {/* Right Info Controls */}
        <div className="flex items-center gap-6">
          
          {/* Sound Enabler switch */}
          <button 
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              // Trigger a beep to test context on enablement
              if (!soundEnabled) {
                setTimeout(() => playDingDong(), 100);
              }
            }} 
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition text-xs font-black uppercase tracking-wider ${
              soundEnabled 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden sm:inline">{soundEnabled ? 'Chime ON' : 'Muted'}</span>
          </button>

          {/* Time & Date */}
          <div className="text-right">
            <div className="text-lg font-black text-slate-100 font-mono tracking-wider">{timeString}</div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{dateString}</div>
          </div>

          {/* Exit Back Button */}
          {onBack && (
            <button 
              onClick={onBack} 
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold px-4 py-2 rounded-xl transition"
            >
              Exit
            </button>
          )}
        </div>
      </div>

      {/* ── ERROR ALERT BANNER ─────────────────────────────────────────── */}
      {error && (
        <div className="bg-red-950/80 border-b border-red-800/50 py-2.5 px-6 flex items-center gap-2.5 text-xs text-red-300">
          <AlertCircle className="w-4.5 h-4.5 text-red-400 flex-shrink-0" />
          <p className="font-bold">TV Channel Offline: {error}. Attempting auto-reconnection...</p>
        </div>
      )}

      {/* ── CORE WIDESCREEN DOUBLE COLUMN QUEUE SCREEN ─────────────────── */}
      <div className="flex-1 grid grid-cols-2 gap-0 overflow-hidden relative">
        
        {/* Divider line between preparing and ready */}
        <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-slate-800/80 shadow-2xl z-10"></div>

        {/* LEFT COLUMN: IN PREPARATION */}
        <div className="p-8 flex flex-col gap-6 overflow-hidden bg-slate-950">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-amber-500/20 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500">
                <Clock className="w-5.5 h-5.5 animate-spin" style={{ animationDuration: '6s' }} />
              </div>
              <div>
                <h2 className="text-2xl font-black uppercase tracking-wider text-amber-400">Preparing</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Now Cooking in Kitchen</p>
              </div>
            </div>
            <span className="text-sm font-black text-amber-500 bg-amber-500/10 px-3.5 py-1 rounded-full font-mono">
              {preparingOrders.length} ORDERS
            </span>
          </div>

          {/* Grid Layout of Preparing Orders */}
          <div className="flex-1 overflow-y-auto no-scrollbar pt-2">
            {preparingOrders.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <AnimatePresence>
                  {preparingOrders.map(order => (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="bg-slate-900/60 border-2 border-slate-800 rounded-3xl p-5 text-center flex flex-col justify-center gap-2 shadow-md hover:border-amber-500/35 transition"
                    >
                      {/* Dish names */}
                      <div className="space-y-1">
                        {(order.items || []).map((item, idx) => (
                          <p key={idx} className="text-base font-black text-slate-100 leading-tight">
                            {item.name} {item.quantity > 1 && <span className="text-amber-400">×{item.quantity}</span>}
                          </p>
                        ))}
                        {(!order.items || order.items.length === 0) && (
                          <p className="text-base font-black text-slate-400">Order #{order.id.slice(-4).toUpperCase()}</p>
                        )}
                      </div>
                      {order.tableNo && (
                        <span className="text-[10px] font-black text-amber-500 uppercase tracking-wider bg-amber-500/10 px-2 py-0.5 rounded-md inline-block mx-auto">
                          Table {order.tableNo}
                        </span>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center gap-3 opacity-60">
                <span className="text-4xl">🍳</span>
                <p className="text-xs uppercase font-extrabold text-slate-500 tracking-wider">No active cooking orders</p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: READY FOR COLLECTION */}
        <div className="p-8 flex flex-col gap-6 overflow-hidden bg-slate-950/40">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-emerald-500/20 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-5.5 h-5.5 animate-bounce" />
              </div>
              <div>
                <h2 className="text-2xl font-black uppercase tracking-wider text-emerald-400">Ready</h2>
                <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest animate-pulse">Please Collect from Counter</p>
              </div>
            </div>
            <span className="text-sm font-black text-emerald-400 bg-emerald-500/10 px-3.5 py-1 rounded-full font-mono">
              {readyOrders.length} ORDERS
            </span>
          </div>

          {/* Grid Layout of Ready Orders */}
          <div className="flex-1 overflow-y-auto no-scrollbar pt-2">
            {readyOrders.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <AnimatePresence>
                  {readyOrders.map(order => (
                    <motion.div
                      key={order.id}
                      initial={{ scale: 0.6, rotate: -2, opacity: 0 }}
                      animate={{ 
                        scale: 1, 
                        rotate: 0, 
                        opacity: 1,
                        boxShadow: '0 0 25px rgba(16, 185, 129, 0.25)',
                        borderColor: '#10b981'
                      }}
                      exit={{ scale: 0.6, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                      className="bg-emerald-950/45 border-4 border-emerald-500 rounded-[32px] p-6 text-center flex flex-col justify-center gap-2 relative overflow-hidden"
                    >
                      {/* Pulse beacon inside card */}
                      <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-400 animate-ping"></div>

                      {/* Dish names */}
                      <div className="space-y-1">
                        {(order.items || []).map((item, idx) => (
                          <p key={idx} className="text-lg font-black text-emerald-200 leading-tight">
                            {item.name} {item.quantity > 1 && <span className="text-emerald-400">×{item.quantity}</span>}
                          </p>
                        ))}
                        {(!order.items || order.items.length === 0) && (
                          <p className="text-lg font-black text-emerald-300">Order #{order.id.slice(-4).toUpperCase()}</p>
                        )}
                      </div>
                      {order.tableNo ? (
                        <span className="text-xs font-black text-white uppercase tracking-wider bg-emerald-600 px-3 py-1 rounded-full inline-block mx-auto shadow-sm">
                          Table {order.tableNo}
                        </span>
                      ) : (
                        <span className="text-[9px] font-extrabold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded-md inline-block mx-auto">
                          Counter Pickup
                        </span>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center gap-3 opacity-60">
                <span className="text-4xl">🔔</span>
                <p className="text-xs uppercase font-extrabold text-slate-500 tracking-wider">Awaiting ready notifications</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ── FOOTER: SCROLLING TICKER & SCAN QR CODE ───────────────────── */}
      <div className="bg-slate-900 border-t-2 border-slate-800 h-28 flex items-center relative z-20 shadow-2xl overflow-hidden">
        
        {/* Ticker message */}
        <div className="flex-1 h-full flex items-center overflow-hidden pl-6">
          <div className="w-full">
            <div className="text-[10px] uppercase font-black tracking-widest text-slate-500 mb-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-yellow-500" /> Ticker Announcement
            </div>
            <div className="relative w-full overflow-hidden h-10 flex items-center">
              {/* Infinite Horizontal Marquee */}
              <div className="animate-marquee whitespace-nowrap text-lg font-bold text-slate-300 tracking-wide flex items-center gap-8">
                <span>📢 Please verify your ticket number with the lobby display board before collecting your hot meal.</span>
                <span>•</span>
                <span>👨‍🍳 Freshly cooked, premium quality organic ingredients straight from our kitchen!</span>
                <span>•</span>
                <span>📱 Scan the QR code on the right to browse our full digital menu and place a secure online order from your phone!</span>
                <span>•</span>
                <span>❤️ Enjoy your delicious dining experience! Powered by Orderin Premium Systems.</span>
              </div>
            </div>
          </div>
        </div>

        {/* QR Code Segment for Dine-in scanned menus */}
        <div className="h-full w-80 bg-slate-950 border-l border-slate-800 flex items-center gap-4 px-6 relative flex-shrink-0">
          <div className="flex-1 text-left">
            <span className="text-[8px] uppercase font-black tracking-widest text-emerald-400 flex items-center gap-1">
              <QrCode className="w-3 h-3 text-emerald-400" /> Scan to Order
            </span>
            <h3 className="text-xs font-black text-white leading-tight">Dine-in Menu</h3>
            <p className="text-[8px] text-slate-400 mt-0.5 leading-relaxed">
              Scan from your phone to order instantly!
            </p>
          </div>
          <div className="w-20 h-20 bg-white rounded-xl p-1.5 flex items-center justify-center shadow-lg border border-slate-700 flex-shrink-0 relative overflow-hidden group">
            <img src={qrCodeImageUrl} alt="Scan QR" className="w-full h-full object-contain" />
          </div>
        </div>
      </div>

      {/* Styled Infinite Marquee CSS injection */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          display: inline-block;
          animation: marquee 25s linear infinite;
          padding-left: 100%;
        }
      `}</style>

    </div>
  );
}
