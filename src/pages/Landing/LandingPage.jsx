import React, { useRef, useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Utensils, Sparkles, Navigation, Clock, Calendar, Check, 
  ArrowRight, ChevronRight, ChevronLeft, Star, MapPin, 
  Building2, Store, Search, Filter, ShoppingBag, Tag,
  X, Percent, Trash2, Plus, Compass
} from 'lucide-react';
import { apiRequest } from '../../utils/api';
import { PlaceCard } from './PlaceCard';
import FeatureCarousel from './FeatureCarousel';
import PricingCard from './PricingCard';
import Loader from '../Loader';
import { SUBSCRIPTION_MONTHLY_PRICE_INR } from '../../config/subscription';

const subscriptionPlans = [
  { id: "free", name: "Free Trial", price: 0, period: "15 Days", features: ["1 Restaurant Profile", "Basic digital menu", "Table QR generator", "Up to 50 orders/mo"] },
  { id: "basic", name: "Premium Pro", price: SUBSCRIPTION_MONTHLY_PRICE_INR, period: "Month", features: ["Advanced glassmorphic themes", "Realtime order dashboard", "Email payout alerts", "Instant payout", "Call Support", "Multiple tables QR"] }
];

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

const StatItem = ({ label, value }) => (
  <div className="flex flex-col text-left">
    <span className="text-xs font-black text-slate-800">{value}</span>
    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{label}</span>
  </div>
);

const CategoryItem = ({ cat, isActive, onClick }) => {
  const [hasError, setHasError] = useState(false);
  const showImage = cat.image && !hasError;

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center gap-2 shrink-0 group focus:outline-none w-20"
    >
      <div className={`w-16 h-16 rounded-full overflow-hidden border-2 transition-all duration-300 flex items-center justify-center bg-slate-50 ${
        isActive 
          ? 'border-red-500 scale-105 shadow-md shadow-red-100' 
          : 'border-transparent group-hover:border-slate-200/80'
      }`}>
        {showImage ? (
          <img 
            src={resolveImageUrl(cat.image)} 
            onError={() => setHasError(true)}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
            alt={cat.name} 
          />
        ) : cat.id === 'All' ? (
          <div className="w-full h-full bg-gradient-to-tr from-red-500 via-orange-500 to-yellow-500 flex items-center justify-center text-white">
            <Utensils className="w-6.5 h-6.5" />
          </div>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-400">
            <Utensils className="w-6.5 h-6.5 text-slate-300" />
          </div>
        )}
      </div>
      <span className={`text-[11px] font-bold text-center transition-colors line-clamp-2 h-8 leading-tight tracking-tight select-none overflow-hidden max-w-[76px] ${
        isActive ? 'text-red-500 font-extrabold' : 'text-slate-500 group-hover:text-slate-800'
      }`} title={cat.name}>
        {cat.name}
      </span>
    </button>
  );
};

