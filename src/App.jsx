import React, { useState, useEffect, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Loader from './pages/Loader';
import { Utensils, Sparkles, LogOut, LayoutDashboard, Crown, ChevronDown, ClipboardList, Navigation, Compass, Menu, X } from 'lucide-react';
import { apiRequest } from './utils/api';
import { getRedirectResult } from 'firebase/auth';
import { auth } from './firebase';

import LandingPage from './pages/Landing/LandingPage';
import CustomerMenu from './pages/Customer/CustomerMenu';
import AuthPage from './pages/Auth/AuthPage';
import RestaurantAdminPanel from './pages/RestaurantAdmin/RestaurantAdminPanel';
import SuperAdminPanel from './pages/SuperAdmin/SuperAdminPanel';
import QueueTvView from './pages/QueueTv/QueueTvView';
import AboutPage from './pages/Landing/AboutPage';
import ContactPage from './pages/Landing/ContactPage';
import PrivacyPolicyPage from './pages/Landing/PrivacyPolicyPage';
import TermsConditionsPage from './pages/Landing/TermsConditionsPage';
import RefundPolicyPage from './pages/Landing/RefundPolicyPage';
import ProductsPage from './pages/Landing/ProductsPage';
import SolutionsPage from './pages/Landing/SolutionsPage';
import ResourcesPage from './pages/Landing/ResourcesPage';
import OrderPage from './pages/Landing/OrderPage';
import CustomerOrders from './pages/Customer/CustomerOrders';
import CircularRevealHeading from './pages/Landing/CircularRevealHeading';
import slideImage1 from './pages/Landing/Untitled design (5).png';
import slideImage2 from './pages/Landing/chef_direct.jpeg';
import slideImage3 from './pages/Landing/Gemini_Generated_Image_2evpxz2evpxz2evp.png';
import slideImage4 from './pages/Landing/schedule_order_image.jpg';
import slideImage5 from './pages/Landing/map_route_image.png';

// Mock data removed. App operates exclusively on MongoDB backend.

// ── Seed users (will be merged with localStorage) ──────────────────────────
const SEED_USERS = [];

const PLATE_ITEMS = [
  { text: "QR Tables", image: slideImage1 },
  { text: "Chef Direct", image: slideImage2 },
  { text: "Easy Menu", image: slideImage3 },
  { text: "Schedule", image: slideImage4 },
  { text: "Route Order", image: slideImage5 },
];

const PLATE_CENTER_TEXT = (
  <div className="flex flex-col items-center justify-center text-center select-none pointer-events-none">
    <span className="text-[11px] font-black tracking-[0.2em] text-slate-800 uppercase">Orderin</span>
    <span className="text-[8px] font-bold text-red-500 uppercase tracking-widest mt-0.5">SaaS OS</span>
  </div>
);

export default function App() {

  // ── Persistent State ───────────────────────────────────────────────────
  // ── Persistent State ───────────────────────────────────────────────────
  // ── Persistent State ───────────────────────────────────────────────────
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [restaurants, setRestaurants] = useState([]);
  const [categories, setCategories] = useState([]);
  const [menus, setMenus] = useState([]);
  const [orders, setOrders] = useState([]);
  const [coupons, setCoupons] = useState([]);

  // Users — merge seed + any registered users saved in localStorage
  const [users, setUsers] = useState(() => {
    const saved = localStorage.getItem('Orderin_users');
    const stored = saved ? JSON.parse(saved) : [];
    // Merge seed users (never duplicate by email)
    const merged = [...SEED_USERS];
    stored.forEach(u => {
      if (!merged.find(s => s.email.toLowerCase() === u.email.toLowerCase())) {
        merged.push(u);
      }
    });
    return merged;
  });

  // Auth
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('Orderin_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  // ── Clean up stale localStorage keys & sync user state ──────────────────
  useEffect(() => {
    const staleKeys = [
      'Orderin_restaurants',
      'Orderin_categories',
      'Orderin_menus',
      'Orderin_orders',
      'Orderin_coupons'
    ];
    staleKeys.forEach(key => localStorage.removeItem(key));
  }, []);

  useEffect(() => {
    // Only store non-seed users
    const toStore = users.filter(u => !SEED_USERS.find(s => s.email === u.email));
    localStorage.setItem('Orderin_users', JSON.stringify(toStore));
  }, [users]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('Orderin_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('Orderin_current_user');
      setIsAdminPreview(false);
    }
  }, [currentUser]);

  // ── Handle Firebase Redirect Sign-In result ───────────────────────────
  useEffect(() => {
    const handleRedirectAuth = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result && result.user) {
          const user = result.user;
          const savedPhone = localStorage.getItem(`Orderin_phone_${user.uid}`) || '';
          const loggedInUser = {
            id: user.uid,
            email: user.email,
            role: 'customer',
            name: user.displayName || 'Guest Diner',
            photoURL: user.photoURL,
            phone: savedPhone
          };

          if (!savedPhone) {
            sessionStorage.setItem('Orderin_temp_customer', JSON.stringify(loggedInUser));
            setCurrentView('login');
          } else {
            localStorage.setItem('Orderin_customer_phone', savedPhone);
            setCurrentUser(loggedInUser);
            setCurrentView('landing');
          }
        }
      } catch (err) {
        console.error("Redirect auth error:", err);
      }
    };
    handleRedirectAuth();
  }, []);

  // ── Load approved restaurants from MongoDB on mount ───────────────────
  useEffect(() => {
    const loadPublicRestaurants = async () => {
      try {
        const res = await apiRequest('/restaurant/public/list');
        if (res.success && Array.isArray(res.restaurants)) {
          const formatted = res.restaurants.map(dbRest => ({
            id: dbRest._id,
            name: dbRest.name,
            slug: dbRest.slug,
            logo: dbRest.logo || 'https://img.icons8.com/fluency/196/hamburger.png',
            banner: dbRest.banner || 'https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=1200&auto=format&fit=crop',
            tagline: dbRest.tagline || '',
            theme: dbRest.theme || { primaryColor: '#bd3838', secondaryColor: '#0f172a', textColor: '#ffffff', styleType: 'glassmorphism' },
            timings: dbRest.timings || { open: '09:00', close: '22:00' },
            contact: dbRest.contact || { phone: '', email: '', address: '', socialLinks: {} },
            settings: dbRest.settings || { gstPercentage: 5, deliveryCharge: 0, minimumOrderAmount: 100 },
            tables: dbRest.tables || [{ tableNo: 'T1', qrCodeUrl: '' }],
            isApproved: dbRest.isApproved,
            isActive: dbRest.isActive,
            rating: dbRest.rating || 5.0,
            address: dbRest.address || '',
            bankDetails: dbRest.bankDetails || { bankName: '', accountHolderName: '', accountNumber: '', ifscCode: '' },
            fssaiNumber: dbRest.fssaiNumber || '',
            cashfree: dbRest.cashfree || { vendorStatus: 'NOT_CREATED', vendorId: null, commissionPercent: 10 },
            subscriptionPlan: dbRest.subscriptionPlan,
            subscriptionExpiry: dbRest.subscriptionExpiry,
            subscriptionActive: dbRest.subscriptionActive
          }));
          setRestaurants(formatted);
        }
      } catch (err) {
        console.warn("Could not load public restaurants from MongoDB:", err.message);
      }
    };
    loadPublicRestaurants();
  }, []);

  // ── Load Admin data from MongoDB ──────────────────────────────────────
  useEffect(() => {
    if (currentUser && currentUser.role === 'restaurant_admin') {
      const loadAdminData = async () => {
        try {
          // 1. Fetch restaurant profile
          const profileRes = await apiRequest('/restaurant/profile/me');
          if (!profileRes.success || !profileRes.restaurant) {
            console.warn("No restaurant profile found for this admin yet.");
            return;
          }
          
          const dbRest = profileRes.restaurant;
          const restId = dbRest._id;

          const formattedRest = {
            id: dbRest._id,
            name: dbRest.name,
            slug: dbRest.slug,
            logo: dbRest.logo || 'https://img.icons8.com/fluency/196/hamburger.png',
            banner: dbRest.banner || 'https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=1200&auto=format&fit=crop',
            tagline: dbRest.tagline || '',
            theme: dbRest.theme || { primaryColor: '#bd3838', secondaryColor: '#0f172a', textColor: '#ffffff', styleType: 'glassmorphism' },
            timings: dbRest.timings || { open: '09:00', close: '22:00' },
            contact: dbRest.contact || { phone: '', email: '', address: '', socialLinks: {} },
            settings: dbRest.settings || { gstPercentage: 5, deliveryCharge: 0, minimumOrderAmount: 100 },
            tables: dbRest.tables || [{ tableNo: 'T1', qrCodeUrl: '' }],
            isApproved: dbRest.isApproved,
            isActive: dbRest.isActive,
            rating: dbRest.rating || 5.0,
            address: dbRest.address || '',
            bankDetails: dbRest.bankDetails || { bankName: '', accountHolderName: '', accountNumber: '', ifscCode: '' },
            fssaiNumber: dbRest.fssaiNumber || '',
            cashfree: dbRest.cashfree || { vendorStatus: 'NOT_CREATED', vendorId: null, commissionPercent: 10 },
            subscriptionPlan: dbRest.subscriptionPlan,
            subscriptionExpiry: dbRest.subscriptionExpiry,
            subscriptionActive: dbRest.subscriptionActive
          };

          // Sync restaurants array with this profile
          setRestaurants(prev => {
            const filtered = prev.filter(r => r.id !== restId && r.slug !== formattedRest.slug);
            return [...filtered, formattedRest];
          });

          // Ensure currentUser has the restaurantId populated and synchronized
          if (currentUser && (!currentUser.restaurantId || currentUser.restaurantId !== restId)) {
            setCurrentUser(prev => {
              const updated = { ...prev, restaurantId: restId };
              localStorage.setItem('Orderin_current_user', JSON.stringify(updated));
              return updated;
            });
          }

          // 2. Fetch categories & menus
          const catRes = await apiRequest(`/restaurant/public/${formattedRest.slug}`);
          if (catRes.success) {
            if (catRes.categories) {
              const formattedCats = catRes.categories.map(c => ({
                id: c._id,
                name: c.name,
                image: c.image || '',
                restaurantId: restId
              }));
              setCategories(prev => {
                const filtered = prev.filter(c => c.restaurantId !== restId);
                return [...filtered, ...formattedCats];
              });
            }
            
            if (catRes.menus) {
              const formattedMenus = catRes.menus.map(m => ({
                id: m._id,
                restaurantId: restId,
                categoryId: m.category?._id || m.category || '',
                name: m.name,
                description: m.description || '',
                price: m.price,
                discountPrice: m.discountPrice || null,
                image: m.image || '',
                foodType: m.foodType || 'veg',
                tags: m.tags || { isSpicy: false, isBestseller: false, isTodaySpecial: false },
                inStock: m.inStock !== undefined ? m.inStock : true,
                addons: m.addons || []
              }));
              setMenus(prev => {
                const filtered = prev.filter(m => m.restaurantId !== restId);
                return [...filtered, ...formattedMenus];
              });
            }
          }
          
          // 3. Fetch orders
          try {
            const ordRes = await apiRequest('/orders/restaurant/all');
            if (ordRes.success && Array.isArray(ordRes.orders)) {
              const formattedOrders = ordRes.orders.map(o => ({
                id: o._id,
                restaurantId: restId,
                customerName: o.customerName || 'Guest Customer',
                customerPhone: o.customerPhone || '+91 99887 76655',
                items: o.items.map(item => {
                  const resolvedMenu = catRes.menus?.find(m => m._id === item.menuItem) || { name: 'Item', price: item.price || 100 };
                  return {
                    id: item.menuItem,
                    name: resolvedMenu.name || 'Item',
                    price: item.price || resolvedMenu.price || 100,
                    quantity: item.quantity,
                    selectedAddons: item.selectedAddons || []
                  };
                }),
                tableNo: o.tableNo || 'T1',
                subTotal: o.subTotal,
                gstAmount: o.gstAmount,
                deliveryCharge: o.deliveryCharge,
                totalAmount: o.totalAmount,
                paymentMethod: o.paymentMethod,
                paymentStatus: o.paymentStatus,
                orderStatus: o.orderStatus,
                createdAt: o.createdAt,
                orderType: o.orderType || 'table',
                pickupTime: o.pickupTime || '',
                pickupCode: o.pickupCode || '',
                preparationStatus: o.preparationStatus || 'Pending',
                routeFrom: o.routeFrom || '',
                routeTo: o.routeTo || '',
                routeETA: o.routeETA || ''
              }));
              setOrders(prev => {
                const filtered = prev.filter(o => o.restaurantId !== restId);
                return [...filtered, ...formattedOrders];
              });
            }
          } catch (ordErr) {
            console.warn("Could not load restaurant orders from MongoDB:", ordErr.message);
          }
          
        } catch (err) {
          console.warn("Could not load admin profile data from MongoDB:", err.message);
        }
      };
      
      loadAdminData();
    }
  }, [currentUser]);

  // ── Routing & Session Isolation ───────────────────────────────────────
  const [currentView, setCurrentView] = useState(() => {
    // If initial URL is a restaurant path, load customer view immediately to prevent dashboard flashing
    const path = window.location.pathname;
    const params = new URLSearchParams(window.location.search);
    
    if (path.startsWith('/queue/')) {
      return 'queue_tv';
    }
    
    let slug = '';
    if (path.startsWith('/restaurant/')) slug = path.split('/restaurant/')[1]?.split('?')[0]?.trim();
    if (!slug) slug = params.get('restaurant') || params.get('slug') || '';
    if (slug) {
      return 'customer';
    }

    // Otherwise, fallback to logged-in user routing
    const saved = localStorage.getItem('Orderin_current_user');
    if (saved) {
      const u = JSON.parse(saved);
      if (u.role === 'super_admin') return 'super_admin';
      if (u.role === 'restaurant_admin') return 'restaurant_admin';
    }
    return 'landing';
  });

  const [selectedRestaurantSlug, setSelectedRestaurantSlug] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileProfileOpen, setMobileProfileOpen] = useState(false);
  const [orderFlow, setOrderFlow] = useState(null);
  
  // Track whether this is an admin preview or a direct QR scan customer session.
  const [isAdminPreview, setIsAdminPreview] = useState(() => {
    return sessionStorage.getItem('Orderin_is_admin_preview') === 'true';
  });

  // Keep customer table session tab-isolated via sessionStorage
  const [activeTableNo, setActiveTableNo] = useState(() => {
    return sessionStorage.getItem('Orderin_active_table') || '';
  });
  
  const [language, setLanguage] = useState('English');

  // Customer state: Keep cart, checkout state, and order tracking isolated to each browser tab session
  const [cart, setCart] = useState(() => {
    const saved = sessionStorage.getItem('Orderin_cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [activeCoupon, setActiveCoupon] = useState(null);
  const [checkoutStep, setCheckoutStep] = useState(() => {
    return sessionStorage.getItem('Orderin_checkout_step') || null;
  });
  const [selectedCategoryTab, setSelectedCategoryTab] = useState('All');
  const [foodTypeFilter, setFoodTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFoodPreview, setSelectedFoodPreview] = useState(null);
  const [liveOrderTrackingId, setLiveOrderTrackingId] = useState(() => {
    return sessionStorage.getItem('Orderin_live_order_tracking_id') || null;
  });
  
  const [favorites, setFavorites] = useState([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  // ── Scroll to Top on View Change ─────────────────────────────────────
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    setMobileMenuOpen(false);
  }, [currentView]);

  // ── Sync Customer Session States to sessionStorage ────────────────────
  useEffect(() => {
    sessionStorage.setItem('Orderin_is_admin_preview', isAdminPreview ? 'true' : 'false');
  }, [isAdminPreview]);

  useEffect(() => {
    sessionStorage.setItem('Orderin_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    if (activeTableNo) sessionStorage.setItem('Orderin_active_table', activeTableNo);
    else sessionStorage.removeItem('Orderin_active_table');
  }, [activeTableNo]);

  useEffect(() => {
    if (checkoutStep) sessionStorage.setItem('Orderin_checkout_step', checkoutStep);
    else sessionStorage.removeItem('Orderin_checkout_step');
  }, [checkoutStep]);

  useEffect(() => {
    if (liveOrderTrackingId) sessionStorage.setItem('Orderin_live_order_tracking_id', liveOrderTrackingId);
    else sessionStorage.removeItem('Orderin_live_order_tracking_id');
  }, [liveOrderTrackingId]);

  // ── Initial URL Slug & Table QR Parser ────────────────────────────────
  useEffect(() => {
    const path = window.location.pathname;
    const params = new URLSearchParams(window.location.search);
    let slug = '';
    let table = params.get('table') || '';
    
    if (path.startsWith('/queue/')) {
      slug = path.split('/queue/')[1]?.split('?')[0]?.trim();
      if (slug) {
        setSelectedRestaurantSlug(slug);
        setCurrentView('queue_tv');
        return;
      }
    }
    
    if (path.startsWith('/restaurant/')) slug = path.split('/restaurant/')[1]?.split('?')[0]?.trim();
    if (!slug) slug = params.get('restaurant') || params.get('slug') || '';
    
    if (slug) {
      setSelectedRestaurantSlug(slug);
      setCurrentView('customer');
      if (table) {
        setActiveTableNo(table);
        setIsAdminPreview(false);
      }
    }
  }, []);

  // ── Unified MongoDB Restaurant Menu Fetcher (Slug-based Router) ──────
  useEffect(() => {
    if (!selectedRestaurantSlug) return;

    const fetchStoreData = async () => {
      try {
        const res = await apiRequest(`/restaurant/public/${selectedRestaurantSlug}`);
        if (res.success && res.restaurant) {
          const dbRest = res.restaurant;
          
          const formattedRest = {
            id: dbRest._id,
            name: dbRest.name,
            slug: dbRest.slug,
            logo: dbRest.logo || 'https://img.icons8.com/fluency/196/hamburger.png',
            banner: dbRest.banner || 'https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=1200&auto=format&fit=crop',
            tagline: dbRest.tagline || '',
            theme: dbRest.theme || { primaryColor: '#bd3838', secondaryColor: '#0f172a', textColor: '#ffffff', styleType: 'glassmorphism' },
            timings: dbRest.timings || { open: '09:00', close: '22:00' },
            contact: dbRest.contact || { phone: '', email: '', address: '', socialLinks: {} },
            settings: dbRest.settings || { gstPercentage: 5, deliveryCharge: 0, minimumOrderAmount: 100 },
            tables: dbRest.tables || [{ tableNo: 'T1', qrCodeUrl: '' }],
            isApproved: dbRest.isApproved,
            isActive: dbRest.isActive,
            rating: dbRest.rating || 5.0,
            address: dbRest.address || '',
            bankDetails: dbRest.bankDetails || { bankName: '', accountHolderName: '', accountNumber: '', ifscCode: '' },
            fssaiNumber: dbRest.fssaiNumber || '',
            cashfree: dbRest.cashfree || { vendorStatus: 'NOT_CREATED', vendorId: null, commissionPercent: 10 },
            subscriptionPlan: dbRest.subscriptionPlan,
            subscriptionExpiry: dbRest.subscriptionExpiry,
            subscriptionActive: dbRest.subscriptionActive
          };

          // Sync restaurants array
          setRestaurants(prev => {
            const filtered = prev.filter(r => r.id !== dbRest._id && r.slug.toLowerCase() !== selectedRestaurantSlug.toLowerCase());
            return [...filtered, formattedRest];
          });

          // Sync categories
          if (res.categories && Array.isArray(res.categories)) {
            const formattedCats = res.categories.map(c => ({
              id: c._id,
              name: c.name,
              image: c.image || '',
              restaurantId: dbRest._id,
            }));
            setCategories(prev => {
              const filtered = prev.filter(c => c.restaurantId !== dbRest._id);
              return [...filtered, ...formattedCats];
            });
          }

          // Sync menus
          if (res.menus && Array.isArray(res.menus)) {
            const formattedMenus = res.menus.map(m => ({
              id: m._id,
              restaurantId: dbRest._id,
              categoryId: m.category?._id || m.category || '',
              name: m.name,
              description: m.description || '',
              price: m.price,
              discountPrice: m.discountPrice || null,
              image: m.image || '',
              foodType: m.foodType || 'veg',
              tags: m.tags || { isSpicy: false, isBestseller: false, isTodaySpecial: false },
              inStock: m.inStock !== undefined ? m.inStock : true,
              addons: m.addons || []
            }));
            setMenus(prev => {
              const filtered = prev.filter(m => m.restaurantId !== dbRest._id);
              return [...filtered, ...formattedMenus];
            });
          }

          // Sync coupons
          if (res.coupons && Array.isArray(res.coupons)) {
            const formattedCoupons = res.coupons.map(cop => ({
              code: cop.code,
              discountType: cop.discountType,
              discountValue: cop.discountValue,
              minOrderAmount: cop.minOrderAmount,
              maxDiscountAmount: cop.maxDiscountAmount,
              description: cop.discountType === 'flat' 
                ? `Flat ₹${cop.discountValue} Off on orders above ₹${cop.minOrderAmount}`
                : `${cop.discountValue}% Off on orders above ₹${cop.minOrderAmount}`,
              restaurantId: dbRest._id
            }));
            setCoupons(formattedCoupons);
          }
        }
      } catch (err) {
        console.warn("Could not dynamically load live store menu from MongoDB:", err.message);
      }
    };

    fetchStoreData();
  }, [selectedRestaurantSlug]);

  // ── Derived data ──────────────────────────────────────────────────────
  const currentRestaurant = useMemo(() => {
    if (!selectedRestaurantSlug) return null;
    return restaurants.find(r => r.slug.toLowerCase() === selectedRestaurantSlug.toLowerCase()) || null;
  }, [restaurants, selectedRestaurantSlug]);

  // Restaurant admin's restaurant
  const adminRestaurant = useMemo(() => {
    if (!currentUser || currentUser.role !== 'restaurant_admin') return null;
    return restaurants.find(r => r.id === currentUser.restaurantId) || null;
  }, [currentUser, restaurants]);

  // ── Logout ────────────────────────────────────────────────────────────
  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView('landing');
    setIsAdminPreview(false);
    localStorage.removeItem('Orderin_current_user');
    localStorage.removeItem('Orderin_customer_phone');
    sessionStorage.removeItem('Orderin_is_admin_preview');
    sessionStorage.removeItem('Orderin_cart');
    sessionStorage.removeItem('Orderin_active_table');
    sessionStorage.removeItem('Orderin_checkout_step');
    sessionStorage.removeItem('Orderin_live_order_tracking_id');
  };

  // ── Translation helper ────────────────────────────────────────────────
  const t = (key) => {
    const translations = {
      English: { searchFood: 'Search delicious dishes...', addToCart: 'Add to Cart', checkout: 'Secure Checkout', veg: 'Veg', nonVeg: 'Non-Veg', vegan: 'Vegan', spicy: 'Spicy', bestseller: 'Bestseller', special: "Today's Special", items: 'items', placeOrder: 'Place Order via Razorpay', liveTracking: 'Live Order Tracking', explore: 'Explore Restaurants', scanTable: 'Table Dine-in Menu', gst: 'GST', delivery: 'Delivery Charge', subtotal: 'Subtotal', total: 'Grand Total' },
      Hindi: { searchFood: 'स्वादिष्ट व्यंजन खोजें...', addToCart: 'कार्ट में जोड़ें', checkout: 'सुरक्षित चेकआउट', veg: 'शाकाहारी', nonVeg: 'मांसाहारी', vegan: 'वेगन', spicy: 'तीखा', bestseller: 'सबसे लोकप्रिय', special: 'आज की विशेषता', items: 'आइटम', placeOrder: 'ऑर्डर सबमिट करें', liveTracking: 'लाइव ऑर्डर ट्रैकिंग', explore: 'रेस्तरां देखें', scanTable: 'टेबल डाइन-इन मेनू', gst: 'जीएसटी', delivery: 'वितरण शुल्क', subtotal: 'उपयोग', total: 'कुल योग' },
    };
    return translations[language]?.[key] || key;
  };

  const isAdminView = currentView === 'restaurant_admin' || currentView === 'super_admin';
  const isCustomerView = currentView === 'customer' || currentView === 'queue_tv';
  const showHeader = !isCustomerView;

  return (
    <div className={`min-h-screen ${isCustomerView ? 'bg-slate-950' : 'bg-slate-50'} text-slate-900`}>

      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      {showHeader && (
        <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 py-3 px-6 sticky top-0 z-40 shadow-sm">
          <div className="max-w-7xl mx-auto flex justify-between items-center">

            {/* Logo */}
            <div
              onClick={() => { if (!currentUser || currentUser.role === 'customer') { setCurrentView('landing'); setCheckoutStep(null); } }}
              className={`flex items-center ${(!currentUser || currentUser.role === 'customer') ? 'cursor-pointer' : 'cursor-default'} group`}
            >
              <img src="/order_logo.png" className="h-12 w-auto object-contain group-hover:scale-105 transition-all" alt="Orderin" />
            </div>

            {/* Public navigation links inside a premium capsule pill */}
            {!currentUser && (
              <nav className="hidden md:flex items-center bg-slate-50/90 border border-slate-200/60 p-1.5 rounded-full shadow-sm backdrop-blur-md transition-all duration-300">
                <button
                  onClick={() => { setCurrentView('products'); }}
                  className={`px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-300 ${
                    currentView === 'products' 
                      ? 'bg-slate-900 text-white shadow-sm scale-105' 
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                >
                  Products
                </button>
                <button
                  onClick={() => { setCurrentView('solutions'); }}
                  className={`px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-300 ${
                    currentView === 'solutions' 
                      ? 'bg-slate-900 text-white shadow-sm scale-105' 
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                >
                  Solutions
                </button>
                <button
                  onClick={() => { setCurrentView('resources'); }}
                  className={`px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-300 ${
                    currentView === 'resources' 
                      ? 'bg-slate-900 text-white shadow-sm scale-105' 
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                >
                  Why Us
                </button>
                <button
                  onClick={() => { setCurrentView('order'); }}
                  className={`px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-300 ${
                    currentView === 'order' 
                      ? 'bg-slate-900 text-white shadow-sm scale-105' 
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                >
                  Order
                </button>
                <button
                  onClick={() => { setCurrentView('contact'); }}
                  className={`px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-300 ${
                    currentView === 'contact' 
                      ? 'bg-slate-900 text-white shadow-sm scale-105' 
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                >
                  Contact us
                </button>
              </nav>
            )}

            {/* Customer / Diner navigation links */}
            {currentUser && currentUser.role === 'customer' && (
              <nav className="hidden md:flex items-center bg-slate-50/90 border border-slate-200/60 p-1.5 rounded-full shadow-sm backdrop-blur-md transition-all duration-300">
                <button
                  onClick={() => { setCurrentView('landing'); }}
                  className={`px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-300 ${
                    currentView === 'landing' 
                      ? 'bg-slate-900 text-white shadow-sm scale-105' 
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                >
                  Explore Restaurants
                </button>
                <button
                  onClick={() => { setCurrentView('order'); }}
                  className={`px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-300 ${
                    currentView === 'order' 
                      ? 'bg-slate-900 text-white shadow-sm scale-105' 
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                >
                  Route & Schedule Order
                </button>
                <button
                  onClick={() => { setCurrentView('customer_orders'); }}
                  className={`px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-300 ${
                    currentView === 'customer_orders' 
                      ? 'bg-slate-900 text-white shadow-sm scale-105' 
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                >
                  My Orders & Pickup Codes
                </button>
              </nav>
            )}

            {/* Right controls */}
            <div className="flex items-center gap-3">



              {/* Logged-in user bar */}
              {currentUser ? (
                <div className="flex items-center gap-3">
                  {/* Role badge with Dropdown */}
                  <div className="relative hidden md:block">
                    <button
                      onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                      className={`flex items-center justify-center transition-all duration-300 hover:scale-[1.05] cursor-pointer ${
                        profileDropdownOpen 
                          ? 'w-10 h-10 rounded-full p-0' 
                          : 'gap-2 px-3 py-1.5 rounded-full'
                      } text-xs font-bold ${
                        currentUser.role === 'super_admin' 
                          ? 'bg-purple-500/10 text-purple-600 border border-purple-200 hover:bg-purple-500/20' 
                          : currentUser.role === 'customer'
                          ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-200 hover:bg-emerald-500/20'
                          : 'bg-red-500/10 text-red-600 border border-red-200 hover:bg-red-500/20'
                      }`}
                    >
                      {currentUser.role === 'customer' && currentUser.photoURL ? (
                        <div className="w-7 h-7 rounded-full border-2 border-emerald-400/80 flex items-center justify-center p-[2px] bg-white shadow-inner transition-transform duration-300 hover:rotate-12">
                          <img src={currentUser.photoURL} className="w-full h-full rounded-full object-cover" alt="" />
                        </div>
                      ) : currentUser.role === 'super_admin' ? (
                        <div className="w-7 h-7 rounded-full border-2 border-purple-400/80 flex items-center justify-center bg-white shadow-inner">
                          <Crown className="w-3.5 h-3.5 text-purple-500" />
                        </div>
                      ) : (
                        <div className="w-7 h-7 rounded-full border-2 border-red-400/80 flex items-center justify-center bg-white shadow-inner">
                          <LayoutDashboard className="w-3.5 h-3.5 text-red-500" />
                        </div>
                      )}
                      {!profileDropdownOpen && (
                        <>
                          <span className="hidden sm:block transition-all duration-300">{currentUser.name}</span>
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400 transition-transform duration-300" />
                        </>
                      )}
                    </button>

                    <AnimatePresence>
                      {profileDropdownOpen && (
                        <>
                          {/* Invisible backdrop to close dropdown on outer click */}
                          <div 
                            className="fixed inset-0 z-40" 
                            onClick={() => setProfileDropdownOpen(false)}
                          />
                          
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute right-0 mt-2.5 w-56 bg-white border border-slate-200/80 rounded-2xl shadow-xl z-50 p-2 space-y-1 text-left"
                          >
                            <div className="px-3.5 py-2.5 border-b border-slate-100 mb-1 space-y-0.5">
                              <span className="text-xs font-black text-slate-800 block truncate">{currentUser.name}</span>
                              <span className="text-[10px] text-slate-400 block truncate">{currentUser.email}</span>
                            </div>

                            {currentUser.role === 'customer' ? (
                              <>
                                <button
                                  onClick={() => {
                                    setCurrentView('customer_orders');
                                    setProfileDropdownOpen(false);
                                  }}
                                  className="w-full text-left px-3.5 py-2 hover:bg-slate-50 text-slate-600 hover:text-slate-900 rounded-xl text-xs font-bold transition flex items-center gap-2 group cursor-pointer"
                                >
                                  <ClipboardList className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-800 transition-colors" />
                                  <span>History Orders</span>
                                </button>
                                <button
                                  onClick={() => {
                                    setCurrentView('order');
                                    setProfileDropdownOpen(false);
                                  }}
                                  className="w-full text-left px-3.5 py-2 hover:bg-slate-50 text-slate-600 hover:text-slate-900 rounded-xl text-xs font-bold transition flex items-center gap-2 group cursor-pointer"
                                >
                                  <Navigation className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-800 transition-colors" />
                                  <span>Route Pre-Orders</span>
                                </button>
                                <button
                                  onClick={() => {
                                    setCurrentView('landing');
                                    setProfileDropdownOpen(false);
                                  }}
                                  className="w-full text-left px-3.5 py-2 hover:bg-slate-50 text-slate-600 hover:text-slate-900 rounded-xl text-xs font-bold transition flex items-center gap-2 group cursor-pointer"
                                >
                                  <Compass className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-800 transition-colors" />
                                  <span>Explore Food</span>
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => {
                                  setCurrentView(currentUser.role === 'super_admin' ? 'super_admin' : 'restaurant_admin');
                                  setProfileDropdownOpen(false);
                                }}
                                className="w-full text-left px-3.5 py-2 hover:bg-slate-50 text-slate-600 hover:text-slate-900 rounded-xl text-xs font-bold transition flex items-center gap-2 group cursor-pointer"
                              >
                                <LayoutDashboard className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-800 transition-colors" />
                                <span>Dashboard</span>
                              </button>
                            )}

                            <button
                              onClick={() => {
                                  handleLogout();
                                  setProfileDropdownOpen(false);
                              }}
                              className="w-full text-left px-3.5 py-2 hover:bg-red-50 text-red-500 rounded-xl text-xs font-bold transition flex items-center gap-2 border-t border-slate-100 mt-1 group cursor-pointer"
                            >
                              <LogOut className="w-3.5 h-3.5 text-red-400 group-hover:text-red-500 transition-colors" />
                              <span>Logout Account</span>
                            </button>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Browse store (for restaurant admins) */}
                  {currentUser.role === 'restaurant_admin' && adminRestaurant && (
                    <button
                      onClick={() => {
                        setSelectedRestaurantSlug(adminRestaurant.slug);
                        setCurrentView('customer');
                        setIsAdminPreview(true);
                      }}
                      className="bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer">
                      <Utensils className="w-3.5 h-3.5" />
                      View Store
                    </button>
                  )}
                </div>
              ) : (
                /* Order / Login button */
                <button
                  onClick={() => { setCurrentView('login'); }}
                  className="bg-red-500 hover:bg-red-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md transition hover:scale-[1.03] flex items-center gap-1.5">
                  <Utensils className="w-3.5 h-3.5" />
                  Start
                </button>
              )}

              {/* Mobile hamburger menu */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900 md:hidden transition cursor-pointer"
                aria-label="Toggle mobile menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile dropdown menu links with nice animation */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="md:hidden border-t border-slate-100 mt-3 pt-3 pb-2 flex flex-col gap-2 overflow-hidden"
              >
                {/* Mobile User Profile Dropdown Section */}
                {currentUser && (
                  <div className="border-b border-slate-100 pb-3 mb-2">
                    <button
                      onClick={() => setMobileProfileOpen(!mobileProfileOpen)}
                      className="w-full flex items-center justify-between p-3 bg-slate-50 border border-slate-200/60 rounded-xl hover:bg-slate-100 transition duration-200"
                    >
                      <div className="flex items-center gap-3">
                        {currentUser.role === 'customer' && currentUser.photoURL ? (
                          <div className="w-8 h-8 rounded-full border border-emerald-400 p-[1px] bg-white flex items-center justify-center">
                            <img src={currentUser.photoURL} className="w-full h-full rounded-full object-cover" alt="" />
                          </div>
                        ) : currentUser.role === 'super_admin' ? (
                          <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center border border-purple-200">
                            <Crown className="w-4 h-4 text-purple-500" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center border border-red-200">
                            <LayoutDashboard className="w-4 h-4 text-red-500" />
                          </div>
                        )}
                        <div className="text-left">
                          <span className="text-xs font-black text-slate-800 block truncate max-w-[150px]">{currentUser.name}</span>
                          <span className="text-[10px] text-slate-400 block truncate max-w-[150px]">{currentUser.email}</span>
                        </div>
                      </div>
                      <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${mobileProfileOpen ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {mobileProfileOpen && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-2 pl-2 space-y-1 overflow-hidden"
                        >
                          {currentUser.role === 'customer' ? (
                            <>
                              <button
                                onClick={() => {
                                  setCurrentView('customer_orders');
                                  setMobileMenuOpen(false);
                                }}
                                className="w-full text-left px-3.5 py-2 hover:bg-slate-50 text-slate-600 hover:text-slate-900 rounded-xl text-xs font-bold transition flex items-center gap-2 group cursor-pointer"
                              >
                                <ClipboardList className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-800 transition-colors" />
                                <span>History Orders</span>
                              </button>
                              <button
                                onClick={() => {
                                  setCurrentView('order');
                                  setMobileMenuOpen(false);
                                }}
                                className="w-full text-left px-3.5 py-2 hover:bg-slate-50 text-slate-600 hover:text-slate-900 rounded-xl text-xs font-bold transition flex items-center gap-2 group cursor-pointer"
                              >
                                <Navigation className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-800 transition-colors" />
                                <span>Route Pre-Orders</span>
                              </button>
                              <button
                                onClick={() => {
                                  setCurrentView('landing');
                                  setMobileMenuOpen(false);
                                }}
                                className="w-full text-left px-3.5 py-2 hover:bg-slate-50 text-slate-600 hover:text-slate-900 rounded-xl text-xs font-bold transition flex items-center gap-2 group cursor-pointer"
                              >
                                <Compass className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-800 transition-colors" />
                                <span>Explore Food</span>
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => {
                                  setCurrentView(currentUser.role === 'super_admin' ? 'super_admin' : 'restaurant_admin');
                                  setMobileMenuOpen(false);
                              }}
                              className="w-full text-left px-3.5 py-2 hover:bg-slate-50 text-slate-600 hover:text-slate-900 rounded-xl text-xs font-bold transition flex items-center gap-2 group cursor-pointer"
                            >
                              <LayoutDashboard className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-800 transition-colors" />
                              <span>Dashboard</span>
                            </button>
                          )}

                          <button
                            onClick={() => {
                                handleLogout();
                                setMobileMenuOpen(false);
                            }}
                            className="w-full text-left px-3.5 py-2 hover:bg-red-50 text-red-500 rounded-xl text-xs font-bold transition flex items-center gap-2 border-t border-slate-100 mt-1 group cursor-pointer"
                          >
                            <LogOut className="w-3.5 h-3.5 text-red-400 group-hover:text-red-500 transition-colors" />
                            <span>Logout Account</span>
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {!currentUser ? (
                  <>
                    {[
                      { view: 'products', label: 'Products' },
                      { view: 'solutions', label: 'Solutions' },
                      { view: 'resources', label: 'Why Us' },
                      { view: 'order', label: 'Order' },
                      { view: 'contact', label: 'Contact us' }
                    ].map((item) => (
                      <button
                        key={item.view}
                        onClick={() => { setCurrentView(item.view); setMobileMenuOpen(false); }}
                        className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition ${
                          currentView === item.view 
                            ? 'bg-slate-900 text-white shadow-sm' 
                            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </>
                ) : currentUser.role === 'customer' ? (
                  <>
                    {[
                      { view: 'landing', label: 'Explore Restaurants' },
                      { view: 'order', label: 'Route & Schedule Order' },
                      { view: 'customer_orders', label: 'My Orders & Pickup Codes' }
                    ].map((item) => (
                      <button
                        key={item.view}
                        onClick={() => { setCurrentView(item.view); setMobileMenuOpen(false); }}
                        className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition ${
                          currentView === item.view 
                            ? 'bg-slate-900 text-white shadow-sm' 
                            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </>
                ) : null}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Admin sub-nav tabs */}
          {isAdminView && currentUser && (
            <div className="max-w-7xl mx-auto mt-2 flex items-center gap-1 overflow-x-auto no-scrollbar pb-1">
              {currentUser.role === 'restaurant_admin' ? (
                <>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mr-2 whitespace-nowrap">Restaurant Admin</span>
                  {adminRestaurant && (
                    <span className="text-[10px] font-bold text-red-500 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full">
                      {adminRestaurant.name}
                    </span>
                  )}
                </>
              ) : (
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">👑 Super Admin Platform</span>
              )}
            </div>
          )}
        </header>
      )}

      {/* ── MAIN CONTENT ───────────────────────────────────────────────── */}
      <main className={isAdminView ? 'max-w-7xl mx-auto px-4 py-8' : isCustomerView ? '' : 'max-w-7xl mx-auto px-4 py-8 min-w-0 overflow-x-hidden'}>
        <AnimatePresence mode="wait">

          {/* LANDING */}
          {currentView === 'landing' && (
            <LandingPage
              key="landing"
              currentUser={currentUser}
              restaurants={restaurants}
              setSelectedRestaurantSlug={setSelectedRestaurantSlug}
              setCurrentView={setCurrentView}
              setActiveTableNo={setActiveTableNo}
              setOrderFlow={setOrderFlow}
              cart={cart}
              setCart={setCart}
              activeCoupon={activeCoupon}
              setActiveCoupon={setActiveCoupon}
              checkoutStep={checkoutStep}
              setCheckoutStep={setCheckoutStep}
              liveOrderTrackingId={liveOrderTrackingId}
              setLiveOrderTrackingId={setLiveOrderTrackingId}
              activeTableNo={activeTableNo}
              orders={orders}
              setOrders={setOrders}
              showPaymentModal={showPaymentModal}
              setShowPaymentModal={setShowPaymentModal}
              paymentProcessing={paymentProcessing}
              setPaymentProcessing={setPaymentProcessing}
              coupons={coupons}
            />
          )}

          {/* AUTH — Login / Signup / Plan / Payment */}
          {currentView === 'login' && (
            <AuthPage
              key="auth"
              users={users}
              setUsers={setUsers}
              restaurants={restaurants}
              setRestaurants={setRestaurants}
              categories={categories}
              setCategories={setCategories}
              setCurrentUser={setCurrentUser}
              setCurrentView={setCurrentView}
            />
          )}

          {/* CUSTOMER MENU */}
          {currentView === 'customer' && (
            currentRestaurant ? (
              <CustomerMenu
                key="customer"
                restaurant={currentRestaurant}
                categories={categories}
                menus={menus}
                cart={cart} setCart={setCart}
                activeCoupon={activeCoupon} setActiveCoupon={setActiveCoupon}
                checkoutStep={checkoutStep} setCheckoutStep={setCheckoutStep}
                selectedCategoryTab={selectedCategoryTab} setSelectedCategoryTab={setSelectedCategoryTab}
                foodTypeFilter={foodTypeFilter} setFoodTypeFilter={setFoodTypeFilter}
                searchQuery={searchQuery} setSearchQuery={setSearchQuery}
                selectedFoodPreview={selectedFoodPreview} setSelectedFoodPreview={setSelectedFoodPreview}
                liveOrderTrackingId={liveOrderTrackingId} setLiveOrderTrackingId={setLiveOrderTrackingId}
                activeTableNo={activeTableNo} setActiveTableNo={setActiveTableNo}
                t={t}
                orders={orders} setOrders={setOrders}
                showPaymentModal={showPaymentModal} setShowPaymentModal={setShowPaymentModal}
                paymentProcessing={paymentProcessing} setPaymentProcessing={setPaymentProcessing}
                favorites={favorites} setFavorites={setFavorites}
                coupons={coupons}
                onBack={() => {
                  if (isAdminPreview && currentUser?.role === 'restaurant_admin') {
                    setCurrentView('restaurant_admin');
                  } else {
                    setCurrentView('landing');
                  }
                }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center min-h-[60vh] bg-slate-900/60 backdrop-blur-md gap-4 rounded-3xl p-8 border border-white/10 max-w-md mx-auto my-20">
                <Loader message="Loading live digital menu..." dark={true} />
              </div>
            )
          )}

          {/* LOBBY QUEUE TV DISPLAY */}
          {currentView === 'queue_tv' && (
            <QueueTvView
              key="queue-tv"
              restaurantSlug={selectedRestaurantSlug}
              onBack={() => {
                if (currentUser?.role === 'restaurant_admin') {
                  setCurrentView('restaurant_admin');
                } else {
                  setCurrentView('landing');
                }
              }}
            />
          )}

          {/* RESTAURANT ADMIN DASHBOARD */}
          {currentView === 'restaurant_admin' && adminRestaurant && (
            <RestaurantAdminPanel
              key="rest-admin"
              restaurant={adminRestaurant}
              categories={categories} setCategories={setCategories}
              menus={menus} setMenus={setMenus}
              orders={orders} setOrders={setOrders}
              t={t}
              restaurants={restaurants} setRestaurants={setRestaurants}
            />
          )}

          {/* RESTAURANT ADMIN — no restaurant found */}
          {currentView === 'restaurant_admin' && !adminRestaurant && (
            <motion.div key="no-rest" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-center py-20 space-y-4">
              <div className="text-5xl">🏪</div>
              <h3 className="text-xl font-black text-slate-800">No Restaurant Linked</h3>
              <p className="text-sm text-slate-500">Your account isn't linked to any restaurant profile yet.</p>
              <button onClick={handleLogout} className="bg-red-500 text-white px-6 py-2.5 rounded-xl font-bold text-xs">
                Back to Login
              </button>
            </motion.div>
          )}

          {/* SUPER ADMIN DASHBOARD */}
          {currentView === 'super_admin' && (
            <SuperAdminPanel
              key="super-admin"
              restaurants={restaurants} setRestaurants={setRestaurants}
              orders={orders}
              categories={categories} setCategories={setCategories}
              coupons={coupons} setCoupons={setCoupons}
              users={users} setUsers={setUsers}
            />
          )}

          {/* ABOUT */}
          {currentView === 'about' && (
            <AboutPage key="about" setCurrentView={setCurrentView} />
          )}

          {/* CONTACT */}
          {currentView === 'contact' && (
            <ContactPage key="contact" setCurrentView={setCurrentView} />
          )}

          {/* PRODUCTS */}
          {currentView === 'products' && (
            <ProductsPage key="products" setCurrentView={setCurrentView} />
          )}

          {/* SOLUTIONS */}
          {currentView === 'solutions' && (
            <SolutionsPage key="solutions" setCurrentView={setCurrentView} />
          )}

          {/* WHY US */}
          {currentView === 'resources' && (
            <ResourcesPage key="resources" setCurrentView={setCurrentView} restaurants={restaurants} orders={orders} />
          )}

          {/* ORDER PAGE */}
          {currentView === 'order' && (
            <OrderPage
              key="order"
              restaurants={restaurants}
              setCurrentView={setCurrentView}
              setOrders={setOrders}
              orders={orders}
              initialFlow={orderFlow}
            />
          )}

          {/* PRIVACY POLICY */}
          {currentView === 'privacy' && (
            <PrivacyPolicyPage key="privacy" setCurrentView={setCurrentView} />
          )}

          {/* TERMS & CONDITIONS */}
          {currentView === 'terms' && (
            <TermsConditionsPage key="terms" setCurrentView={setCurrentView} />
          )}

          {/* REFUND POLICY */}
          {currentView === 'refund' && (
            <RefundPolicyPage key="refund" setCurrentView={setCurrentView} />
          )}

          {/* CUSTOMER ORDERS DASHBOARD */}
          {currentView === 'customer_orders' && currentUser && (
            <CustomerOrders key="customer-orders" currentUser={currentUser} onBack={() => setCurrentView('landing')} />
          )}

        </AnimatePresence>
      </main>

      {/* ── FOOTER ─────────────────────────────────────────────────────── */}
      {/* Footer disabled globally across all views */}
      {false && !isCustomerView && !currentUser && (
        <footer className="bg-slate-900 text-slate-300 border-t border-white/5 py-12 px-6 mt-12">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand column */}
            <div className="space-y-4">
              <div 
                onClick={() => { setCurrentView('landing'); }}
                className="cursor-pointer inline-block"
              >
                <img src="/order_logo.png" className="h-10 w-auto object-contain brightness-0 invert" alt="SkyWeb IT Solutions" />
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                SkyWeb IT Solutions Private Limited is a Hyderabad-based technology startup. We build advanced SaaS marketplace platforms and payment-enabled digital order systems for modern cafes, restaurants, and retail stores.
              </p>
              <div className="text-[10px] text-slate-500 font-medium">
                CIN: U72200TG2023PTC170000
              </div>
            </div>

            {/* Platform links */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">Company</h4>
              <ul className="space-y-2.5 text-xs">
                <li>
                  <button onClick={() => setCurrentView('about')} className="hover:text-red-400 transition-colors">
                    About Us
                  </button>
                </li>
                <li>
                  <button onClick={() => setCurrentView('contact')} className="hover:text-red-400 transition-colors">
                    Contact Us
                  </button>
                </li>
                <li>
                  <a href="#explore" onClick={() => setCurrentView('landing')} className="hover:text-red-400 transition-colors">
                    Explore Partners
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal compliance */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">Legal & Compliance</h4>
              <ul className="space-y-2.5 text-xs">
                <li>
                  <button onClick={() => setCurrentView('privacy')} className="hover:text-red-400 transition-colors">
                    Privacy Policy
                  </button>
                </li>
                <li>
                  <button onClick={() => setCurrentView('terms')} className="hover:text-red-400 transition-colors">
                    Terms & Conditions
                  </button>
                </li>
                <li>
                  <button onClick={() => setCurrentView('refund')} className="hover:text-red-400 transition-colors">
                    Refund & Cancellation
                  </button>
                </li>
              </ul>
            </div>

            {/* Security & Partners */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">Secure Settlements</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Platform transaction payouts are processed via PCI-DSS compliant aggregators Cashfree and Razorpay.
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                <span className="bg-white/5 border border-white/10 text-slate-300 px-2.5 py-1 rounded text-[9px] font-bold tracking-wider uppercase">
                  Cashfree Payments
                </span>
                <span className="bg-white/5 border border-white/10 text-slate-300 px-2.5 py-1 rounded text-[9px] font-bold tracking-wider uppercase">
                  Razorpay
                </span>
                <span className="bg-white/5 border border-white/10 text-slate-300 px-2.5 py-1 rounded text-[9px] font-bold tracking-wider uppercase">
                  PCI-DSS Compliant
                </span>
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto mt-10 pt-6 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4 text-[11px] text-slate-500">
            <p>© {new Date().getFullYear()} SkyWeb IT Solutions Private Limited. All rights reserved.</p>
            <p>Made in Hyderabad, India 🇮🇳</p>
          </div>
        </footer>
      )}

      {/* Neumorphic Floating Rotating Plate (SaaS Core Showcases) */}
      {currentView === 'landing' && !currentUser && (
        <div className="hidden lg:block fixed right-0 top-[22%] translate-x-1/2 z-50 pointer-events-auto select-none">
          <CircularRevealHeading 
            items={PLATE_ITEMS} 
            centerText={PLATE_CENTER_TEXT} 
            size="lg" 
          />
        </div>
      )}
    </div>
  );
}
