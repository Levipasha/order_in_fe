import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, ShoppingBag, Trash2, QrCode, Star, X, Percent, ArrowRight, Heart, Activity, Utensils,
  Leaf, Flame, Sprout, BookOpen, ArrowLeft, Plus, ChevronRight, SlidersHorizontal, Share2, Clock, Bike, Tag, Compass, User,
  Wifi, Battery, ClipboardList, LogOut, ShieldAlert, Award
} from 'lucide-react';
import { apiRequest } from '../../utils/api';
import { socket, joinRoom } from '../../utils/socket';
import { auth } from '../../firebase';
import { GoogleAuthProvider, signInWithPopup, signOut as fbSignOut } from 'firebase/auth';

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

export default function CustomerMenu({
  restaurant, categories, menus, cart, setCart, activeCoupon, setActiveCoupon,
  checkoutStep, setCheckoutStep, selectedCategoryTab, setSelectedCategoryTab,
  foodTypeFilter, setFoodTypeFilter, searchQuery, setSearchQuery, selectedFoodPreview,
  setSelectedFoodPreview, liveOrderTrackingId, setLiveOrderTrackingId, activeTableNo,
  setActiveTableNo, t, orders, setOrders, showPaymentModal, setShowPaymentModal,
  paymentProcessing, setPaymentProcessing, favorites, setFavorites, coupons, onBack
}) {

  const [categoryImageErrors, setCategoryImageErrors] = useState({});
  const [pendingOrderId, setPendingOrderId] = useState(null);
  const [paymentError, setPaymentError] = useState(null);
  const [gatewayFallbackNote, setGatewayFallbackNote] = useState(null);

  // Diner profile & order selection states
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('Orderin_diner_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [localOrderType, setLocalOrderType] = useState('table');
  const [enteredTableNo, setEnteredTableNo] = useState('');
  const [localPickupDate, setLocalPickupDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [localPickupTime, setLocalPickupTime] = useState('19:30');
  const [localCustomerPhone, setLocalCustomerPhone] = useState(() => currentUser?.phone || localStorage.getItem('Orderin_diner_phone') || '');
  const [localCustomerName, setLocalCustomerName] = useState(() => currentUser?.name || 'Guest Diner');

  // Past orders states & phone update states
  const [pastOrders, setPastOrders] = useState([]);
  const [loadingPastOrders, setLoadingPastOrders] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');
  const [savingPhone, setSavingPhone] = useState(false);

  // Auto-sync customer info with checkout inputs
  useEffect(() => {
    if (currentUser) {
      if (currentUser.phone) {
        setLocalCustomerPhone(currentUser.phone);
      }
      if (currentUser.name) {
        setLocalCustomerName(currentUser.name);
      }
    }
  }, [currentUser]);

  const fetchPastOrders = async (phone) => {
    if (!phone) return;
    setLoadingPastOrders(true);
    try {
      const res = await apiRequest(`/orders/customer/${phone}`);
      if (res.success && Array.isArray(res.orders)) {
        setPastOrders(res.orders);
      }
    } catch (err) {
      console.warn("Failed to fetch past orders:", err.message);
    } finally {
      setLoadingPastOrders(false);
    }
  };

  useEffect(() => {
    if (currentUser?.phone) {
      fetchPastOrders(currentUser.phone);
    }
  }, [currentUser?.phone]);

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const googleUser = result.user;
      
      const savedPhone = localStorage.getItem(`Orderin_phone_${googleUser.uid}`) || '';
      
      const res = await apiRequest('/auth/google-diner', {
        method: 'POST',
        body: JSON.stringify({
          name: googleUser.displayName || 'Guest Diner',
          email: googleUser.email,
          phone: savedPhone,
          photoURL: googleUser.photoURL
        })
      });

      if (res.success && res.user) {
        const loggedInUser = {
          id: res.user.id || googleUser.uid,
          email: res.user.email || googleUser.email,
          role: 'customer',
          name: res.user.name || googleUser.displayName || 'Guest Diner',
          photoURL: googleUser.photoURL,
          phone: res.user.phone || savedPhone
        };

        localStorage.setItem('Orderin_diner_user', JSON.stringify(loggedInUser));
        if (loggedInUser.phone) {
          localStorage.setItem('Orderin_diner_phone', loggedInUser.phone);
        }
        setCurrentUser(loggedInUser);
      }
    } catch (err) {
      console.error("Google Login failed:", err);
      alert("Google Sign-In failed: " + err.message);
    }
  };

  const handleSavePhone = async (e) => {
    e.preventDefault();
    if (!phoneInput) return;
    setSavingPhone(true);
    try {
      const res = await apiRequest('/auth/google-diner', {
        method: 'POST',
        body: JSON.stringify({
          name: currentUser.name,
          email: currentUser.email,
          phone: phoneInput,
          photoURL: currentUser.photoURL
        })
      });

      if (res.success && res.user) {
        const updatedUser = {
          ...currentUser,
          phone: res.user.phone
        };
        localStorage.setItem(`Orderin_phone_${currentUser.id}`, res.user.phone);
        localStorage.setItem('Orderin_diner_phone', res.user.phone);
        localStorage.setItem('Orderin_diner_user', JSON.stringify(updatedUser));
        setCurrentUser(updatedUser);
      }
    } catch (err) {
      console.error("Failed to save phone number:", err);
      alert("Failed to save phone number: " + err.message);
    } finally {
      setSavingPhone(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fbSignOut(auth);
      localStorage.removeItem('Orderin_diner_user');
      localStorage.removeItem('Orderin_diner_phone');
      setCurrentUser(null);
      setPastOrders([]);
      setCheckoutStep(null);
    } catch (err) {
      console.warn("Sign out failed:", err.message);
    }
  };

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
        if (foodTypeFilter === 'spicy' && !item.tags?.isSpicy) return false;
      }
      if (searchQuery) {
        return item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
               (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
      }
      return true;
    });
  }, [menus, restaurant, foodTypeFilter, searchQuery]);

  const mostOrderedMenus = useMemo(() => {
    const tagged = filteredMenus.filter(m => m.tags?.isBestseller || m.tags?.isTodaySpecial);
    if (tagged.length > 0) return tagged;
    return filteredMenus.slice(0, 4);
  }, [filteredMenus]);

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
          setShowPaymentModal(false);
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

  const cartCgst = useMemo(() => {
    const cgstPercent = typeof restaurant?.settings?.cgstPercentage === 'number' ? restaurant.settings.cgstPercentage : (typeof restaurant?.settings?.gstPercentage === 'number' ? restaurant.settings.gstPercentage / 2 : 2.5);
    return Math.round((cartSubtotal * (cgstPercent / 100)) * 100) / 100;
  }, [cartSubtotal, restaurant]);

  const cartSgst = useMemo(() => {
    const sgstPercent = typeof restaurant?.settings?.sgstPercentage === 'number' ? restaurant.settings.sgstPercentage : (typeof restaurant?.settings?.gstPercentage === 'number' ? restaurant.settings.gstPercentage / 2 : 2.5);
    return Math.round((cartSubtotal * (sgstPercent / 100)) * 100) / 100;
  }, [cartSubtotal, restaurant]);

  const cartGst = useMemo(() => {
    return cartCgst + cartSgst;
  }, [cartCgst, cartSgst]);

  // Set delivery fee strictly to 0 as customer pays only what is shown (no delivery charges)
  const deliveryFee = 0;

  const couponDiscount = useMemo(() => {
    if (!activeCoupon) return 0;
    if (cartSubtotal < activeCoupon.minOrderAmount) return 0; // Safely invalidate if cart falls below threshold
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
      createdAt: verifiedOrder.createdAt,
      orderType: verifiedOrder.orderType || 'table',
      pickupTime: verifiedOrder.pickupTime || '',
      pickupCode: verifiedOrder.pickupCode || '',
      preparationStatus: verifiedOrder.preparationStatus || 'Pending',
      routeFrom: verifiedOrder.routeFrom || '',
      routeTo: verifiedOrder.routeTo || '',
      routeETA: verifiedOrder.routeETA || ''
    };

    setOrders([newOrder, ...orders]);
    setCart([]);
    setActiveCoupon(null);
    setPendingOrderId(null); // Clear so next checkout creates a fresh order
    setLiveOrderTrackingId(verifiedOrder._id);
    setCheckoutStep('tracking');
    setShowPaymentModal(false);
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
            // Only reuse if the order is NOT already paid
            if (checkRes.order.paymentStatus === 'PAID') {
              console.warn("Previous pending order is already paid. Creating a new one.");
              setPendingOrderId(null);
            } else {
              activeOrder = checkRes.order;
            }
          }
        } catch (err) {
          console.warn("Could not retrieve existing pending order. Creating a new one:", err.message);
          setPendingOrderId(null);
        }
      }

      if (!activeOrder) {
        // 1. Create a pending order on the MongoDB database
        const orderRes = await apiRequest('/orders', {
          method: 'POST',
          body: JSON.stringify({
            restaurantId: restaurant.id,
            tableNo: activeTableNo ? activeTableNo : (localOrderType === 'table' ? (enteredTableNo || 'T1') : ''),
            items: cart.map(i => ({
              menuItem: i.id,
              name: i.name,
              quantity: i.quantity,
              selectedAddons: i.selectedAddons || [],
              price: i.discountPrice || i.price
            })),
            paymentMethod: 'online',
            orderType: activeTableNo ? 'table' : localOrderType,
            pickupTime: activeTableNo ? '' : (localOrderType === 'scheduled' ? `${localPickupDate} ${localPickupTime}` : ''),
            pickupCode: activeTableNo ? '' : (localOrderType === 'scheduled' ? Math.floor(1000 + Math.random() * 9000).toString() : ''),
            customerName: activeTableNo ? (currentUser?.name || 'Guest Diner') : localCustomerName,
            customerPhone: activeTableNo ? (currentUser?.phone || '') : localCustomerPhone
          })
        });

        if (!orderRes.success || !orderRes.order) {
          throw new Error(orderRes.error || "Failed to create database order");
        }
        activeOrder = orderRes.order;
        setPendingOrderId(activeOrder._id);
      }

      // 2. Create Razorpay order on backend
      const rzRes = await apiRequest('/payments/create-order', {
        method: 'POST',
        body: JSON.stringify({ orderId: activeOrder._id })
      });

      if (!rzRes.success) {
        throw new Error(rzRes.error || "Failed to initialize payment gateway order");
      }

      // 3. Check if it's a mock payment (sandbox mode without valid keys)
      if (rzRes.isMock) {
        setGatewayFallbackNote("Platform running in mock mode. Click below to simulate successful payment splits.");
        setShowPaymentModal(true);
        setPaymentProcessing(false);
        return;
      }

      // 4. Load Razorpay Checkout SDK script
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        throw new Error("Razorpay SDK failed to load. Please check your internet connection.");
      }

      setLiveOrderTrackingId(activeOrder._id);
      joinRoom(`order_${activeOrder._id}`);

      // 5. Open Razorpay payment gateway options
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_your_key',
        amount: rzRes.amount,
        currency: rzRes.currency || 'INR',
        name: restaurant.name,
        description: `Order settlement via Razorpay Standard Checkout`,
        order_id: rzRes.id,
        handler: async function (response) {
          console.log("Razorpay checkout completed, verifying on backend...");
          try {
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
              finalizeSuccessfulOrder(verifyRes.order);
            } else {
              setPaymentError("Payment verification failed on server.");
              setPaymentProcessing(false);
            }
          } catch (err) {
            setPaymentError("Verification request failed: " + err.message);
            setPaymentProcessing(false);
          }
        },
        prefill: {
          name: activeOrder.customerName || 'Guest Customer',
          contact: activeOrder.customerPhone || '9999999999'
        },
        theme: {
          color: restaurant.theme?.primaryColor || '#ff385c'
        },
        modal: {
          ondismiss: function () {
            console.log("Checkout modal dismissed by user");
            setPaymentError("Payment cancelled by user.");
            setPaymentProcessing(false);
          }
        }
      };

      const rzp1 = new window.Razorpay(options);
      rzp1.on('payment.failed', function (response) {
        console.error("Razorpay checkout error:", response.error);
        setPaymentError(response.error.description || "Checkout payment failed.");
        setPaymentProcessing(false);
      });
      
      rzp1.open();
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
    setShowPaymentModal(false);

    try {
      setLiveOrderTrackingId(pendingOrderId);
      joinRoom(`order_${pendingOrderId}`);

      const verifyRes = await apiRequest('/payments/verify', {
        method: 'POST',
        body: JSON.stringify({
          orderId: pendingOrderId,
          isMock: true,
          razorpay_order_id: `mock_order_${Math.random().toString(36).substring(5)}`,
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

  if (restaurant && restaurant.isApproved === false) {
    const primaryColor = restaurant.theme?.primaryColor || '#ff385c';
    return (
      <div className="wrap customer-theme md:my-6 md:shadow-2xl min-h-[85vh] bg-slate-50 text-slate-800 flex flex-col items-center justify-center p-8 text-center space-y-6 select-none font-sans">
        {restaurant.logo ? (
          <img src={resolveImageUrl(restaurant.logo)} className="w-24 h-24 rounded-3xl object-contain bg-white p-2 border border-slate-200 shadow-sm mx-auto animate-pulse" alt="logo" />
        ) : (
          <div className="w-24 h-24 rounded-3xl flex items-center justify-center text-4xl font-black text-white mx-auto animate-pulse" style={{ backgroundColor: primaryColor }}>
            {restaurant.name?.charAt(0) || '🏪'}
          </div>
        )}
        <h2 className="text-2xl font-black tracking-tight text-slate-900">{restaurant.name}</h2>
        <div className="h-0.5 w-16 mx-auto" style={{ backgroundColor: primaryColor }}></div>
        <p className="text-sm font-bold text-slate-600 max-w-sm leading-relaxed">
          Contact Orderin support to know your rejection
        </p>
        {onBack && (
          <button onClick={onBack} className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs px-5 py-2.5 rounded-xl transition cursor-pointer">
            Go Back
          </button>
        )}
      </div>
    );
  }

  if (restaurant && (restaurant.subscriptionActive === false || restaurant.isActive === false)) {
    const primaryColor = restaurant.theme?.primaryColor || '#ff385c';
    return (
      <div className="wrap customer-theme md:my-6 md:shadow-2xl min-h-[85vh] bg-slate-50 text-slate-800 flex flex-col items-center justify-center p-8 text-center space-y-6 select-none font-sans">
        {restaurant.logo ? (
          <img src={resolveImageUrl(restaurant.logo)} className="w-24 h-24 rounded-3xl object-contain bg-white p-2 border border-slate-200 shadow-sm mx-auto" alt="logo" />
        ) : (
          <div className="w-24 h-24 rounded-3xl flex items-center justify-center text-4xl font-black text-white mx-auto" style={{ backgroundColor: primaryColor }}>
            {restaurant.name?.charAt(0) || '🏪'}
          </div>
        )}
        <h2 className="text-2xl font-black tracking-tight text-slate-900">{restaurant.name}</h2>
        <div className="h-0.5 w-16 mx-auto" style={{ backgroundColor: primaryColor }}></div>
        <p className="text-sm font-bold text-slate-600 max-w-sm leading-relaxed">
          Please renew your profile for the further services in that
        </p>
        {onBack && (
          <button onClick={onBack} className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs px-5 py-2.5 rounded-xl transition cursor-pointer">
            Go Back
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="wrap customer-theme md:my-6 md:shadow-2xl">
      {/* Hero Header */}
      {!checkoutStep && (
        <div className="hero">
          <div className="hero-art">
            <div 
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `url(${resolveImageUrl(restaurant.banner || 'https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=1200&auto=format&fit=crop')})`
              }}
            />
            {/* Dark gradient overlay for typography readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-950/20 z-0"></div>
          </div>
          <div className="hero-top-bar">
            <button 
              onClick={onBack} 
              className="hbtn"
              aria-label="Go back"
            >
              <ArrowLeft className="w-4 h-4 text-white" />
            </button>
            <div className="hbtn-row">
              <button className="hbtn" aria-label="Save"><Heart className="w-4 h-4 text-white" /></button>
            </div>
          </div>
          <div className="hero-content text-left flex gap-4 items-end z-10 w-full">
            <img 
              src={resolveImageUrl(restaurant.logo)} 
              alt={restaurant.name} 
              className="w-14 h-14 rounded-2xl object-contain bg-slate-900/90 p-1.5 border border-white/10 shadow-lg shadow-black/40 backdrop-blur-sm shrink-0" 
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            <div className="space-y-1 text-left flex-1 min-w-0">
              <div className="hero-name" style={{ marginBottom: 0 }}>{restaurant.name}</div>
              {restaurant.tagline && (
                <div className="text-[11px] text-slate-300 font-medium opacity-90 leading-snug line-clamp-1 truncate">
                  {restaurant.tagline}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cart/Tracking Mode Header removed */}

      <div className="flex-1 flex flex-col justify-between pt-2 pb-24">
        {!checkoutStep ? (
          <div id="menu-top-anchor" className="space-y-4 scroll-mt-24">
            {/* Search Input Row */}
            <div className="search-row" role="search">
              <Search className="w-4 h-4 text-[var(--ink3)]" />
              <input
                type="text"
                placeholder={t('searchFood')}
                className="bg-transparent border-none outline-none text-xs text-slate-800 w-full placeholder:text-slate-400"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div className="flt">
                <SlidersHorizontal className="w-4 h-4 text-[var(--ink3)]" />
              </div>
            </div>

            {/* Dietary filter Pills */}
            <div className="pills-row" role="group" aria-label="Dietary filter">
              {[
                { id: 'all', label: 'All' },
                { id: 'veg', label: 'Veg' },
                { id: 'non-veg', label: 'Non-veg' },
                { id: 'vegan', label: 'Vegan' },
                { id: 'spicy', label: 'Spicy' }
              ].map(type => (
                <button
                  key={type.id}
                  onClick={() => setFoodTypeFilter(type.id)}
                  className={`pill ${foodTypeFilter === type.id ? 'on' : ''}`}
                >
                  {type.label}
                </button>
              ))}
            </div>

            {/* Sticky Categories Bar */}
            <div className="tabs-row sticky top-0 bg-[var(--bg)]/95 backdrop-blur-md py-2.5 z-20 border-b border-slate-200/50">
              <button
                onClick={() => handleCategoryClick('All')}
                className={`tb ${selectedCategoryTab === 'All' ? 'on' : ''}`}
              >
                Popular
              </button>
              {filteredCategories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryClick(cat.name)}
                  className={`tb ${selectedCategoryTab === cat.name ? 'on' : ''}`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Most Ordered Section */}
            {mostOrderedMenus.length > 0 && (
              <>
                <div className="lbl">Most ordered</div>
                <div className="hscroll" role="list">
                  {mostOrderedMenus.map(item => {
                    const cartItem = cart.find(i => i.id === item.id);
                    // Cycle warm, sage, rose backgrounds for aesthetic visual look
                    const bgClasses = ['c-warm', 'c-sage', 'c-rose', 'c-sky'];
                    const bgClass = bgClasses[item.name.length % 4];
                    return (
                      <div className="hcard" key={item.id}>
                        <div className={`hcard-img ${bgClass}`} onClick={() => setSelectedFoodPreview(item)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                          <div className={`vmark ${item.foodType === 'non-veg' ? 'n' : 'v'}`} title={item.foodType}></div>
                          {item.image ? (
                            <img 
                              src={resolveImageUrl(item.image)} 
                              alt={item.name} 
                              className="w-full h-full object-cover rounded-t-[var(--r)]" 
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div 
                            className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex flex-col items-center justify-center text-slate-400 gap-1.5 rounded-t-[var(--r)]"
                            style={{ display: item.image ? 'none' : 'flex' }}
                          >
                            <Utensils className="w-6 h-6 text-slate-300" />
                            <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400">Fresh Dish</span>
                          </div>
                          {cartItem ? (
                            <div className="absolute bottom-2 right-2 flex items-center bg-[var(--ink)] rounded-full py-0.5 px-1.5 shadow-lg z-10" onClick={(e) => e.stopPropagation()}>
                              <button onClick={() => handleDecreaseQuantity(item.id)} className="text-white text-[12px] font-black px-1.5">−</button>
                              <span className="text-white text-[11px] font-extrabold px-1.5">{cartItem.quantity}</span>
                              <button onClick={() => handleAddToCart(item)} className="text-white text-[12px] font-black px-1.5">+</button>
                            </div>
                          ) : (
                            <button 
                              className="hcard-add"
                              onClick={(e) => { e.stopPropagation(); handleAddToCart(item); }}
                            >
                              <Plus className="w-4 h-4 text-white" />
                            </button>
                          )}
                        </div>
                        <div className="hcard-body">
                          <div className="hcard-name line-clamp-1">{item.name}</div>
                          <div className="hcard-sub line-clamp-1">{item.description}</div>
                          <div className="hcard-foot">
                            <div>
                              <span className="hcard-price">₹{item.discountPrice || item.price}</span>
                              {item.discountPrice && <span className="hcard-strike">₹{item.price}</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* Offer Coupon Card */}
            {coupons && coupons.length > 0 && (
              <div 
                className="offer-card" 
                onClick={() => {
                  if (cartSubtotal < coupons[0].minOrderAmount) {
                    alert(`This coupon requires a minimum order amount of ₹${coupons[0].minOrderAmount}`);
                  } else {
                    setActiveCoupon(coupons[0]);
                  }
                }} 
                style={{ cursor: 'pointer' }}
              >
                <div className="offer-icon"><Tag className="w-5 h-5 text-white" /></div>
                <div className="text-left flex-1 min-w-0">
                  <div className="offer-t truncate">{coupons[0].code} - {coupons[0].description}</div>
                  <div className="offer-s">Click to auto-apply coupon</div>
                </div>
                <div className="offer-arr"><ChevronRight className="w-4 h-4 text-white/40" /></div>
              </div>
            )}

            {/* Main Menu List Segment */}
            <div className="lbl">Main menu</div>
            <div className="list-wrap">
              {filteredCategories.map(cat => {
                const categoryMenus = filteredMenus.filter(item => item.categoryId === cat.id);
                if (categoryMenus.length === 0) return null;

                return (
                  <div 
                    key={cat.id} 
                    id={`category-section-${cat.id}`} 
                    className="space-y-1 pt-1 scroll-mt-20"
                  >
                    <div className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest text-left pb-1 border-b border-slate-200/50 mt-4">
                      {cat.name} ({categoryMenus.length})
                    </div>
                    {categoryMenus.map((item) => {
                      const cartItem = cart.find(i => i.id === item.id);
                      const bgClasses = ['warm', 'sage', 'rose'];
                      const bgClass = bgClasses[item.name.length % 3];
                      return (
                        <div className="lrow" key={item.id}>
                          <div className={`limg ${bgClass}`} onClick={() => setSelectedFoodPreview(item)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifycontent: 'center', position: 'relative' }}>
                            <div className={`vmark ${item.foodType === 'non-veg' ? 'n' : 'v'}`} title={item.foodType}></div>
                            {item.image ? (
                              <img 
                                src={resolveImageUrl(item.image)} 
                                alt={item.name} 
                                className="w-full h-full object-cover" 
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <div 
                              className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-400"
                              style={{ display: item.image ? 'none' : 'flex' }}
                            >
                              <Utensils className="w-4 h-4 text-slate-300" />
                            </div>
                          </div>
                          <div className="ldet">
                            <div className="lname" onClick={() => setSelectedFoodPreview(item)} style={{ cursor: 'pointer' }}>{item.name}</div>
                            <div className="ldesc">{item.description}</div>
                            <div className="lfoot">
                              <div className="lprice">₹{item.discountPrice || item.price}</div>
                              <div className="ladd-wrap">
                                {cartItem ? (
                                  <div className="lqty">
                                    <button className="qb" onClick={() => handleDecreaseQuantity(item.id)}>−</button>
                                    <span className="qn">{cartItem.quantity}</span>
                                    <button className="qb" onClick={() => handleAddToCart(item)}>+</button>
                                  </div>
                                ) : (
                                  <button className="ladd" onClick={() => handleAddToCart(item)}>
                                    <span className="ladd-lbl">Add</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
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
                  <div className="text-left">
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
                <div className="bg-red-50/80 border border-red-200 rounded-2xl p-4 flex gap-3 text-xs text-left">
                  <QrCode className="w-5 h-5 text-red-500 animate-pulse" />
                  <p className="text-slate-700">Dine-in table order active for <strong className="text-red-500 font-extrabold">Table {activeTableNo}</strong>. Serving directly to your table!</p>
                </div>
              )}

              {!activeTableNo && (
                <div className="space-y-4 text-left border border-slate-100 bg-slate-50/50 p-4 rounded-3xl">
                  <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Choose Dining / Pickup Option</span>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setLocalOrderType('table')}
                      className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all cursor-pointer ${
                        localOrderType === 'table' 
                          ? 'border-red-500 bg-red-50/30 text-red-600' 
                          : 'border-slate-200/60 bg-white text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      <Utensils className="w-5 h-5 mb-1 text-slate-500" />
                      <span className="text-xs font-black">Table Dine-In</span>
                      <span className="text-[8px] text-slate-400 mt-0.5 text-center">Eat at restaurant</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setLocalOrderType('scheduled')}
                      className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all cursor-pointer ${
                        localOrderType === 'scheduled' 
                          ? 'border-red-500 bg-red-50/30 text-red-600' 
                          : 'border-slate-200/60 bg-white text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      <Clock className="w-5 h-5 mb-1 text-slate-500" />
                      <span className="text-xs font-black">Scheduled Pickup</span>
                      <span className="text-[8px] text-slate-400 mt-0.5 text-center">Pre-order takeaway</span>
                    </button>
                  </div>

                  {localOrderType === 'table' && (
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-extrabold uppercase">Enter Table Number</label>
                      <input
                        type="text"
                        placeholder="e.g. T4, T5"
                        value={enteredTableNo}
                        onChange={(e) => setEnteredTableNo(e.target.value.toUpperCase())}
                        className="w-full bg-white border border-slate-200 px-3.5 py-2 rounded-xl text-xs font-bold focus:outline-none focus:border-red-500"
                      />
                    </div>
                  )}

                  {localOrderType === 'scheduled' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-extrabold uppercase">Pickup Date</label>
                        <input
                          type="date"
                          value={localPickupDate}
                          onChange={(e) => setLocalPickupDate(e.target.value)}
                          className="w-full bg-white border border-slate-200 px-2 py-1.5 rounded-xl text-[10px] font-bold focus:outline-none focus:border-red-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-extrabold uppercase">Pickup Time</label>
                        <input
                          type="time"
                          value={localPickupTime}
                          onChange={(e) => setLocalPickupTime(e.target.value)}
                          className="w-full bg-white border border-slate-200 px-2 py-1.5 rounded-xl text-[10px] font-bold focus:outline-none focus:border-red-500"
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 pt-1 border-t border-slate-100/80">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-extrabold uppercase">Your Name</label>
                      <input
                        type="text"
                        placeholder="Your name"
                        value={localCustomerName}
                        onChange={(e) => setLocalCustomerName(e.target.value)}
                        className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold focus:outline-none focus:border-red-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-extrabold uppercase">Phone Number</label>
                      <input
                        type="text"
                        placeholder="Phone Number"
                        value={localCustomerPhone}
                        onChange={(e) => setLocalCustomerPhone(e.target.value)}
                        className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold focus:outline-none focus:border-red-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="APPLY COUPONS"
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
                          onClick={() => {
                            if (cartSubtotal < cop.minOrderAmount) {
                              alert(`This coupon requires a minimum order amount of ₹${cop.minOrderAmount}`);
                            } else {
                              setActiveCoupon(cop);
                            }
                          }}
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

              <div className="bg-white rounded-3xl border border-slate-100 p-4 space-y-2.5 text-xs text-slate-600 shadow-sm shadow-slate-100 text-left">
                <div className="flex justify-between">
                  <span>{t('subtotal')}</span>
                  <span className="font-bold text-slate-900">₹{cartSubtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span>CGST ({typeof restaurant?.settings?.cgstPercentage === 'number' ? restaurant.settings.cgstPercentage : (typeof restaurant?.settings?.gstPercentage === 'number' ? restaurant.settings.gstPercentage / 2 : 2.5)}%)</span>
                  <span className="font-bold text-slate-900">₹{cartCgst}</span>
                </div>
                <div className="flex justify-between">
                  <span>SGST ({typeof restaurant?.settings?.sgstPercentage === 'number' ? restaurant.settings.sgstPercentage : (typeof restaurant?.settings?.gstPercentage === 'number' ? restaurant.settings.gstPercentage / 2 : 2.5)}%)</span>
                  <span className="font-bold text-slate-900">₹{cartSgst}</span>
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
                className="w-full bg-[var(--ink)] text-white font-extrabold py-3.5 rounded-2xl shadow hover:opacity-90 transition"
              >
                Pay
              </button>
            </div>
          </div>
        ) : checkoutStep === 'profile' ? (
          <div className="space-y-6 px-4 text-left">
            <div className="flex items-center gap-3">
              <button onClick={() => setCheckoutStep(null)} className="p-2 bg-slate-100 border border-slate-200/50 rounded-full hover:bg-slate-200 text-slate-700">
                <X className="w-4 h-4" />
              </button>
              <h3 className="text-lg font-black text-slate-900">Your Dining Profile</h3>
            </div>

            {!currentUser ? (
              // ── SIGN IN PROMPT ──
              <div className="bg-white rounded-3xl border border-slate-100 p-6 space-y-6 shadow-sm shadow-slate-100">
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto text-red-500">
                    <User className="w-8 h-8" />
                  </div>
                  <h4 className="text-lg font-extrabold text-slate-900">Unlock Diner Dashboard</h4>
                  <p className="text-xs text-slate-500 font-medium">Sign in with Google to access premium ordering perks.</p>
                </div>

                <div className="space-y-4 border-t border-slate-100 pt-4">
                  <div className="flex gap-3 items-start">
                    <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg shrink-0 mt-0.5">
                      <ClipboardList className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-slate-800">Easy Order History Tracking</h5>
                      <p className="text-[10px] text-slate-400">Instantly look up what you ordered previously and re-order with ease.</p>
                    </div>
                  </div>

                  <div className="flex gap-3 items-start">
                    <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg shrink-0 mt-0.5">
                      <Award className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-slate-800">Your Taste Analytics</h5>
                      <p className="text-[10px] text-slate-400 font-medium">See your favorite dishes and keep track of how much you spent on restaurants.</p>
                    </div>
                  </div>

                  <div className="flex gap-3 items-start">
                    <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg shrink-0 mt-0.5">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-slate-800">Save Time with Autocomplete</h5>
                      <p className="text-[10px] text-slate-400 font-medium">Your number is automatically loaded at checkout for hassle-free Razorpay payments.</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleGoogleLogin}
                  className="w-full flex items-center justify-center gap-2.5 bg-[var(--ink)] text-white hover:opacity-95 font-extrabold py-3 rounded-2xl shadow-lg transition cursor-pointer"
                >
                  <img src="https://img.icons8.com/color/48/google-logo.png" className="w-5 h-5 bg-white rounded-full p-0.5" alt="" />
                  <span>Sign In with Google</span>
                </button>
              </div>
            ) : (
              // ── SIGNED IN PROFILE VIEW ──
              <div className="space-y-6">
                {/* User card */}
                <div className="bg-white rounded-3xl border border-slate-100 p-5 space-y-4 shadow-sm shadow-slate-100 flex items-center gap-4">
                  {currentUser.photoURL ? (
                    <img src={currentUser.photoURL} className="w-16 h-16 rounded-full object-cover border-2 border-emerald-400 bg-slate-100" alt="" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200">
                      <User className="w-8 h-8" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-base font-black text-slate-900 truncate">{currentUser.name}</h4>
                    <p className="text-xs text-slate-400 truncate">{currentUser.email}</p>
                    <span className="inline-block mt-1 text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                      Diner Member
                    </span>
                  </div>
                </div>

                {/* Phone Setup Card */}
                {!currentUser.phone ? (
                  <div className="bg-red-50/60 border border-red-100 rounded-3xl p-5 space-y-3">
                    <div className="flex gap-2 text-red-700">
                      <ShieldAlert className="w-5 h-5 shrink-0" />
                      <div className="space-y-0.5">
                        <h5 className="text-xs font-bold">Complete your setup</h5>
                        <p className="text-[10px] text-slate-500">Save your phone number once to pre-fill Razorpay payments and fetch your past order list.</p>
                      </div>
                    </div>
                    <form onSubmit={handleSavePhone} className="flex gap-2">
                      <input
                        type="tel"
                        required
                        placeholder="e.g. 9988776655"
                        className="flex-1 bg-white border border-slate-200 px-3.5 py-2 rounded-xl text-xs font-bold focus:outline-none focus:border-red-500"
                        value={phoneInput}
                        onChange={e => setPhoneInput(e.target.value)}
                      />
                      <button
                        type="submit"
                        disabled={savingPhone}
                        className="bg-[var(--ink)] text-white font-extrabold text-xs px-4 py-2 rounded-xl shadow hover:opacity-90 transition disabled:opacity-60 cursor-pointer"
                      >
                        {savingPhone ? 'Saving...' : 'Save'}
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="bg-white rounded-3xl border border-slate-100 p-4 shadow-sm shadow-slate-100 flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-bold">Linked Number (Razorpay prefill):</span>
                    <strong className="text-slate-900 font-extrabold">{currentUser.phone}</strong>
                  </div>
                )}

                {/* Diner Analytics benefits */}
                {currentUser.phone && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white rounded-3xl border border-slate-100 p-4 text-center space-y-1 shadow-sm">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Visits</span>
                      <span className="text-2xl font-black text-[var(--ink)]">{pastOrders.length}</span>
                    </div>
                    <div className="bg-white rounded-3xl border border-slate-100 p-4 text-center space-y-1 shadow-sm">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Spent</span>
                      <span className="text-2xl font-black text-emerald-600">
                        ₹{pastOrders.reduce((sum, o) => sum + (o.paymentStatus === 'PAID' ? o.totalAmount : 0), 0)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Past orders list */}
                <div className="space-y-3">
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Your Past Orders ({pastOrders.length})</span>
                  
                  {loadingPastOrders ? (
                    <div className="py-8 text-center text-xs text-slate-400 animate-pulse">Loading orders...</div>
                  ) : pastOrders.length === 0 ? (
                    <div className="bg-slate-50 border border-slate-100 rounded-3xl p-6 text-center text-xs text-slate-400">
                      No orders found under {currentUser.phone || 'this account'}. Link your phone number or make your first payment!
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                      {pastOrders.map(ord => (
                        <div key={ord.id || ord._id} className="bg-white border border-slate-100 p-3.5 rounded-2xl flex justify-between items-center shadow-sm">
                          <div className="space-y-1 text-left">
                            <h5 className="text-[11px] font-extrabold text-slate-800 leading-tight">
                              {ord.restaurant?.name || 'Partner Cafe'}
                            </h5>
                            <p className="text-[9px] text-slate-400 font-bold">
                              {new Date(ord.createdAt).toLocaleDateString()} at {new Date(ord.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </p>
                            <div className="flex gap-1.5 flex-wrap pt-0.5">
                              {(ord.items || []).map((i, idx) => (
                                <span key={idx} className="bg-slate-100 text-slate-600 text-[8px] px-1.5 py-0.5 rounded font-medium">
                                  {i.name} x{i.quantity}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="text-right space-y-1">
                            <span className="text-xs font-black text-slate-900 block">₹{ord.totalAmount}</span>
                            <span className={`inline-block text-[8px] font-bold px-1.5 py-0.5 rounded-full ${
                              ord.paymentStatus === 'PAID' ? 'bg-green-50 text-green-600 border border-green-200/50' : 'bg-yellow-50 text-yellow-600 border border-yellow-200/50'
                            }`}>
                              {ord.paymentStatus === 'PAID' ? 'Paid' : 'Unpaid'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Logout button */}
                <button
                  onClick={handleLogout}
                  className="w-full py-3 bg-red-50 hover:bg-red-100 text-red-500 font-extrabold text-xs rounded-2xl transition flex items-center justify-center gap-2 cursor-pointer border border-red-200/20"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout Diner Account</span>
                </button>
              </div>
            )}
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

                {/* Secure Scheduled Pre-order tracking code */}
                {activeTrackingOrder.orderType === 'scheduled' && (
                  <div className="bg-slate-950 text-white rounded-[24px] p-6 text-center space-y-4 relative overflow-hidden shadow-inner">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/30 to-purple-900/30 z-0"></div>
                    <div className="relative z-10 space-y-3">
                      <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest inline-block">
                        Pickup Coupon Code
                      </span>
                      {activeTrackingOrder.pickupCode ? (
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center space-y-1">
                          <span className="text-[9px] text-slate-400 uppercase tracking-widest font-black block">Show Code to Cashier</span>
                          <span className="text-3xl font-black text-amber-300 tracking-wider font-mono block animate-pulse">
                            {activeTrackingOrder.pickupCode}
                          </span>
                        </div>
                      ) : (
                        <p className="text-[10px] text-slate-400 animate-pulse">Assigning secure OTP code...</p>
                      )}
                      
                      <div className="space-y-1 text-xs text-left pt-2">
                        <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block">Pickup Schedule</span>
                        <div className="flex items-center gap-2 text-slate-200 font-bold bg-white/5 p-3 rounded-xl border border-white/5 mt-1">
                          <Clock className="w-4 h-4 text-amber-400" />
                          <div>
                            <span className="block text-[9px] text-slate-400">Scheduled pickup time</span>
                            <span>{activeTrackingOrder.pickupTime || 'Advance Pickup'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-4 text-left">
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

      {/* Dynamic bottom navigation bar */}
      <div className="nav" role="navigation" aria-label="Main navigation">
        <div className={`ni ${!checkoutStep ? 'on' : ''}`} onClick={() => setCheckoutStep(null)}>
          <Utensils className="w-5 h-5" />
          <span>Menu</span>
        </div>
        <div className={`ni ${checkoutStep === 'cart' ? 'on' : ''}`} onClick={() => setCheckoutStep('cart')}>
          <div className="cart-rel">
            <ShoppingBag className="w-5 h-5" />
            <div className="cbadge" id="cbadge">{cart.reduce((sum, i) => sum + i.quantity, 0)}</div>
          </div>
          <span>Cart</span>
        </div>
        <div className={`ni ${checkoutStep === 'profile' ? 'on' : ''}`} onClick={() => setCheckoutStep('profile')}>
          <User className="w-5 h-5" />
          <span>Profile</span>
        </div>
        {liveOrderTrackingId && (
          <div className={`ni ${checkoutStep === 'tracking' ? 'on' : ''}`} onClick={() => setCheckoutStep('tracking')}>
            <Activity className="w-5 h-5" />
            <span>Tracking</span>
          </div>
        )}
      </div>

      {/* Selected Food Details Modal */}
      {selectedFoodPreview && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-sm bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-2xl space-y-4 pb-6">
            <div className="relative h-56 bg-slate-50 flex items-center justify-center">
              {selectedFoodPreview.image ? (
                <img 
                  src={resolveImageUrl(selectedFoodPreview.image)} 
                  alt={selectedFoodPreview.name} 
                  className="w-full h-full object-cover" 
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div 
                className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex flex-col items-center justify-center text-slate-400 gap-2"
                style={{ display: selectedFoodPreview.image ? 'none' : 'flex' }}
              >
                <Utensils className="w-10 h-10 text-slate-300" />
                <span className="text-xs uppercase tracking-wider font-extrabold text-slate-400">Gourmet Selection</span>
              </div>
              <button onClick={() => setSelectedFoodPreview(null)} className="absolute top-4 right-4 bg-white/80 border border-slate-100 p-1.5 rounded-full text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-6 space-y-4 text-left">
              <h3 className="text-lg font-black text-slate-800">{selectedFoodPreview.name}</h3>
              <p className="text-xs text-slate-600">{selectedFoodPreview.description}</p>
              <div className="flex justify-between items-center">
                <span className="text-xl font-black text-slate-900">₹{selectedFoodPreview.price}</span>
                <button onClick={() => { handleAddToCart(selectedFoodPreview); setSelectedFoodPreview(null); }} className="bg-[var(--ink)] hover:opacity-90 text-white font-bold text-xs py-2.5 px-6 rounded-xl">
                  ADD TO BASKET
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Secure Sandbox Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-sm bg-white border border-slate-100 rounded-3xl p-6 shadow-2xl space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <span className="text-sm font-bold text-slate-900">Razorpay Route Sandbox Split Checkout</span>
              <button onClick={() => setShowPaymentModal(false)} className="text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              {gatewayFallbackNote && (
                <div className="bg-amber-50 border border-amber-200/50 rounded-2xl p-4 text-xs text-amber-800 text-left space-y-1">
                  <p className="font-bold flex items-center gap-1.5 text-amber-600">
                    <span>⚠️ Gateway Fallback Mode</span>
                  </p>
                  <p className="text-[11px] leading-relaxed text-amber-700">
                    {gatewayFallbackNote}
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

    </div>
  );
}
