import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingBag, Clock, Calendar, Ticket, CheckCircle2, ChevronRight, 
  MapPin, Phone, ArrowLeft, RefreshCw, Sparkles, Navigation, QrCode
} from 'lucide-react';
import { apiRequest } from '../../utils/api';
import Loader from '../Loader';

export default function CustomerOrders({ currentUser, onBack }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const phone = currentUser?.phone || localStorage.getItem('Orderin_customer_phone') || '';

  const fetchOrders = async (showRefreshIndicator = false) => {
    if (!phone) {
      setLoading(false);
      return;
    }
    if (showRefreshIndicator) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await apiRequest(`/orders/customer/${phone}`);
      if (res.success && Array.isArray(res.orders)) {
        setOrders(res.orders);
      }
    } catch (err) {
      console.error("Error fetching customer orders:", err);
      setError("Failed to fetch order history. Please check your connection.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // Auto-refresh order statuses every 20 seconds for active tracking!
    const timer = setInterval(() => fetchOrders(true), 20000);
    return () => clearInterval(timer);
  }, [phone]);

  const getPrepStatusStep = (prepStatus, orderStatus) => {
    if (orderStatus === 'cancelled' || orderStatus === 'CANCELLED') return -1;
    switch (prepStatus?.toLowerCase()) {
      case 'preparing':
        return 1;
      case 'ready for pickup':
      case 'ready':
        return 2;
      case 'picked up':
      case 'completed':
        return 3;
      default:
        return 0; // Pending / Placed
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
              My Dining Dashboard <Sparkles className="w-5 h-5 text-amber-500 fill-amber-500" />
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Live updates for phone: <span className="font-extrabold text-slate-800">{phone}</span>
            </p>
          </div>
        </div>

        <button
          onClick={() => fetchOrders(true)}
          disabled={refreshing}
          className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition shadow disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span>{refreshing ? 'Syncing...' : 'Refresh Status'}</span>
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 w-full">
          <Loader message="Syncing live dashboard from MongoDB..." size="w-24 h-24" />
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-[24px] p-12 text-center space-y-4 max-w-md mx-auto shadow-sm">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto text-red-500">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-black text-slate-800">No Orders Found</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              We couldn't find any digital table, route, or scheduled orders linked to this mobile number yet.
            </p>
          </div>
          <button 
            onClick={onBack}
            className="bg-red-500 hover:bg-red-600 text-white font-extrabold text-xs px-6 py-3 rounded-xl transition shadow"
          >
            Browse Restaurants & Order
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => {
            const step = getPrepStatusStep(order.preparationStatus, order.orderStatus);
            const isCancelled = step === -1;
            
            return (
              <motion.div 
                key={order._id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-slate-200/80 rounded-[28px] overflow-hidden shadow-sm hover:shadow-md transition duration-300"
              >
                {/* Upper banner summary */}
                <div className="bg-slate-50 border-b border-slate-100 p-5 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex items-center gap-3">
                    <img 
                      src={order.restaurant?.logo || 'https://img.icons8.com/fluency/196/hamburger.png'} 
                      className="w-12 h-12 rounded-xl object-contain border border-slate-200 bg-white p-1" 
                      alt="" 
                    />
                    <div>
                      <h4 className="font-extrabold text-slate-800 text-base">{order.restaurant?.name || 'Restaurant'}</h4>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        <span className="bg-slate-200/60 text-slate-600 px-2 py-0.5 rounded-full">
                          {order.orderType || 'dine-in'}
                        </span>
                        <span>•</span>
                        <span>{new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-slate-400 font-extrabold block">TOTAL PAID</span>
                    <span className="text-lg font-black text-slate-800">₹{order.totalAmount}</span>
                  </div>
                </div>

                {/* Main Body */}
                <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-8">
                  {/* Left Column: Prep Stepper & Items */}
                  <div className="md:col-span-8 space-y-6">
                    {/* Stepper progress */}
                    {!isCancelled ? (
                      <div className="space-y-4">
                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Preparation Progress</span>
                        
                        <div className="relative py-2">
                          {/* Background line */}
                          <div className="absolute left-4 top-4 bottom-4 w-1 bg-slate-100 rounded-full md:left-[48px] md:right-[48px] md:top-5 md:bottom-auto md:h-1 md:w-auto"></div>
                          
                          {/* Active line (Mobile - Vertical) */}
                          <div 
                            className="absolute left-4 top-4 w-1 bg-gradient-to-b from-emerald-400 to-teal-500 rounded-full transition-all duration-700 shadow-[0_0_12px_rgba(16,185,129,0.7)] md:hidden"
                            style={{ 
                              height: `calc(${(step / 3) * 100}% - ${(step / 3) * 16}px)`
                            }}
                          ></div>

                          {/* Active line (Desktop - Horizontal) */}
                          <div 
                            className="hidden md:block absolute left-[48px] top-5 h-1 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full transition-all duration-700 shadow-[0_0_12px_rgba(16,185,129,0.75)]"
                            style={{ 
                              width: `calc(${(step / 3) * 100}% - ${(step / 3) * 96}px)`
                            }}
                          ></div>

                          {/* Glowing moving dot (Desktop) */}
                          {step > 0 && (
                            <>
                              <div 
                                className="hidden md:block absolute top-[13px] w-4.5 h-4.5 rounded-full bg-emerald-400 border-2 border-white shadow-[0_0_15px_#10b981] animate-ping"
                                style={{ 
                                  left: `calc(48px + ${(step / 3) * 100}% - ${(step / 3) * 96}px - 9px)`,
                                  transition: 'left 0.7s cubic-bezier(0.4, 0, 0.2, 1)'
                                }}
                              />
                              <div 
                                className="hidden md:block absolute top-[15px] w-3.5 h-3.5 rounded-full bg-emerald-500 border border-white shadow-[0_0_10px_#10b981]"
                                style={{ 
                                  left: `calc(48px + ${(step / 3) * 100}% - ${(step / 3) * 96}px - 7px)`,
                                  transition: 'left 0.7s cubic-bezier(0.4, 0, 0.2, 1)'
                                }}
                              />
                            </>
                          )}

                          {/* Glowing moving dot (Mobile) */}
                          {step > 0 && (
                            <>
                              <div 
                                className="absolute left-[11px] w-3.5 h-3.5 rounded-full bg-emerald-400 border border-white shadow-[0_0_12px_#10b981] animate-ping md:hidden"
                                style={{ 
                                  top: `calc(16px + ${(step / 3) * 100}% - ${(step / 3) * 16}px - 7px)`,
                                  transition: 'top 0.7s cubic-bezier(0.4, 0, 0.2, 1)'
                                }}
                              />
                              <div 
                                className="absolute left-[12px] w-3 h-3 rounded-full bg-emerald-500 border border-white shadow-[0_0_8px_#10b981] md:hidden"
                                style={{ 
                                  top: `calc(16px + ${(step / 3) * 100}% - ${(step / 3) * 16}px - 6px)`,
                                  transition: 'top 0.7s cubic-bezier(0.4, 0, 0.2, 1)'
                                }}
                              />
                            </>
                          )}

                          <div className="flex flex-col md:flex-row justify-between gap-6 md:gap-2 relative z-10 text-xs">
                            {/* Step 1: Placed */}
                            <div className="flex items-start md:flex-col md:items-center gap-3 md:gap-1.5 text-left md:text-center md:w-24">
                              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold transition-all duration-300 ${
                                step >= 0 
                                  ? 'bg-emerald-500 border-emerald-400 text-white shadow-[0_0_12px_rgba(16,185,129,0.4)] scale-105' 
                                  : 'bg-white border-slate-200 text-slate-400 scale-100'
                              }`}>
                                {step >= 0 ? '✓' : '1'}
                              </div>
                              <div>
                                <span className={`font-extrabold block ${step >= 0 ? 'text-slate-800' : 'text-slate-400'}`}>Order Placed</span>
                                <span className="text-[9px] text-slate-400 block mt-0.5">Kitchen notified</span>
                              </div>
                            </div>

                            {/* Step 2: Preparing */}
                            <div className="flex items-start md:flex-col md:items-center gap-3 md:gap-1.5 text-left md:text-center md:w-24">
                              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold transition-all duration-300 ${
                                step >= 1 
                                  ? 'bg-emerald-500 border-emerald-400 text-white shadow-[0_0_12px_rgba(16,185,129,0.4)] scale-105' 
                                  : 'bg-white border-slate-200 text-slate-400 scale-100'
                              }`}>
                                {step >= 1 ? '✓' : '2'}
                              </div>
                              <div>
                                <span className={`font-extrabold block ${step >= 1 ? 'text-slate-800' : 'text-slate-400'}`}>Preparing</span>
                                <span className="text-[9px] text-slate-400 block mt-0.5">Chef is cooking</span>
                              </div>
                            </div>

                            {/* Step 3: Ready */}
                            <div className="flex items-start md:flex-col md:items-center gap-3 md:gap-1.5 text-left md:text-center md:w-24">
                              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold transition-all duration-300 ${
                                step >= 2 
                                  ? 'bg-emerald-500 border-emerald-400 text-white shadow-[0_0_12px_rgba(16,185,129,0.4)] scale-105' 
                                  : 'bg-white border-slate-200 text-slate-400 scale-100'
                              }`}>
                                {step >= 2 ? '✓' : '3'}
                              </div>
                              <div>
                                <span className={`font-extrabold block ${step >= 2 ? 'text-slate-800' : 'text-slate-400'}`}>Ready</span>
                                <span className="text-[9px] text-slate-400 block mt-0.5">Ready at counter</span>
                              </div>
                            </div>

                            {/* Step 4: Served / Picked Up */}
                            <div className="flex items-start md:flex-col md:items-center gap-3 md:gap-1.5 text-left md:text-center md:w-24">
                              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold transition-all duration-300 ${
                                step >= 3 
                                  ? 'bg-emerald-500 border-emerald-400 text-white shadow-[0_0_12px_rgba(16,185,129,0.4)] scale-105' 
                                  : 'bg-white border-slate-200 text-slate-400 scale-100'
                              }`}>
                                {step >= 3 ? '✓' : '4'}
                              </div>
                              <div>
                                <span className={`font-extrabold block ${step >= 3 ? 'text-slate-800' : 'text-slate-400'}`}>Picked Up</span>
                                <span className="text-[9px] text-slate-400 block mt-0.5">Enjoy your food!</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-red-600 text-xs font-bold flex items-center gap-2">
                        <span>⚠️ This order has been cancelled by the restaurant. Refunds are initiated if paid online.</span>
                      </div>
                    )}

                    {/* Order items detail */}
                    <div className="space-y-3">
                      <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Dish Details</span>
                      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 divide-y divide-slate-200/60 space-y-2.5">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center text-xs text-slate-600 pt-2.5 first:pt-0">
                            <div className="space-y-0.5">
                              <span className="font-extrabold text-slate-800">{item.name}</span>
                              <span className="text-[10px] text-slate-400 block">Qty: {item.quantity} • ₹{item.price} each</span>
                            </div>
                            <span className="font-extrabold text-slate-800">₹{item.price * item.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Code & Scheduled Details */}
                  <div className="md:col-span-4 bg-slate-950 text-white rounded-[24px] p-6 flex flex-col justify-between gap-6 shadow-inner relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/30 to-purple-900/30 z-0"></div>
                    
                    <div className="relative z-10 space-y-4">
                      {order.orderType === 'table' ? (
                        <div className="space-y-2">
                          <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest inline-block">
                            Dine-In Session
                          </span>
                          <h4 className="text-sm font-extrabold flex items-center gap-1.5 text-slate-200">
                            <QrCode className="w-4 h-4 text-emerald-400" />
                            Table No: <span className="text-white text-base font-black">{order.tableNo || 'T1'}</span>
                          </h4>
                          <p className="text-[10px] text-slate-400 leading-normal">
                            You are logged into this dining table session. Additional orders placed will stack on this table.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest inline-block">
                              Pickup Coupon Code
                            </span>
                            
                            {/* OTP CODE */}
                            {order.pickupCode ? (
                              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center space-y-1">
                                <span className="text-[9px] text-slate-400 uppercase tracking-widest font-black block">Show Code to Cashier</span>
                                <span className="text-3xl font-black text-amber-300 tracking-wider font-mono block">
                                  {order.pickupCode}
                                </span>
                              </div>
                            ) : (
                              <p className="text-[10px] text-slate-400 animate-pulse">Assigning secure OTP code...</p>
                            )}
                          </div>

                          {/* Pickup Schedule */}
                          <div className="space-y-2 text-xs">
                            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Pickup Schedule</span>
                            <div className="flex items-center gap-2 text-slate-200 font-bold bg-white/5 p-3 rounded-xl border border-white/5">
                              {order.orderType === 'route' ? (
                                <>
                                  <Navigation className="w-4 h-4 text-red-400" />
                                  <div>
                                    <span className="block text-[10px] text-slate-400">ETA stop pickup time</span>
                                    <span>{order.pickupTime || 'Instant'}</span>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <Clock className="w-4 h-4 text-amber-400" />
                                  <div>
                                    <span className="block text-[10px] text-slate-400">Scheduled pickup time</span>
                                    <span>{order.pickupTime || 'Advance'}</span>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="relative z-10 text-[9px] text-slate-500 border-t border-white/5 pt-4">
                      Order ID: {order._id}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
