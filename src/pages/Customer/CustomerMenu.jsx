import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, ShoppingBag, Trash2, QrCode, Star, X, Percent, ArrowRight, Heart, Activity, Utensils,
  Leaf, Flame, Sprout, BookOpen, ArrowLeft
} from 'lucide-react';
import { apiRequest } from '../../utils/api';
import { socket, joinRoom } from '../../utils/socket';

export default function CustomerMenu({
  restaurant, categories, menus, cart, setCart, activeCoupon, setActiveCoupon,
  checkoutStep, setCheckoutStep, selectedCategoryTab, setSelectedCategoryTab,
  foodTypeFilter, setFoodTypeFilter, searchQuery, setSearchQuery, selectedFoodPreview,
  setSelectedFoodPreview, liveOrderTrackingId, setLiveOrderTrackingId, activeTableNo,
  setActiveTableNo, t, orders, setOrders, showRazorpayModal, setShowRazorpayModal,
  paymentProcessing, setPaymentProcessing, favorites, setFavorites, coupons, onBack
}) {

  const [categoryImageErrors, setCategoryImageErrors] = useState({});
  const [pendingOrderId, setPendingOrderId] = useState(null);
  const [paymentError, setPaymentError] = useState(null);
  const [gatewayFallbackNote, setGatewayFallbackNote] = useState(null);

  const filteredCategories = useMemo(() => {
    return categories.filter(c => c.restaurantId === restaurant.id);
  }, [categories, restaurant]);

  const filteredMenus = useMemo(() => {
    return menus.filter(item => {
      if (item.restaurantId !== restaurant.id) return false;
      if (foodTypeFilter !== 'all') {
        if (foodTypeFilter === 'veg' && item.foodType !== 'veg') return false;
        if (foodTypeFilter === 'non-veg' && item.foodType !== 'non-veg') return false;
        if (foodTypeFilter === 'vegan' && item.foodType !== 'vegan') return false;
      }
      if (searchQuery) {
        return item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
               (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
      }
      return true;
    });
  }, [menus, restaurant, foodTypeFilter, searchQuery]);

  // Scroll spy to highlight active category on scroll
  useEffect(() => {
    if (checkoutStep) return;

    const handleScroll = () => {
      // 1. If we are close to the top of the page, highlight 'All'
      if (window.scrollY < 120) {
        setSelectedCategoryTab('All');
        return;
      }

      // 2. Check if scrolled to the absolute bottom of the page
      const isBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 15;
      if (isBottom) {
        const lastCat = filteredCategories[filteredCategories.length - 1];
        if (lastCat) {
          setSelectedCategoryTab(lastCat.name);
          return;
        }
      }

      // 3. Find all category sections and locate the one currently active in viewport
      const sections = filteredCategories.map(cat => document.getElementById(`category-section-${cat.id}`)).filter(Boolean);
      
      if (sections.length === 0) return;

      let activeCatName = 'All';
      
      for (const section of sections) {
        const rect = section.getBoundingClientRect();
        // If the top of the section is at or above 120px from the top of the viewport
        if (rect.top <= 120 && rect.bottom >= 120) {
          const sectionId = section.id.replace('category-section-', '');
          const cat = filteredCategories.find(c => c.id === sectionId);
          if (cat) {
            activeCatName = cat.name;
          }
          break;
        }
      }
      
      setSelectedCategoryTab(activeCatName);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [filteredCategories, checkoutStep, setSelectedCategoryTab]);

  // Socket.IO real-time listeners for live order tracking & payment confirmation
  useEffect(() => {
    if (!liveOrderTrackingId) return;

    // Join order room
    joinRoom(`order_${liveOrderTrackingId}`);

    const handlePaymentUpdate = (data) => {
      console.log('📡 Realtime payment update received:', data);
      if (data.order) {
        // Update local orders list
        setOrders(prev => {
          const exists = prev.find(o => o.id === data.order._id);
          const formatted = {
            id: data.order._id,
            restaurantId: restaurant.id,
            customerName: data.order.customerName || 'Guest Customer',
            customerPhone: data.order.customerPhone || '+91 99887 76655',
            items: cart.length > 0 ? cart : data.order.items.map(item => ({
              id: item.menuItem,
              name: item.name || 'Item',
              price: item.price || 100,
              quantity: item.quantity,
              selectedAddons: item.selectedAddons || []
            })),
            tableNo: data.order.tableNo,
            subTotal: data.order.subTotal,
            gstAmount: data.order.gstAmount,
            deliveryCharge: data.order.deliveryCharge,
            totalAmount: data.order.totalAmount,
            paymentMethod: data.order.paymentMethod,
            paymentStatus: data.order.paymentStatus,
            orderStatus: data.order.orderStatus,
            createdAt: data.order.createdAt
          };

          if (exists) {
            return prev.map(o => o.id === data.order._id ? formatted : o);
          } else {
            return [formatted, ...prev];
          }
        });

        // If order state is PAID, finalize the cart and view state locally
        if (data.paymentStatus === 'PAID') {
          setCart([]);
          setActiveCoupon(null);
          setCheckoutStep('tracking');
          setShowRazorpayModal(false);
          setPaymentProcessing(false);
        }
      }
    };

    const handleOrderStatusUpdate = (data) => {
      console.log('📡 Realtime status update received:', data);
      if (data.order) {
        setOrders(prev => prev.map(o => o.id === data.order._id ? {
          ...o,
          orderStatus: data.order.orderStatus,
          paymentStatus: data.order.paymentStatus
        } : o));
      }
    };

    socket.on('payment_update', handlePaymentUpdate);
    socket.on('order_status_update', handleOrderStatusUpdate);

    return () => {
      socket.off('payment_update', handlePaymentUpdate);
      socket.off('order_status_update', handleOrderStatusUpdate);
    };
  }, [liveOrderTrackingId, restaurant, cart]);

  const handleCategoryClick = (categoryName) => {
    setSelectedCategoryTab(categoryName);
    
    if (categoryName === 'All') {
      const topElement = document.getElementById('menu-top-anchor');
      if (topElement) {
        topElement.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      const cat = filteredCategories.find(c => c.name === categoryName);
      if (cat) {
        const element = document.getElementById(`category-section-${cat.id}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }
    }
  };


  const toggleFavorite = (itemId) => {
    if (favorites.includes(itemId)) {
      setFavorites(favorites.filter(id => id !== itemId));
    } else {
      setFavorites([...favorites, itemId]);
    }
  };

  const handleAddToCart = (item, selectedAddons = []) => {
    const existing = cart.find(i => i.id === item.id);
    if (existing) {
      setCart(cart.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setCart([...cart, { ...item, quantity: 1, selectedAddons }]);
    }
  };

  const handleDecreaseQuantity = (itemId) => {
    const item = cart.find(i => i.id === itemId);
    if (!item) return;
    if (item.quantity === 1) {
      setCart(cart.filter(i => i.id !== itemId));
    } else {
      setCart(cart.map(i => i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i));
    }
  };

  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => {
      let itemPrice = item.discountPrice || item.price;
      const addonsPrice = item.selectedAddons?.reduce((s, a) => s + a.price, 0) || 0;
      return sum + (itemPrice + addonsPrice) * item.quantity;
    }, 0);
  }, [cart]);

  const cartGst = useMemo(() => {
    return Math.round((cartSubtotal * (restaurant.settings.gstPercentage / 100)) * 100) / 100;
  }, [cartSubtotal, restaurant]);

  // Set delivery fee strictly to 0 as customer pays only what is shown (no delivery charges)
  const deliveryFee = 0;

  const couponDiscount = useMemo(() => {
    if (!activeCoupon) return 0;
    if (activeCoupon.discountType === 'flat') return activeCoupon.discountValue;
    const computed = (cartSubtotal * activeCoupon.discountValue) / 100;
    return activeCoupon.maxDiscountAmount ? Math.min(computed, activeCoupon.maxDiscountAmount) : computed;
  }, [activeCoupon, cartSubtotal]);

  const cartTotal = useMemo(() => {
    return Math.max(0, cartSubtotal + cartGst + deliveryFee - couponDiscount);
  }, [cartSubtotal, cartGst, deliveryFee, couponDiscount]);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const finalizeSuccessfulOrder = (verifiedOrder) => {
    const newOrder = {
      id: verifiedOrder._id,
      restaurantId: restaurant.id,
      customerName: verifiedOrder.customerName || "Guest Customer",
      customerPhone: verifiedOrder.customerPhone || "+91 99887 76655",
      items: cart,
      tableNo: verifiedOrder.tableNo,
      subTotal: verifiedOrder.subTotal,
      gstAmount: verifiedOrder.gstAmount,
      deliveryCharge: verifiedOrder.deliveryCharge,
      totalAmount: verifiedOrder.totalAmount,
      paymentMethod: verifiedOrder.paymentMethod,
      paymentStatus: verifiedOrder.paymentStatus,
      orderStatus: verifiedOrder.orderStatus,
      createdAt: verifiedOrder.createdAt
    };

    setOrders([newOrder, ...orders]);
    setCart([]);
    setActiveCoupon(null);
    setLiveOrderTrackingId(verifiedOrder._id);
    setCheckoutStep('tracking');
    setShowRazorpayModal(false);
    setPaymentProcessing(false);
  };

  const handlePaymentCheckoutSubmit = async () => {
    if (cart.length === 0) return;
    setPaymentProcessing(true);
    setPaymentError(null);

    try {
      let activeOrder = null;
      
      // If we already have a pending order, verify it and reuse it to avoid duplicate db clutter
      if (pendingOrderId) {
        try {
          const checkRes = await apiRequest(`/orders/${pendingOrderId}`);
          if (checkRes.success && checkRes.order) {
            activeOrder = checkRes.order;
          }
        } catch (err) {
          console.warn("Could not retrieve existing pending order. Creating a new one:", err.message);
        }
      }

      if (!activeOrder) {
        // 1. Create a pending order on the MongoDB database
        const orderRes = await apiRequest('/orders', {
          method: 'POST',
          body: JSON.stringify({
            restaurantId: restaurant.id,
            tableNo: activeTableNo || 'T1',
            items: cart.map(i => ({
              menuItem: i.id,
              name: i.name,
              quantity: i.quantity,
              selectedAddons: i.selectedAddons || [],
              price: i.discountPrice || i.price
            })),
            paymentMethod: 'razorpay'
          })
        });

        if (!orderRes.success || !orderRes.order) {
          throw new Error(orderRes.error || "Failed to create database order");
        }
        activeOrder = orderRes.order;
        setPendingOrderId(activeOrder._id);
      }

      // 2. Create Razorpay order on backend
      const rzpRes = await apiRequest('/payments/create-order', {
        method: 'POST',
        body: JSON.stringify({ orderId: activeOrder._id })
      });

      if (!rzpRes.success) {
        throw new Error(rzpRes.error || "Failed to initialize payment gateway order");
      }

      // 3. Check if it's a mock payment (sandbox mode without valid keys)
      if (rzpRes.isMock) {
        if (rzpRes.note) {
          setGatewayFallbackNote(rzpRes.note);
        } else {
          setGatewayFallbackNote(null);
        }
        setShowRazorpayModal(true);
        setPaymentProcessing(false);
        return;
      }

      // 4. Load Razorpay Checkout SDK script
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        throw new Error("Razorpay SDK failed to load. Please check your internet connection.");
      }

      // 5. Open Razorpay payment gateway
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_mock_key_id',
        amount: rzpRes.amount,
        currency: rzpRes.currency || 'INR',
        name: restaurant.name,
        description: `Order Payment - Table ${activeTableNo || 'T1'}`,
        image: restaurant.logo || 'https://img.icons8.com/fluency/196/hamburger.png',
        order_id: rzpRes.id,
        // Optimize checkout for UPI Intent priority
        config: {
          display: {
            blocks: {
              upi: {
                name: 'UPI / Google Pay / PhonePe',
                instruments: [
                  {
                    method: 'upi',
                    apps: ['google_pay', 'phonepe', 'paytm', 'bhim']
                  }
                ]
              }
            },
            sequence: ['block.upi', 'block.card', 'block.netbanking']
          }
        },
        upi_intent: true,
        handler: async function (response) {
          try {
            setPaymentProcessing(true);
            setLiveOrderTrackingId(activeOrder._id); // Subscribe to updates immediately
            joinRoom(`order_${activeOrder._id}`);

            // 6. Verify payment signature on backend
            const verifyRes = await apiRequest('/payments/verify', {
              method: 'POST',
              body: JSON.stringify({
                orderId: activeOrder._id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                isMock: false
              })
            });

            if (verifyRes.success && verifyRes.order) {
              if (verifyRes.order.paymentStatus === 'PAID') {
                finalizeSuccessfulOrder(verifyRes.order);
              } else {
                // If awaiting webhook finalization, move to tracking step but keep cart temporarily
                console.log("Payment signature verified. Webhook finalization pending.");
                setCheckoutStep('tracking');
              }
            } else {
              setPaymentError("Signature check returned failure. Please contact support.");
              setPaymentProcessing(false);
            }
          } catch (err) {
            console.error("Signature verification error:", err);
            setPaymentError("Error verifying payment signature: " + err.message);
            setPaymentProcessing(false);
          }
        },
        prefill: {
          name: "Guest Customer",
          contact: "+919988776655"
        },
        theme: {
          color: restaurant.theme?.primaryColor || '#bd3838'
        },
        modal: {
          ondismiss: function() {
            setPaymentProcessing(false);
            setPaymentError("Payment flow closed. You can retry payment below.");
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error("Payment checkout submission error:", err);
      setPaymentError("Checkout failed: " + err.message);
      setPaymentProcessing(false);
    }
  };

  const finalizeSimulatedOrder = async () => {
    if (!pendingOrderId) {
      alert("No pending order found to finalize.");
      return;
    }
    setPaymentProcessing(true);
    setPaymentError(null);
    setShowRazorpayModal(false);

    try {
      setLiveOrderTrackingId(pendingOrderId);
      joinRoom(`order_${pendingOrderId}`);

      const verifyRes = await apiRequest('/payments/verify', {
        method: 'POST',
        body: JSON.stringify({
          orderId: pendingOrderId,
          isMock: true,
          razorpay_payment_id: `mock_pay_${Math.random().toString(36).substring(5)}`
        })
      });

      if (verifyRes.success && verifyRes.order) {
        finalizeSuccessfulOrder(verifyRes.order);
      } else {
        setPaymentError("Mock payment confirmation failed.");
        setPaymentProcessing(false);
      }
    } catch (err) {
      console.error("Mock verification error:", err);
      setPaymentError("Mock payment checkout failed: " + err.message);
      setPaymentProcessing(false);
    }
  };

  const activeTrackingOrder = useMemo(() => {
    return orders.find(o => o.id === liveOrderTrackingId);
  }, [orders, liveOrderTrackingId]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="customer-theme w-full max-w-md mx-auto bg-white text-slate-800 md:border md:border-slate-100 md:rounded-[40px] md:shadow-2xl md:my-6 overflow-hidden relative min-h-screen flex flex-col justify-between"
    >
      {/* Premium Overlapping Hero Header */}
      {!checkoutStep && (
        <div className="relative">
          {/* Background Banner */}
          <div 
            className="h-44 bg-cover bg-center relative"
            style={{ backgroundImage: `url(${restaurant.banner || 'https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=600&auto=format&fit=crop'})` }}
          >
            {/* Top Row Controls */}
            <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
              {onBack && (
                <button
                  onClick={onBack}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-black/60 transition"
                >
                  <ArrowLeft className="w-4.5 h-4.5" />
                </button>
              )}
              <div className="flex gap-2">
                <button className="w-8 h-8 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-black/60 transition">
                  <Heart className="w-4.5 h-4.5 text-red-500 fill-red-500" />
                </button>
                <button className="w-8 h-8 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-black/60 transition">
                  <Percent className="w-4.5 h-4.5 text-yellow-400" />
                </button>
              </div>
            </div>
          </div>

          {/* Overlapping Brand Info Card */}
          <div className="relative px-4 pb-4 mt-4 z-10 text-center">
            {/* Restaurant Name */}
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">{restaurant.name}</h2>
          </div>
        </div>
      )}

      {/* Cart/Tracking Mode Header */}
      {checkoutStep && (
        <div className="bg-white/80 border-b border-slate-100 py-4 px-4 flex justify-between items-center backdrop-blur-md">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={() => setCheckoutStep(null)}
                className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 border border-slate-200/50 text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition flex-shrink-0"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <img src={restaurant.logo} className="w-10 h-10 rounded-xl object-contain bg-white p-1.5 border border-slate-100 shadow-md" alt={restaurant.name} />
            <div>
              <h2 className="text-base font-extrabold text-slate-900 leading-tight">
                {restaurant.name}
              </h2>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col justify-between pt-6 pb-28">
        {!checkoutStep ? (
          <div id="menu-top-anchor" className="space-y-6 px-4 scroll-mt-24">
            <div className="space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  placeholder={t('searchFood')}
                  className="w-full bg-white border border-slate-200/80 pl-10 pr-4 py-3 rounded-2xl text-xs focus:outline-none focus:border-red-500 text-slate-800 shadow-sm shadow-slate-100/50"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {[
                  { id: 'all', label: 'All Dishes', icon: Utensils, color: 'bg-slate-100 text-slate-600 border-slate-200/50 hover:bg-slate-200/50' },
                  { id: 'veg', label: 'Veg Only', icon: Leaf, color: 'bg-green-500/10 text-green-600 border-green-500/20' },
                  { id: 'non-veg', label: 'Non-Veg', icon: Flame, color: 'bg-red-500/10 text-red-600 border-red-500/20' },
                  { id: 'vegan', label: 'Vegan', icon: Sprout, color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' }
                ].map(type => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.id}
                      onClick={() => setFoodTypeFilter(type.id)}
                      className={`px-3.5 py-2 rounded-xl text-[10px] font-bold border transition flex items-center gap-1.5 whitespace-nowrap ${
                        foodTypeFilter === type.id
                          ? 'bg-gradient-to-r from-red-500 to-orange-500 border-transparent text-white shadow-lg shadow-red-500/20'
                          : `${type.color} hover:bg-slate-200`
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {type.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sticky Categories Bar */}
            <div className="sticky top-0 bg-white/95 backdrop-blur-md py-2.5 z-20 border-b border-slate-100 -mx-4 px-4 shadow-sm">
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                <button
                  onClick={() => handleCategoryClick('All')}
                  className={`px-4 py-2 text-xs font-extrabold whitespace-nowrap transition border-b-2 ${
                    selectedCategoryTab === 'All'
                      ? 'border-red-500 text-slate-900 font-black'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Popular
                </button>
                {filteredCategories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryClick(cat.name)}
                    className={`px-4 py-2 text-xs font-extrabold whitespace-nowrap transition border-b-2 ${
                      selectedCategoryTab === cat.name
                        ? 'border-red-500 text-slate-900 font-black'
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Menu Items Grouped by Category */}
            <div className="space-y-8">
              {filteredCategories.map(cat => {
                const categoryMenus = filteredMenus.filter(item => item.categoryId === cat.id);
                if (categoryMenus.length === 0) return null;

                return (
                  <div 
                    key={cat.id} 
                    id={`category-section-${cat.id}`} 
                    className="space-y-3 pt-2 scroll-mt-20"
                  >
                    <div className="flex items-center gap-2 pb-1.5 border-b border-slate-100">
                      <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">{cat.name}</h3>
                      <span className="text-[10px] text-slate-400 font-bold">({categoryMenus.length})</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {categoryMenus.map((item) => {
                        const cartItem = cart.find(i => i.id === item.id);
                        return (
                          <div key={item.id} className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm shadow-slate-100/50 flex flex-col justify-between hover:shadow-md transition">
                            {/* Card Top Image Block */}
                            <div className="relative h-28 bg-slate-50 cursor-pointer overflow-hidden group" onClick={() => setSelectedFoodPreview(item)}>
                              <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                              
                              {/* Veg/Diet type Badge */}
                              <div className="absolute top-2 left-2">
                                <span className={`px-1.5 py-0.5 rounded-md text-[7px] uppercase font-bold text-white shadow-md ${
                                  item.foodType === 'veg' ? 'bg-green-600' : item.foodType === 'non-veg' ? 'bg-red-600' : 'bg-emerald-600'
                                }`}>
                                  {item.foodType}
                                </span>
                              </div>

                              {/* Favorite Heart Button */}
                              <div className="absolute top-2 right-2 bg-white/80 backdrop-blur-sm p-1.5 rounded-full border border-slate-100" onClick={(e) => { e.stopPropagation(); toggleFavorite(item.id); }}>
                                <Heart className={`w-3.5 h-3.5 ${favorites.includes(item.id) ? 'fill-red-500 text-red-500' : 'text-slate-400'}`} />
                              </div>

                              {/* Floating Add to Cart Trigger Button */}
                              <div className="absolute bottom-2 right-2">
                                {cartItem ? (
                                  <div className="flex items-center bg-red-500 rounded-full py-0.5 px-1.5 shadow-lg border border-red-400">
                                    <button onClick={(e) => { e.stopPropagation(); handleDecreaseQuantity(item.id); }} className="text-white text-[10px] font-black px-1">-</button>
                                    <span className="text-white text-[10px] font-extrabold px-1.5">{cartItem.quantity}</span>
                                    <button onClick={(e) => { e.stopPropagation(); handleAddToCart(item); }} className="text-white text-[10px] font-black px-1">+</button>
                                  </div>
                                ) : (
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); handleAddToCart(item); }} 
                                    className="w-7 h-7 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white font-extrabold shadow-lg transition hover:scale-110"
                                  >
                                    +
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Card Bottom Details Block */}
                            <div className="p-3.5 space-y-1 text-left">
                              <h4 className="text-xs font-extrabold text-slate-800 cursor-pointer line-clamp-1 hover:text-red-500 transition" onClick={() => setSelectedFoodPreview(item)}>
                                {item.name}
                              </h4>
                              
                              <div className="flex items-baseline gap-1.5">
                                <span className="text-xs font-black text-slate-900">₹{item.discountPrice || item.price}</span>
                                {item.discountPrice && (
                                  <span className="text-[9px] text-slate-400 line-through font-bold">₹{item.price}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {filteredMenus.length === 0 && (
                <div className="text-center py-12 space-y-3">
                  <div className="text-slate-400 text-3xl">🍽️</div>
                  <p className="text-xs text-slate-500 font-bold">No delicious dishes match your filters.</p>
                </div>
              )}
            </div>
          </div>
        ) : checkoutStep === 'cart' ? (
          <div className="space-y-6 px-4">
            <div className="flex items-center gap-3">
              <button onClick={() => setCheckoutStep(null)} className="p-2 bg-slate-100 border border-slate-200/50 rounded-full hover:bg-slate-200 text-slate-700">
                <X className="w-4 h-4" />
              </button>
              <h3 className="text-lg font-black text-slate-900">Your Order Cart</h3>
            </div>

            <div className="space-y-6">
              {cart.map(item => (
                <div key={item.id} className="bg-white rounded-2xl border border-slate-100 p-3.5 flex justify-between items-center shadow-sm">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 leading-tight">{item.name}</h4>
                    <span className="text-[10px] text-slate-500 font-bold">₹{item.discountPrice || item.price} x {item.quantity}</span>
                  </div>
                  <div className="flex items-center bg-slate-100 rounded-xl p-0.5 border border-slate-200/50">
                    <button onClick={() => handleDecreaseQuantity(item.id)} className="px-2 py-0.5 text-slate-600 font-bold">-</button>
                    <span className="px-2 text-xs font-bold text-slate-800">{item.quantity}</span>
                    <button onClick={() => handleAddToCart(item)} className="px-2 py-0.5 text-slate-600 font-bold">+</button>
                  </div>
                </div>
              ))}

              {activeTableNo && (
                <div className="bg-red-50/80 border border-red-200 rounded-2xl p-4 flex gap-3 text-xs">
                  <QrCode className="w-5 h-5 text-red-500 animate-pulse" />
                  <p className="text-slate-700">Dine-in table order active for <strong className="text-red-500 font-extrabold">Table {activeTableNo}</strong>. Serving directly to your table!</p>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="APPLY PLATFORM COUPONS"
                    className="flex-1 bg-white border border-slate-200 px-4 py-2.5 text-xs rounded-xl uppercase text-slate-800 font-bold"
                    value={activeCoupon ? activeCoupon.code : ''}
                    readOnly
                  />
                  <div className="relative group">
                    <button className="bg-white hover:bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1">
                      <Percent className="w-3.5 h-3.5 text-yellow-500" />
                      Coupons
                    </button>
                    <div className="absolute right-0 bottom-full mb-1.5 hidden group-hover:block bg-white border border-slate-200 rounded-xl p-2 w-48 shadow-2xl z-50">
                      {coupons.map(cop => (
                        <button
                          key={cop.code}
                          onClick={() => setActiveCoupon(cop)}
                          className="w-full text-left p-1.5 hover:bg-slate-50 rounded text-[9px] text-slate-800 border-b border-slate-100"
                        >
                          <span className="font-black text-yellow-500">{cop.code}</span>
                          <p className="text-[8px] text-slate-500">{cop.description}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-slate-100 p-4 space-y-2.5 text-xs text-slate-600 shadow-sm shadow-slate-100">
                <div className="flex justify-between">
                  <span>{t('subtotal')}</span>
                  <span className="font-bold text-slate-900">₹{cartSubtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t('gst')}</span>
                  <span className="font-bold text-slate-900">₹{cartGst}</span>
                </div>

                {activeCoupon && (
                  <div className="flex justify-between text-yellow-600 font-bold">
                    <span>Coupon ({activeCoupon.code})</span>
                    <span>- ₹{couponDiscount}</span>
                  </div>
                )}
                <div className="h-px bg-slate-100 my-2"></div>
                <div className="flex justify-between text-sm text-slate-900 font-black">
                  <span>{t('total')}</span>
                  <span className="text-red-500">₹{cartTotal}</span>
                </div>
              </div>

              {paymentError && (
                <div className="bg-red-50 border border-red-200/50 rounded-2xl p-4 text-xs text-red-600 text-left space-y-2">
                  <p className="font-bold flex items-center gap-1.5">
                    <span>⚠️</span> {paymentError}
                  </p>
                  <button
                    onClick={() => {
                      setPendingOrderId(null);
                      setPaymentError(null);
                    }}
                    className="text-[10px] text-red-500 hover:text-red-700 underline font-bold animate-pulse"
                  >
                    Start new checkout session instead
                  </button>
                </div>
              )}

              <button
                onClick={handlePaymentCheckoutSubmit}
                className="w-full bg-gradient-to-r from-red-500 to-orange-500 text-white font-extrabold py-3.5 rounded-2xl shadow hover:opacity-95 transition"
              >
                {t('placeOrder')}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6 px-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-black text-slate-900">Live Tracking Details</h3>
              <button onClick={() => setCheckoutStep(null)} className="bg-slate-100 border border-slate-200/50 text-[10px] font-bold px-3 py-1.5 rounded-xl uppercase text-slate-700 hover:bg-slate-200">
                Menu
              </button>
            </div>

            {activeTrackingOrder && (
              <div className="space-y-6">
                <div className="bg-white border border-slate-100 rounded-3xl p-6 text-center space-y-4 shadow-sm shadow-slate-100">
                  <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto text-red-500">
                    <Activity className="w-8 h-8 animate-pulse" />
                  </div>
                  <div>
                    <span className="text-[10px] text-yellow-600 uppercase font-extrabold tracking-widest">Order ID: {activeTrackingOrder.id}</span>
                    
                    {/* Real-time waiting state feedback */}
                    {(activeTrackingOrder.orderStatus === 'PENDING_PAYMENT' || activeTrackingOrder.orderStatus === 'PAYMENT_PROCESSING') ? (
                      <div className="mt-2 space-y-1">
                        <h4 className="text-sm font-bold text-slate-800 animate-pulse">Awaiting Payment Confirmation</h4>
                        <p className="text-[10px] text-slate-500">Verifying capture signature. Please do not close or refresh this page.</p>
                      </div>
                    ) : (
                      <div className="mt-2">
                        <h4 className="text-xl font-black text-slate-900">
                          {['ready', 'READY'].includes(activeTrackingOrder.orderStatus) ? 'Order is Ready!' : 'Preparing your food'}
                        </h4>
                        <p className="text-xs text-slate-500">Estimated delivery/pickup: 20-25 mins</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  {[
                    { 
                      title: 'Order Placed & Paid', 
                      desc: 'Received by kitchen staff', 
                      done: ['PAID', 'placed', 'preparing', 'ready', 'completed', 'PREPARING', 'READY', 'COMPLETED'].includes(activeTrackingOrder.orderStatus) || activeTrackingOrder.paymentStatus === 'PAID'
                    },
                    { 
                      title: 'Preparing Meal', 
                      desc: 'Fresh ingredients being cooked by our Chefs', 
                      done: ['preparing', 'ready', 'completed', 'PREPARING', 'READY', 'COMPLETED'].includes(activeTrackingOrder.orderStatus)
                    },
                    { 
                      title: 'Serving / Handover', 
                      desc: 'Served to table or Counter pickup ready', 
                      done: ['ready', 'completed', 'READY', 'COMPLETED'].includes(activeTrackingOrder.orderStatus)
                    }
                  ].map((step, idx) => (
                    <div key={idx} className="flex gap-4">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        step.done ? 'bg-green-600 text-white animate-bounce' : 'bg-slate-100 text-slate-400'
                      }`} style={{ animationDelay: `${idx * 0.15}s` }}>
                        ✓
                      </div>
                      <div>
                        <h5 className={`text-xs font-bold ${step.done ? 'text-slate-950 font-black' : 'text-slate-400'}`}>{step.title}</h5>
                        <p className="text-[10px] text-slate-400">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {!checkoutStep && cart.length > 0 && (
        <div className="absolute bottom-4 left-4 right-4 bg-gradient-to-r from-red-500 to-orange-500 text-white py-3 px-6 rounded-2xl flex justify-between items-center shadow-lg z-20 cursor-pointer animate-pulse-gentle" onClick={() => setCheckoutStep('cart')}>
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold">{cart.reduce((sum, i) => sum + i.quantity, 0)} Items Added</span>
          </div>
          <div className="flex items-center gap-1 text-sm font-black">
            <span>₹{cartTotal}</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>
      )}

      {/* Footer Navigation & Brand Label */}
      <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-100 pt-3 pb-4 px-6 flex flex-col items-center gap-2 z-10">
        <div className="flex justify-around items-center w-full text-[10px] font-bold text-slate-500">
          <button
            onClick={() => setCheckoutStep(null)}
            className={`flex flex-col items-center gap-1 transition ${!checkoutStep ? 'text-red-500' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <Utensils className="w-4 h-4" />
            <span>Menu</span>
          </button>
          <button
            onClick={() => setCheckoutStep('cart')}
            className={`flex flex-col items-center gap-1 transition ${checkoutStep === 'cart' ? 'text-red-500' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Cart</span>
          </button>
        </div>
        <div className="text-[9px] text-slate-400 font-bold tracking-wider uppercase opacity-85 mt-1">
          Powered by <span className="text-slate-700 font-extrabold">Skyweb IT Solution Pvt Ltd</span>
        </div>
      </div>

      {selectedFoodPreview && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-sm bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-2xl space-y-4 pb-6">
            <div className="relative h-56 bg-slate-50">
              <img src={selectedFoodPreview.image} alt={selectedFoodPreview.name} className="w-full h-full object-cover" />
              <button onClick={() => setSelectedFoodPreview(null)} className="absolute top-4 right-4 bg-white/80 border border-slate-100 p-1.5 rounded-full text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-6 space-y-4 text-left">
              <h3 className="text-lg font-black text-slate-800">{selectedFoodPreview.name}</h3>
              <p className="text-xs text-slate-600">{selectedFoodPreview.description}</p>
              <div className="flex justify-between items-center">
                <span className="text-xl font-black text-slate-900">₹{selectedFoodPreview.price}</span>
                <button onClick={() => { handleAddToCart(selectedFoodPreview); setSelectedFoodPreview(null); }} className="bg-red-500 hover:bg-red-600 text-white font-bold text-xs py-2 px-6 rounded-xl">
                  ADD TO BASKET
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showRazorpayModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-sm bg-white border border-slate-100 rounded-3xl p-6 shadow-2xl space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <span className="text-sm font-bold text-slate-900">Razorpay Secure Sandbox Payment</span>
              <button onClick={() => setShowRazorpayModal(false)} className="text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              {gatewayFallbackNote && (
                <div className="bg-amber-50 border border-amber-200/50 rounded-2xl p-4 text-xs text-amber-800 text-left space-y-1">
                  <p className="font-bold flex items-center gap-1.5 text-amber-600">
                    <span>⚠️ Gateway Outage Recovery</span>
                  </p>
                  <p className="text-[11px] leading-relaxed text-amber-700">
                    Our payment provider is experiencing a temporary outage. You can complete your order smoothly using our sandbox/offline simulator.
                  </p>
                </div>
              )}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Total Amount to Pay</span>
                <p className="text-2xl font-black text-emerald-600">₹{cartTotal}</p>
              </div>
              <button onClick={finalizeSimulatedOrder} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow">
                SIMULATE SUCCESSFUL CHECKOUT
              </button>
            </div>
          </div>
        </div>
      )}

    </motion.div>
  );
}