export default function LandingPage({
  currentUser,
  restaurants,
  setSelectedRestaurantSlug,
  setCurrentView,
  setActiveTableNo,
  setOrderFlow,
  cart = [],
  setCart,
  activeCoupon,
  setActiveCoupon,
  checkoutStep,
  setCheckoutStep,
  liveOrderTrackingId,
  setLiveOrderTrackingId,
  activeTableNo,
  orders = [],
  setOrders,
  showPaymentModal,
  setShowPaymentModal,
  paymentProcessing,
  setPaymentProcessing,
  coupons = []
}) {
  const scrollRef = useRef(null);

  const renderDishCard = (dish) => {
    const simulatedDiscount = dish.price > 150 ? '50% OFF' : '30% OFF';
    const hasDiscount = dish.discountPrice || dish.price > 100;
    const cartItem = cart.find(i => i.id === dish._id);
    
    const handleCardDeepLink = () => {
      if (dish.restaurant?.slug) {
        setSelectedRestaurantSlug(dish.restaurant.slug);
        setCurrentView('customer');
        setActiveTableNo('');
      }
    };

    return (
      <motion.div
        key={dish._id}
        layoutId={dish._id}
        className="bg-white border border-slate-200/80 rounded-[28px] overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 text-left flex flex-col justify-between group h-full relative"
      >
        {/* Image Container with Badges */}
        <div 
          onClick={handleCardDeepLink}
          className="relative h-44 overflow-hidden bg-slate-100 shrink-0 flex items-center justify-center cursor-pointer"
        >
          {dish.image ? (
            <img 
              src={resolveImageUrl(dish.image)} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
              alt={dish.name} 
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <div 
            className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex flex-col items-center justify-center text-slate-400 gap-2"
            style={{ display: dish.image ? 'none' : 'flex' }}
          >
            <Utensils className="w-8 h-8 text-slate-300" />
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Delicious Food</span>
          </div>
          
          {/* Dark overlay at bottom */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none z-10"></div>
          
          {/* Discount Badge */}
          {hasDiscount && (
            <span className="absolute bottom-3 left-3 bg-red-500 text-white text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider shadow-sm z-10">
              {dish.discountPrice ? '₹' + (dish.price - dish.discountPrice) + ' OFF' : simulatedDiscount}
            </span>
          )}

          {/* Diet Type */}
          <span className={`absolute top-3 right-3 px-1.5 py-0.5 rounded text-[8px] uppercase font-black text-white z-10 ${
            dish.foodType === 'veg' || dish.foodType === 'vegan' ? 'bg-green-600' : 'bg-red-600'
          }`}>
            {dish.foodType}
          </span>
        </div>

        {/* Details Body */}
        <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
          <div className="space-y-1 cursor-pointer" onClick={handleCardDeepLink}>
            <div className="flex justify-between items-start gap-2">
              <h4 className="font-extrabold text-slate-800 text-sm group-hover:text-red-500 transition-colors line-clamp-1">
                {dish.name}
              </h4>
              <div className="flex items-center gap-0.5 bg-amber-500/10 px-1.5 py-0.5 rounded-lg text-[9px] font-extrabold text-amber-500 shrink-0">
                <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                <span>{dish.restaurant?.rating || '5.0'}</span>
              </div>
            </div>
            {/* Restaurant Name */}
            <div className="flex items-center gap-1 text-[11px] font-bold text-slate-600">
              <Store className="w-3.5 h-3.5 text-slate-400" />
              <span>{dish.restaurant?.name || 'Partner Outlet'}</span>
            </div>
            {/* Restaurant Location */}
            {(dish.restaurant?.address || dish.restaurant?.contact?.address) && (
              <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-400">
                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="truncate">{dish.restaurant?.address || dish.restaurant?.contact?.address}</span>
              </div>
            )}
            {/* Category Tag */}
            <div className="pt-1">
              <span className="inline-flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-500 text-[9px] font-extrabold px-2.5 py-0.5 rounded-full transition-colors uppercase tracking-wider">
                <Tag className="w-2.5 h-2.5" />
                {dish.category?.name || 'Main Menu'}
              </span>
            </div>
          </div>

          {/* Price & Action Button Footer */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-4">
            <div className="flex items-center gap-1.5">
              <span className="font-black text-slate-800 text-sm">
                ₹{dish.discountPrice || dish.price}
              </span>
              {dish.discountPrice && (
                <span className="text-[10px] text-slate-400 line-through font-bold">
                  ₹{dish.price}
                </span>
              )}
            </div>

            {/* Direct Cart Control */}
            <div className="shrink-0">
              {cartItem ? (
                <div className="flex items-center bg-red-500 text-white rounded-xl py-1 px-2.5 shadow-sm border border-red-600 gap-1.5">
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDecreaseQuantity(dish._id); }}
                    className="text-white text-xs font-black px-1.5 focus:outline-none transition-transform active:scale-95"
                  >
                    −
                  </button>
                  <span className="text-white text-xs font-black select-none">
                    {cartItem.quantity}
                  </span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleAddToCart(dish); }}
                    className="text-white text-xs font-black px-1.5 focus:outline-none transition-transform active:scale-95"
                  >
                    +
                  </button>
                </div>
              ) : (
                <button 
                  onClick={(e) => { e.stopPropagation(); handleAddToCart(dish); }}
                  className="bg-red-500 hover:bg-red-600 text-white font-extrabold text-xs px-4 py-1.5 rounded-xl shadow-sm transition hover:scale-105 border border-red-600 focus:outline-none"
                >
                  ADD
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    );
  };
  const isCustomer = currentUser?.role === 'customer';

  // State hooks for Marketplace explore view
  const [dishes, setDishes] = useState([]);
  const [dbCategories, setDbCategories] = useState([]);
  const [loadingDishes, setLoadingDishes] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [dragMoved, setDragMoved] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // --- Landing Cart & Checkout Drawer States ---
  const [showCheckoutDrawer, setShowCheckoutDrawer] = useState(false);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [conflictDish, setConflictDish] = useState(null);
  const [paymentError, setPaymentError] = useState(null);
  const [gatewayFallbackNote, setGatewayFallbackNote] = useState(null);
  const [pendingOrderId, setPendingOrderId] = useState(null);

  // Pre-Order Details state
  const [localOrderType, setLocalOrderType] = useState('scheduled'); // 'scheduled' | 'route'
  const [localCustomerName, setLocalCustomerName] = useState(() => currentUser?.name || 'Guest Diner');
  const [localCustomerPhone, setLocalCustomerPhone] = useState(() => currentUser?.phone || localStorage.getItem('Orderin_customer_phone') || '');
  const [localPickupDate, setLocalPickupDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [localPickupTime, setLocalPickupTime] = useState('19:30');
  const [routeFrom, setRouteFrom] = useState('');
  const [routeTo, setRouteTo] = useState('');
  const [routeETA, setRouteETA] = useState('');

  // Add item to cart directly on landing page
  const handleAddToCart = (dish) => {
    // Check if cart has items from a different restaurant
    const firstItem = cart[0];
    if (firstItem && firstItem.restaurantId !== dish.restaurant?._id) {
      setConflictDish(dish);
      setShowConflictModal(true);
      return;
    }

    const formattedItem = {
      id: dish._id,
      restaurantId: dish.restaurant?._id,
      name: dish.name,
      price: dish.price,
      discountPrice: dish.discountPrice,
      image: dish.image,
      foodType: dish.foodType,
      restaurant: dish.restaurant,
      category: dish.category
    };

    const existing = cart.find(i => i.id === dish._id);
    if (existing) {
      setCart(cart.map(i => i.id === dish._id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setCart([...cart, { ...formattedItem, quantity: 1 }]);
    }
  };

  // Decrement quantity directly on landing page
  const handleDecreaseQuantity = (dishId) => {
    const item = cart.find(i => i.id === dishId);
    if (!item) return;
    if (item.quantity === 1) {
      setCart(cart.filter(i => i.id !== dishId));
    } else {
      setCart(cart.map(i => i.id === dishId ? { ...i, quantity: i.quantity - 1 } : i));
    }
  };

  // Safe Cart Clear
  const handleClearCartAndAdd = () => {
    if (!conflictDish) return;
    const formattedItem = {
      id: conflictDish._id,
      restaurantId: conflictDish.restaurant?._id,
      name: conflictDish.name,
      price: conflictDish.price,
      discountPrice: conflictDish.discountPrice,
      image: conflictDish.image,
      foodType: conflictDish.foodType,
      restaurant: conflictDish.restaurant,
      category: conflictDish.category
    };
    setCart([{ ...formattedItem, quantity: 1 }]);
    setShowConflictModal(false);
    setConflictDish(null);
  };

  // Cart pricing computations
  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => {
      let itemPrice = item.discountPrice || item.price;
      return sum + itemPrice * item.quantity;
    }, 0);
  }, [cart]);

  // Derived current restaurant settings
  const currentCartRestaurant = useMemo(() => {
    const rId = cart[0]?.restaurantId;
    if (!rId) return null;
    return restaurants.find(r => r.id === rId) || cart[0]?.restaurant;
  }, [cart, restaurants]);

  const cartGst = useMemo(() => {
    if (!currentCartRestaurant) return 0;
    const gstPercent = typeof currentCartRestaurant.settings?.gstPercentage === 'number' ? currentCartRestaurant.settings.gstPercentage : 5;
    return Math.round((cartSubtotal * (gstPercent / 100)) * 100) / 100;
  }, [cartSubtotal, currentCartRestaurant]);

  const couponDiscount = useMemo(() => {
    if (!activeCoupon) return 0;
    if (cartSubtotal < activeCoupon.minOrderAmount) return 0;
    if (activeCoupon.discountType === 'flat') return activeCoupon.discountValue;
    const computed = (cartSubtotal * activeCoupon.discountValue) / 100;
    return activeCoupon.maxDiscountAmount ? Math.min(computed, activeCoupon.maxDiscountAmount) : computed;
  }, [activeCoupon, cartSubtotal]);

  const cartTotal = useMemo(() => {
    return Math.max(0, cartSubtotal + cartGst - couponDiscount);
  }, [cartSubtotal, cartGst, couponDiscount]);

  // Razorpay triggers
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
      restaurantId: verifiedOrder.restaurant?._id || verifiedOrder.restaurant,
      customerName: verifiedOrder.customerName || "Guest Customer",
      customerPhone: verifiedOrder.customerPhone || "+91 99887 76655",
      items: cart,
      tableNo: verifiedOrder.tableNo || '',
      subTotal: verifiedOrder.subTotal,
      gstAmount: verifiedOrder.gstAmount,
      deliveryCharge: verifiedOrder.deliveryCharge || 0,
      totalAmount: verifiedOrder.totalAmount,
      paymentMethod: verifiedOrder.paymentMethod,
      paymentStatus: verifiedOrder.paymentStatus,
      orderStatus: verifiedOrder.orderStatus,
      createdAt: verifiedOrder.createdAt,
      orderType: verifiedOrder.orderType || 'scheduled',
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
    setPendingOrderId(null);
    setLiveOrderTrackingId(verifiedOrder._id);
    setShowCheckoutDrawer(false);
    setCheckoutStep('tracking');
    setCurrentView('customer_orders');
    setPaymentProcessing(false);
  };

  const handlePaymentCheckoutSubmit = async () => {
    if (cart.length === 0) return;
    setPaymentProcessing(true);
    setPaymentError(null);

    try {
      const restId = cart[0].restaurantId;
      let activeOrder = null;
      
      if (pendingOrderId) {
        try {
          const checkRes = await apiRequest(`/orders/${pendingOrderId}`);
          if (checkRes.success && checkRes.order) {
            if (checkRes.order.paymentStatus === 'PAID') {
              setPendingOrderId(null);
            } else {
              activeOrder = checkRes.order;
            }
          }
        } catch (err) {
          setPendingOrderId(null);
        }
      }

      if (!activeOrder) {
        const orderRes = await apiRequest('/orders', {
          method: 'POST',
          body: JSON.stringify({
            restaurantId: restId,
            tableNo: '',
            items: cart.map(i => ({
              menuItem: i.id,
              name: i.name,
              quantity: i.quantity,
              selectedAddons: [],
              price: i.discountPrice || i.price
            })),
            paymentMethod: 'online',
            orderType: localOrderType,
            pickupTime: localOrderType === 'scheduled' ? `${localPickupDate} ${localPickupTime}` : '',
            pickupCode: localOrderType === 'scheduled' ? Math.floor(1000 + Math.random() * 9000).toString() : '',
            customerName: localCustomerName,
            customerPhone: localCustomerPhone,
            routeFrom: localOrderType === 'route' ? routeFrom : '',
            routeTo: localOrderType === 'route' ? routeTo : '',
            routeETA: localOrderType === 'route' ? routeETA : ''
          })
        });

        if (!orderRes.success || !orderRes.order) {
          throw new Error(orderRes.error || "Failed to create database order");
        }
        activeOrder = orderRes.order;
        setPendingOrderId(activeOrder._id);
      }

      // Create Razorpay order on backend
      const rzRes = await apiRequest('/payments/create-order', {
        method: 'POST',
        body: JSON.stringify({ orderId: activeOrder._id })
      });

      if (!rzRes.success) {
        throw new Error(rzRes.error || "Failed to initialize payment gateway order");
      }

      // Sandbox simulated checkout
      if (rzRes.isMock) {
        setGatewayFallbackNote("Mock Sandbox splits active. Simulating secure Razorpay settlement.");
        setShowPaymentModal(true);
        setPaymentProcessing(false);
        return;
      }

      // Load SDK
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        throw new Error("Razorpay script load failed. Please inspect your connection.");
      }

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_your_key',
        amount: rzRes.amount,
        currency: rzRes.currency || 'INR',
        name: currentCartRestaurant?.name || 'Partner Outlet',
        description: 'Order settlement via Razorpay Standard Checkout',
        order_id: rzRes.id,
        handler: async function (response) {
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
          name: localCustomerName,
          contact: localCustomerPhone
        },
        theme: {
          color: currentCartRestaurant?.theme?.primaryColor || '#ff385c'
        },
        modal: {
          ondismiss: function () {
            setPaymentError("Payment cancelled by user.");
            setPaymentProcessing(false);
          }
        }
      };

      const rzp1 = new window.Razorpay(options);
      rzp1.open();
    } catch (err) {
      setPaymentError("Checkout failed: " + err.message);
      setPaymentProcessing(false);
    }
  };

  const finalizeSimulatedOrder = async () => {
    if (!pendingOrderId) return;
    setPaymentProcessing(true);
    setPaymentError(null);
    setShowPaymentModal(false);

    try {
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
      setPaymentError("Mock checkout failed: " + err.message);
      setPaymentProcessing(false);
    }
  };

  // Load Marketplace aggregate dishes and dynamic categories on mount
  useEffect(() => {
    if (!isCustomer) return;

    const loadMarketplaceData = async () => {
      setLoadingDishes(true);
      try {
        const dishesRes = await apiRequest('/restaurant/public/dishes');
        if (dishesRes.success && Array.isArray(dishesRes.dishes)) {
          setDishes(dishesRes.dishes);
        }

        const catsRes = await apiRequest('/restaurant/public/categories');
        if (catsRes.success && Array.isArray(catsRes.categories)) {
          setDbCategories(catsRes.categories);
        }
      } catch (err) {
        console.warn("Could not retrieve marketplace explore data:", err.message);
      } finally {
        setLoadingDishes(false);
      }
    };

    loadMarketplaceData();
  }, [isCustomer]);

  const scrollCards = (direction) => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.85;
    el.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
  };

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

  // Compile unique marketplace categories dynamically (exclusively from database)
  const resolvedCategories = useMemo(() => {
    const allPlatters = { id: 'All', name: 'All Platters', image: 'https://cdn-icons-png.flaticon.com/512/5235/5235253.png' };
    
    // Map backend categories
    const formattedDb = dbCategories.map(c => ({
      id: c._id || c.id,
      name: c.name,
      image: c.image || ''
    }));

    // Deduplicate by name
    const unique = [allPlatters];
    formattedDb.forEach(c => {
      if (!unique.find(u => u.name.toLowerCase() === c.name.toLowerCase())) {
        unique.push(c);
      }
    });

    return unique;
  }, [dbCategories]);

  // Filter logic for dishes explore catalog
  const filteredDishes = dishes.filter(dish => {
    const matchesSearch = dish.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (dish.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      dish.restaurant?.name.toLowerCase().includes(searchQuery.toLowerCase());
      
    if (selectedCategory === 'All') return matchesSearch;
    
    // Categorization check matching both ID and Name robustly
    const dishCategoryId = dish.category?._id || (typeof dish.category === 'string' ? dish.category : '');
    const dishCategoryName = dish.category?.name || '';
    
    const matchesCategory = 
      dishCategoryId === selectedCategory ||
      dishCategoryName.toLowerCase() === selectedCategory.toLowerCase() ||
      dish.name.toLowerCase().includes(selectedCategory.toLowerCase()) ||
      (dish.description || '').toLowerCase().includes(selectedCategory.toLowerCase());
      
    return matchesSearch && matchesCategory;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="space-y-12"
    >
      {/* ────────────────── TOP BANNER / MARKETING HERO ────────────────── */}
      {!isCustomer ? (
        <div className="w-full max-w-7xl mx-auto px-8 py-10 md:py-14 bg-[#011a17] text-white rounded-3xl shadow-md overflow-hidden relative">
          <div className="flex flex-col lg:flex-row justify-between items-start gap-8 lg:gap-16 relative z-10">
            {/* Left Side */}
            <div className="flex-1 space-y-4">
              <h4 className="text-[10px] font-bold tracking-[0.2em] text-slate-300 uppercase">
                Multi-Restaurant SaaS
              </h4>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-medium tracking-tight leading-[1.15]">
                Built for Restaurants, Not Against Them
              </h1>
            </div>
            
            {/* Right Side */}
            <div className="flex-1 space-y-6 lg:pt-4 text-left">
              <p className="text-[#a1b5b2] text-base md:text-lg leading-relaxed font-light">
                Unlike food aggregators that charge 25–30% per order and hide your customer data, Orderin gives you a direct digital storefront with zero commissions, full branding control, and instant bank payouts.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <button 
                  onClick={() => setCurrentView('login')}
                  className="bg-[#ccff00] hover:bg-[#bbf000] text-black font-semibold px-6 py-2.5 rounded-full transition-colors text-sm cursor-pointer shadow-md"
                >
                  Start free trial
                </button>
                <button 
                  onClick={() => setCurrentView('contact')}
                  className="bg-white hover:bg-slate-100 text-black font-semibold px-6 py-2.5 rounded-full transition-colors text-sm cursor-pointer shadow-md"
                >
                  Book a demo
                </button>
              </div>

              {/* Dynamic Live Stats Bar */}
              <div className="pt-6 border-t border-white/10 grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-3xl font-black text-[#ccff00] tracking-tight">
                    {restaurants?.length || 0}
                  </div>
                  <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                    Restaurants Powered
                  </p>
                </div>
                <div className="space-y-1">
                  <div className="text-3xl font-black text-[#ccff00] tracking-tight">
                    {(restaurants?.length || 0) * 150}
                  </div>
                  <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                    Transactions in a day
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Diner Dashboard / Search & Pre-order Capsule */
        <div className="space-y-8">
          {/* Header text */}
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <span className="bg-red-500/10 text-red-500 border border-red-500/20 px-3.5 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase inline-block">
              Food & Route Pre-Orders
            </span>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
              Welcome Back, {currentUser?.name || 'Diner'}! 👋
            </h1>
            <p className="text-sm text-slate-500">
              Satisfy your cravings instantly — pre-order for travel routes or schedule custom pickup windows.
            </p>
          </div>

          {/* Pre-order hub selection shortcuts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            
            {/* Route order card */}
            <motion.div
              onClick={() => { setOrderFlow('route'); setCurrentView('order'); }}
              className="w-full overflow-hidden rounded-[32px] bg-white border border-slate-200 shadow-md hover:shadow-xl text-slate-800 cursor-pointer relative group flex flex-col justify-between"
              whileHover={{ y: -6, scale: 1.015 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              {/* Top Section */}
              <div className="relative h-56 w-full overflow-hidden">
                <img
                  src="https://t4.ftcdn.net/jpg/02/59/09/45/360_F_259094531_10axarCzdfGRoknBIcds04CXKFB8LY2C.jpg"
                  alt="Travel Route Orders"
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />
                
                <div className="absolute bottom-0 left-0 flex w-full items-end justify-between p-5">
                  <div className="text-white text-left space-y-1">
                    <span className="text-[9px] bg-white/20 backdrop-blur-md text-white px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider">
                      Travel Stop
                    </span>
                    <h3 className="text-lg font-black tracking-tight flex items-center gap-2 mt-0.5">
                      <Navigation className="w-5 h-5 text-cyan-400 shrink-0 fill-cyan-400/10" />
                      <span>Travel Route Orders</span>
                    </h3>
                    <p className="text-xs text-white/90 font-medium line-clamp-1">
                      Choose travel points, locate restaurants, and get hot meals.
                    </p>
                  </div>
                  
                  {/* Directions Proceed Button */}
                  <div className="opacity-0 translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 shrink-0 pb-1">
                    <span className="bg-white hover:bg-slate-50 text-slate-800 font-extrabold text-[10px] uppercase tracking-wider px-4 py-2 rounded-xl shadow-md flex items-center gap-1.5">
                      Pre-order
                      <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Section */}
              <div className="p-5 text-left flex flex-col justify-between flex-1">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-black text-slate-800 text-sm uppercase tracking-wide">Route Ordering</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Multi-Restaurant</p>
                  </div>
                  <img
                    src="https://img.icons8.com/color/96/google-maps.png"
                    alt="Route navigation map"
                    className="h-9 w-16 object-contain"
                  />
                </div>
                
                <div className="my-4 h-px w-full bg-slate-100" />
                
                <div className="flex justify-between gap-4">
                  <StatItem label="Distance" value="Any Highway" />
                  <StatItem label="Elevation" value="Verified Outlets" />
                  <StatItem label="Duration" value="On-the-go" />
                </div>
              </div>
            </motion.div>

            {/* Schedule Order Card */}
            <motion.div
              onClick={() => { setOrderFlow('schedule'); setCurrentView('order'); }}
              className="w-full overflow-hidden rounded-[32px] bg-white border border-slate-200 shadow-md hover:shadow-xl text-slate-800 cursor-pointer relative group flex flex-col justify-between"
              whileHover={{ y: -6, scale: 1.015 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              {/* Top Section */}
              <div className="relative h-56 w-full overflow-hidden">
                <img
                  src="https://resos.com/wp-content/uploads/2022/09/Restaurant-1.png"
                  alt="Advance Scheduled Pickup"
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />
                
                <div className="absolute bottom-0 left-0 flex w-full items-end justify-between p-5">
                  <div className="text-white text-left space-y-1">
                    <span className="text-[9px] bg-white/20 backdrop-blur-md text-white px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider">
                      Advance Booking
                    </span>
                    <h3 className="text-lg font-black tracking-tight flex items-center gap-2 mt-0.5">
                      <Clock className="w-5 h-5 text-pink-400 shrink-0 fill-pink-400/10" />
                      <span>Advance Scheduled Pickup</span>
                    </h3>
                    <p className="text-xs text-white/90 font-medium line-clamp-1">
                      Pick a custom date and time slot to receive takeaway code.
                    </p>
                  </div>
                  
                  {/* Directions Proceed Button */}
                  <div className="opacity-0 translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 shrink-0 pb-1">
                    <span className="bg-white hover:bg-slate-50 text-slate-800 font-extrabold text-[10px] uppercase tracking-wider px-4 py-2 rounded-xl shadow-md flex items-center gap-1.5">
                      Pre-order
                      <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Section */}
              <div className="p-5 text-left flex flex-col justify-between flex-1">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-black text-slate-800 text-sm uppercase tracking-wide">Scheduled Setup</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Takeaway & Dine-in</p>
                  </div>
                  <img
                    src="https://img.icons8.com/color/96/restaurant-table.png"
                    alt="Dine-in setup reservation"
                    className="h-9 w-16 object-contain"
                  />
                </div>
                
                <div className="my-4 h-px w-full bg-slate-100" />
                
                <div className="flex justify-between gap-4">
                  <StatItem label="Distance" value="Choose Date" />
                  <StatItem label="Elevation" value="Unique Code" />
                  <StatItem label="Duration" value="Custom Time" />
                </div>
              </div>
            </motion.div>

          </div>

          {/* Dynamic Search Box */}
          <div className="relative max-w-xl mx-auto w-full">
            <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
            <input 
              type="text"
              placeholder="Search dishes (e.g. biryani, pizza) or partner restaurants..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 focus:border-red-500 focus:ring-1 focus:ring-red-500/35 rounded-2xl py-3 pl-12 pr-4 text-sm font-medium focus:outline-none transition shadow-sm"
            />
          </div>
        </div>
      )}

      {/* ────────────────── POPULAR FOOD CATEGORIES ────────────────── */}
      {isCustomer && resolvedCategories.length > 1 && (
        <div className="space-y-5 text-left">
          <h2 className="text-xl font-black text-slate-800 tracking-tight">What's on your mind?</h2>
          
          <div className="flex gap-4 overflow-x-auto py-3 px-2 -mx-2 no-scrollbar scroll-smooth">
            {resolvedCategories.map((cat) => (
              <CategoryItem
                key={cat.id}
                cat={cat}
                isActive={selectedCategory === (cat.id === 'All' ? 'All' : cat.name)}
                onClick={() => setSelectedCategory(cat.id === 'All' ? 'All' : cat.name)}
              />
            ))}
          </div>
        </div>
      )}

      {/* ────────────────── POPULAR DISHES CATALOG ────────────────── */}
      {isCustomer && (filteredDishes.length > 0 || loadingDishes) && (
        <div className="space-y-6 text-left">
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">Popular Dishes Near You</h2>
            <p className="text-xs text-slate-400 mt-1">Tap a card to deep-link directly into that restaurant's mobile food portal</p>
          </div>

          {loadingDishes ? (
            <div className="flex justify-center items-center py-16 bg-white/50 border border-slate-100 rounded-3xl w-full">
              <Loader message="Finding popular dishes near you..." size="w-20 h-20" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredDishes.map((dish) => renderDishCard(dish))}
            </div>
          )}
        </div>
      )}

      {/* ────────────────── FEATURE CAROUSEL & PRICING (SaaS views for Admins / Guests) ────────────────── */}
      {!isCustomer && <FeatureCarousel />}

      {!isCustomer && (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold">Premium SaaS Plans</h2>
            <p className="text-slate-400 text-sm mt-1">Choose the ultimate package fitted for your dining operations</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto pt-6">
            {subscriptionPlans.map((plan, idx) => (
              <PricingCard
                key={plan.id}
                variant={idx === 1 ? 'popular' : 'default'}
                planName={plan.name}
                description={idx === 1 ? "Everything you need to grow" : "Perfect for getting started"}
                price={plan.price}
                billingCycle={plan.period}
                features={plan.features}
                buttonText={`Select ${plan.name}`}
                icon={idx === 1 ? <Building2 className="w-6 h-6" /> : <Store className="w-6 h-6" />}
                onSelect={() => setCurrentView('login')}
              />
            ))}
          </div>
        </div>
      )}

      {/* ────────────────── ACTIVE PARTNER RESTAURANTS ────────────────── */}
      <div id="explore" className="space-y-6 pt-6 min-w-0 text-left">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
              {isCustomer ? 'Active Partner Restaurants' : 'Active Marketplace Restaurants'}
            </h2>
            <p className="text-slate-400 text-xs mt-1">
              Swipe or use arrows to browse — tap a card to open its mobile food menu portal
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => scrollCards('left')}
              aria-label="Scroll restaurants left"
              className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-600 hover:text-slate-900 transition shadow-sm"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => scrollCards('right')}
              aria-label="Scroll restaurants right"
              className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-600 hover:text-slate-900 transition shadow-sm"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Restaurants Grid / Scroll list */}
        {isCustomer ? (
          /* Premium grid for logged-in diners */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {restaurants.map((rest) => (
              <PlaceCard
                key={rest.id}
                images={[resolveImageUrl(rest.banner)]}
                logo={resolveImageUrl(rest.logo)}
                tagline={rest.tagline || 'Exquisite Indian Curries & takeaways.'}
                tags={[`${rest.timings?.open || '09:00'} - ${rest.timings?.close || '22:00'}`]}
                rating={rest.rating}
                title={rest.name}
                address={rest.address || rest.contact?.address || 'Hyderabad, India'}
                onClick={() => {
                  setSelectedRestaurantSlug(rest.slug);
                  setCurrentView('customer');
                  setActiveTableNo('');
                }}
              />
            ))}
          </div>
        ) : (
          /* Slider layout for marketing visitors */
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
                <div key={rest.id} className="flex-shrink-0 w-[300px] md:w-[360px] snap-start p-2">
                  <PlaceCard
                    images={[resolveImageUrl(rest.banner)]}
                    logo={resolveImageUrl(rest.logo)}
                    tagline={rest.tagline || 'Exquisite Indian Curries & takeaways.'}
                    tags={[`${rest.timings?.open || '09:00'} - ${rest.timings?.close || '22:00'}`]}
                    rating={rest.rating}
                    title={rest.name}
                    address={rest.address || rest.contact?.address || 'Hyderabad, India'}
                    onClick={(e) => {
                      if (dragMoved) {
                        if (e) {
                          e.preventDefault();
                          e.stopPropagation();
                        }
                        return;
                      }
                      setSelectedRestaurantSlug(rest.slug);
                      setCurrentView('customer');
                      setActiveTableNo('');
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ─── RESTAURANT CONFLICT WARNING MODAL ─── */}
      <AnimatePresence>
        {showConflictModal && (
          <>
            <div 
              className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm z-50 transition-opacity"
              onClick={() => setShowConflictModal(false)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="fixed inset-0 m-auto max-w-sm h-fit bg-white border border-slate-200 rounded-[32px] p-6 shadow-2xl z-50 text-left space-y-4"
            >
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                <Store className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-extrabold text-slate-900 leading-snug">
                  Replace cart items?
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Your cart contains dishes from another restaurant. Do you want to clear your cart and start a new order from <span className="font-extrabold text-slate-800">{conflictDish?.restaurant?.name || 'this restaurant'}</span> instead?
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowConflictModal(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-extrabold py-2.5 rounded-2xl transition focus:outline-none"
                >
                  Cancel
                </button>
                <button
                  onClick={handleClearCartAndAdd}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white text-xs font-extrabold py-2.5 rounded-2xl transition shadow-md shadow-red-500/20 focus:outline-none"
                >
                  Replace
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ─── FLOATING BOTTOM CART PILL ─── */}
      <AnimatePresence>
        {isCustomer && cart.length > 0 && !showCheckoutDrawer && (
          <motion.div 
            initial={{ y: 80, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 80, opacity: 0, scale: 0.9 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-red-500 hover:bg-red-600 text-white px-5 py-3 rounded-full shadow-2xl flex items-center justify-between gap-6 z-40 max-w-md w-[85%] sm:w-[420px] transition-colors cursor-pointer"
            onClick={() => setShowCheckoutDrawer(true)}
          >
            <div className="text-left flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center shadow-sm">
                <ShoppingBag className="w-4.5 h-4.5 text-white" />
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded truncate block max-w-[120px]">
                  {currentCartRestaurant?.name || 'Order'}
                </span>
                {(currentCartRestaurant?.address || currentCartRestaurant?.contact?.address) && (
                  <div className="text-[8px] font-bold opacity-80 truncate max-w-[140px] flex items-center gap-0.5">
                    <MapPin className="w-2 h-2 shrink-0" />
                    {currentCartRestaurant?.address || currentCartRestaurant?.contact?.address}
                  </div>
                )}
                <div className="text-xs font-black">
                  {cart.reduce((sum, i) => sum + i.quantity, 0)} Items • ₹{cartTotal}
                </div>
              </div>
            </div>
            <span className="bg-white text-red-500 font-extrabold text-[11px] px-4 py-2 rounded-full transition flex items-center gap-1 shrink-0 select-none shadow-sm hover:scale-[1.02] active:scale-98">
              View Cart <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── SLIDE-OUT CHECKOUT SIDEBAR DRAWER ─── */}
      <AnimatePresence>
        {showCheckoutDrawer && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm z-40 transition-opacity"
              onClick={() => setShowCheckoutDrawer(false)}
            />
            
            {/* Drawer Panel */}
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed top-0 right-0 bottom-0 w-full sm:w-[480px] bg-slate-50 border-l border-slate-200 shadow-2xl z-50 flex flex-col justify-between"
            >
              {/* Drawer Header */}
              <div className="bg-white border-b border-slate-200/60 p-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowCheckoutDrawer(false)}
                    className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200/50 text-slate-500 hover:text-slate-900 transition focus:outline-none"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="text-left">
                    <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider block">
                      Your Pre-Order Cart
                    </h2>
                    <span className="text-[10px] font-bold text-slate-400 block mt-0.5">
                      from {currentCartRestaurant?.name || 'Partner Outlet'}
                    </span>
                    {(currentCartRestaurant?.address || currentCartRestaurant?.contact?.address) && (
                      <span className="text-[9px] font-semibold text-slate-400 flex items-center gap-0.5 mt-0.5">
                        <MapPin className="w-2.5 h-2.5 text-emerald-500 shrink-0" />
                        Pickup: {currentCartRestaurant?.address || currentCartRestaurant?.contact?.address}
                      </span>
                    )}
                  </div>
                </div>
                
                {cart.length > 0 && (
                  <button
                    onClick={() => setCart([])}
                    className="text-[10px] text-red-500 hover:text-red-600 font-extrabold flex items-center gap-1 bg-red-50 hover:bg-red-100/80 px-2.5 py-1.5 rounded-xl transition focus:outline-none"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Clear Cart
                  </button>
                )}
              </div>

              {/* Drawer Body (Scroll list) */}
              <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin">
                
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-[50vh] text-slate-400 gap-3">
                    <ShoppingBag className="w-12 h-12 text-slate-300" />
                    <p className="text-xs font-bold text-slate-500">Your cart is currently empty.</p>
                    <button 
                      onClick={() => setShowCheckoutDrawer(false)}
                      className="bg-red-500 text-white font-extrabold text-xs px-4 py-2 rounded-xl"
                    >
                      Browse dishes
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Order Items List */}
                    <div className="space-y-3">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1 text-left">Items Selected</span>
                      <div className="bg-white border border-slate-200/60 rounded-3xl p-3 space-y-3 shadow-sm">
                        {cart.map((item) => {
                          const finalPrice = item.discountPrice || item.price;
                          return (
                            <div key={item.id} className="flex justify-between items-center gap-4 py-1 border-b border-slate-100 last:border-none">
                              <div className="text-left flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <div className={`w-2 h-2 rounded-full shrink-0 ${item.foodType === 'non-veg' ? 'bg-red-600' : 'bg-green-600'}`} />
                                  <span className="text-xs font-extrabold text-slate-800 block truncate">{item.name}</span>
                                </div>
                                <span className="text-[10px] text-slate-400 font-bold block mt-0.5">₹{finalPrice} each</span>
                              </div>
                              
                              {/* Add/Remove buttons */}
                              <div className="flex items-center bg-slate-100 border border-slate-200/50 rounded-xl py-0.5 px-1">
                                <button 
                                  onClick={() => handleDecreaseQuantity(item.id)}
                                  className="text-slate-500 hover:text-slate-900 text-[11px] font-extrabold px-2"
                                >
                                  −
                                </button>
                                <span className="text-slate-800 text-xs font-black px-1 select-none">{item.quantity}</span>
                                <button 
                                  onClick={() => handleAddToCart(item)}
                                  className="text-slate-500 hover:text-slate-900 text-[11px] font-extrabold px-2"
                                >
                                  +
                                </button>
                              </div>
                              
                              <span className="text-xs font-extrabold text-slate-800 shrink-0 w-12 text-right">
                                ₹{finalPrice * item.quantity}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Order Type Selectors */}
                    <div className="space-y-3 text-left">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Pre-Order Option</span>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => setLocalOrderType('scheduled')}
                          className={`flex flex-col items-center gap-2 p-3 border rounded-2xl transition text-left focus:outline-none cursor-pointer ${
                            localOrderType === 'scheduled'
                              ? 'bg-amber-500/10 border-amber-500 text-amber-600'
                              : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-500'
                          }`}
                        >
                          <Clock className="w-4 h-4 shrink-0 animate-pulse" />
                          <span className="text-[10px] font-black uppercase tracking-wider">Scheduled Pickup</span>
                        </button>
                        <button
                          onClick={() => setLocalOrderType('route')}
                          className={`flex flex-col items-center gap-2 p-3 border rounded-2xl transition text-left focus:outline-none cursor-pointer ${
                            localOrderType === 'route'
                              ? 'bg-rose-500/10 border-rose-500 text-rose-600'
                              : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-500'
                          }`}
                        >
                          <Navigation className="w-4 h-4 shrink-0 rotate-45" />
                          <span className="text-[10px] font-black uppercase tracking-wider">Route Pre-order</span>
                        </button>
                      </div>
                    </div>

                    {/* Scheduling / Route Details Form */}
                    <div className="space-y-4 bg-white border border-slate-200/60 rounded-3xl p-4 shadow-sm text-left">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Pre-Order Details</span>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Your Full Name</label>
                          <input
                            type="text"
                            value={localCustomerName}
                            onChange={(e) => setLocalCustomerName(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:border-red-500"
                            placeholder="Enter full name"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Contact Phone</label>
                          <input
                            type="tel"
                            value={localCustomerPhone}
                            onChange={(e) => setLocalCustomerPhone(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:border-red-500"
                            placeholder="e.g. +91 99887 76655"
                          />
                        </div>
                        
                        {localOrderType === 'scheduled' ? (
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Pickup Date</label>
                              <input
                                type="date"
                                value={localPickupDate}
                                onChange={(e) => setLocalPickupDate(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:border-red-500"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Pickup Time</label>
                              <input
                                type="time"
                                value={localPickupTime}
                                onChange={(e) => setLocalPickupTime(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:border-red-500"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Route From</label>
                                <input
                                  type="text"
                                  value={routeFrom}
                                  onChange={(e) => setRouteFrom(e.target.value)}
                                  placeholder="e.g. Hyderabad"
                                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:border-red-500"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Route To</label>
                                <input
                                  type="text"
                                  value={routeTo}
                                  onChange={(e) => setRouteTo(e.target.value)}
                                  placeholder="e.g. Vijayawada"
                                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:border-red-500"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Estimated Arrival (ETA)</label>
                              <input
                                type="text"
                                value={routeETA}
                                onChange={(e) => setRouteETA(e.target.value)}
                                placeholder="e.g. 2 hours / 18:30"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:border-red-500"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bill Details */}
                    <div className="bg-white border border-slate-200/60 rounded-3xl p-4 shadow-sm text-left space-y-3">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Bill details</span>
                      <div className="space-y-2 text-xs font-bold text-slate-600">
                        <div className="flex justify-between">
                          <span>Subtotal</span>
                          <span className="text-slate-800 font-extrabold">₹{cartSubtotal}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>GST ({typeof currentCartRestaurant?.settings?.gstPercentage === 'number' ? currentCartRestaurant.settings.gstPercentage : 5}%)</span>
                          <span className="text-slate-800 font-extrabold">₹{cartGst}</span>
                        </div>
                        <div className="border-t border-slate-100 pt-2 flex justify-between text-sm font-black text-slate-800">
                          <span>Grand Total</span>
                          <span className="text-red-500 font-black text-base">₹{cartTotal}</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Drawer Footer */}
              {cart.length > 0 && (
                <div className="bg-white border-t border-slate-200 p-4 space-y-3 shadow-2xl">
                  {paymentError && (
                    <div className="bg-red-55 border border-red-200 text-red-500 text-xs font-extrabold px-3.5 py-2 rounded-xl text-left flex items-start gap-2 shadow-sm animate-pulse">
                      <X className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>{paymentError}</span>
                    </div>
                  )}
                  <button
                    onClick={handlePaymentCheckoutSubmit}
                    disabled={paymentProcessing}
                    className="w-full bg-red-500 hover:bg-red-600 text-white font-extrabold text-xs py-3 rounded-2xl transition shadow-lg shadow-red-500/25 flex items-center justify-center gap-2 focus:outline-none disabled:bg-red-400 cursor-pointer"
                  >
                    {paymentProcessing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                        Initializing Standard Checkout...
                      </>
                    ) : (
                      <>
                        Place Pre-Order via Razorpay • ₹{cartTotal}
                      </>
                    )}
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ─── SIMULATED SANDBOX PAYMENTS MODAL ─── */}
      <AnimatePresence>
        {showPaymentModal && (
          <>
            <div 
              className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm z-50 transition-opacity"
              onClick={() => setShowPaymentModal(false)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="fixed inset-0 m-auto max-w-sm h-fit bg-slate-900 border border-white/10 rounded-[32px] p-6 shadow-2xl z-50 text-left space-y-5 text-white"
            >
              <div className="w-12 h-12 rounded-full bg-[#ccff00]/10 flex items-center justify-center text-[#ccff00]">
                <Compass className="w-6 h-6" />
              </div>
              
              <div className="space-y-1.5">
                <h3 className="text-base font-extrabold text-white leading-snug">
                  Simulated Sandbox Gateway
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {gatewayFallbackNote || "Platform running in demo test mode. Secure Razorpay split accounts are active. Select 'Authorize Split' to bypass mock gateway."}
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-extrabold py-2.5 rounded-2xl transition focus:outline-none border border-white/5 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={finalizeSimulatedOrder}
                  className="flex-1 bg-[#ccff00] hover:bg-[#bbf000] text-black text-xs font-extrabold py-2.5 rounded-2xl transition shadow-md shadow-[#ccff00]/25 focus:outline-none cursor-pointer"
                >
                  Authorize Split
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
