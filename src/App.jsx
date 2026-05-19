import React, { useState, useEffect, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Utensils, Sparkles, LogOut, LayoutDashboard, Crown } from 'lucide-react';
import { apiRequest } from './utils/api';

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

// Mock data removed. App operates exclusively on MongoDB backend.

// ── Seed users (will be merged with localStorage) ──────────────────────────
const SEED_USERS = [];

export default function App() {

  // ── Persistent State ───────────────────────────────────────────────────
  // ── Persistent State ───────────────────────────────────────────────────
  const [restaurants, setRestaurants] = useState(() => {
    const saved = localStorage.getItem('restro_restaurants');
    return saved ? JSON.parse(saved) : [];
  });
  const [categories, setCategories] = useState(() => {
    const saved = localStorage.getItem('restro_categories');
    return saved ? JSON.parse(saved) : [];
  });
  const [menus, setMenus] = useState(() => {
    const saved = localStorage.getItem('restro_menus');
    return saved ? JSON.parse(saved) : [];
  });
  const [orders, setOrders] = useState(() => {
    const saved = localStorage.getItem('restro_orders');
    return saved ? JSON.parse(saved) : [];
  });
  const [coupons, setCoupons] = useState(() => {
    const saved = localStorage.getItem('restro_coupons');
    return saved ? JSON.parse(saved) : [];
  });

  // Users — merge seed + any registered users saved in localStorage
  const [users, setUsers] = useState(() => {
    const saved = localStorage.getItem('restro_users');
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
    const saved = localStorage.getItem('restro_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  // ── Sync to LocalStorage ───────────────────────────────────────────────
  useEffect(() => { localStorage.setItem('restro_restaurants', JSON.stringify(restaurants)); }, [restaurants]);
  useEffect(() => { localStorage.setItem('restro_categories',  JSON.stringify(categories));  }, [categories]);
  useEffect(() => { localStorage.setItem('restro_menus',       JSON.stringify(menus));       }, [menus]);
  useEffect(() => { localStorage.setItem('restro_orders',      JSON.stringify(orders));      }, [orders]);
  useEffect(() => { localStorage.setItem('restro_coupons',     JSON.stringify(coupons));     }, [coupons]);
  useEffect(() => {
    // Only store non-seed users
    const toStore = users.filter(u => !SEED_USERS.find(s => s.email === u.email));
    localStorage.setItem('restro_users', JSON.stringify(toStore));
  }, [users]);
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('restro_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('restro_current_user');
      setIsAdminPreview(false);
    }
  }, [currentUser]);

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
            theme: dbRest.theme || { primaryColor: '#bd3838', secondaryColor: '#0f172a', textColor: '#ffffff', styleType: 'glassmorphism' },
            timings: dbRest.timings || { open: '09:00', close: '22:00' },
            contact: dbRest.contact || { phone: '', email: '', address: '', socialLinks: {} },
            settings: dbRest.settings || { gstPercentage: 5, deliveryCharge: 0, minimumOrderAmount: 100 },
            tables: dbRest.tables || [{ tableNo: 'T1', qrCodeUrl: '' }],
            isApproved: dbRest.isApproved,
            isActive: dbRest.isActive,
            rating: dbRest.rating || 5.0,
            bankDetails: dbRest.bankDetails || { bankName: '', accountHolderName: '', accountNumber: '', ifscCode: '' }
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
            theme: dbRest.theme || { primaryColor: '#bd3838', secondaryColor: '#0f172a', textColor: '#ffffff', styleType: 'glassmorphism' },
            timings: dbRest.timings || { open: '09:00', close: '22:00' },
            contact: dbRest.contact || { phone: '', email: '', address: '', socialLinks: {} },
            settings: dbRest.settings || { gstPercentage: 5, deliveryCharge: 0, minimumOrderAmount: 100 },
            tables: dbRest.tables || [{ tableNo: 'T1', qrCodeUrl: '' }],
            isApproved: dbRest.isApproved,
            isActive: dbRest.isActive,
            rating: dbRest.rating || 5.0,
            bankDetails: dbRest.bankDetails || { bankName: '', accountHolderName: '', accountNumber: '', ifscCode: '' }
          };

          // Sync restaurants array with this profile
          setRestaurants(prev => {
            const filtered = prev.filter(r => r.id !== restId && r.slug !== formattedRest.slug);
            return [...filtered, formattedRest];
          });

          // 2. Fetch categories & menus
          const catRes = await apiRequest(`/restaurant/public/${formattedRest.slug}`);
          if (catRes.success) {
            if (catRes.categories) {
              const formattedCats = catRes.categories.map(c => ({
                id: c._id,
                name: c.name,
                image: c.image || 'https://img.icons8.com/fluency/96/pizza.png',
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
                image: m.image || 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=600&auto=format&fit=crop',
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
                createdAt: o.createdAt
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
    const saved = localStorage.getItem('restro_current_user');
    if (saved) {
      const u = JSON.parse(saved);
      if (u.role === 'super_admin') return 'super_admin';
      if (u.role === 'restaurant_admin') return 'restaurant_admin';
    }
    return 'landing';
  });

  const [selectedRestaurantSlug, setSelectedRestaurantSlug] = useState('');
  
  // Track whether this is an admin preview or a direct QR scan customer session.
  const [isAdminPreview, setIsAdminPreview] = useState(() => {
    return sessionStorage.getItem('restro_is_admin_preview') === 'true';
  });

  // Keep customer table session tab-isolated via sessionStorage
  const [activeTableNo, setActiveTableNo] = useState(() => {
    return sessionStorage.getItem('restro_active_table') || '';
  });
  
  const [language, setLanguage] = useState('English');

  // Customer state: Keep cart, checkout state, and order tracking isolated to each browser tab session
  const [cart, setCart] = useState(() => {
    const saved = sessionStorage.getItem('restro_cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [activeCoupon, setActiveCoupon] = useState(null);
  const [checkoutStep, setCheckoutStep] = useState(() => {
    return sessionStorage.getItem('restro_checkout_step') || null;
  });
  const [selectedCategoryTab, setSelectedCategoryTab] = useState('All');
  const [foodTypeFilter, setFoodTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFoodPreview, setSelectedFoodPreview] = useState(null);
  const [liveOrderTrackingId, setLiveOrderTrackingId] = useState(() => {
    return sessionStorage.getItem('restro_live_order_tracking_id') || null;
  });
  
  const [favorites, setFavorites] = useState([]);
  const [showRazorpayModal, setShowRazorpayModal] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  // ── Sync Customer Session States to sessionStorage ────────────────────
  useEffect(() => {
    sessionStorage.setItem('restro_is_admin_preview', isAdminPreview ? 'true' : 'false');
  }, [isAdminPreview]);

  useEffect(() => {
    sessionStorage.setItem('restro_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    if (activeTableNo) sessionStorage.setItem('restro_active_table', activeTableNo);
    else sessionStorage.removeItem('restro_active_table');
  }, [activeTableNo]);

  useEffect(() => {
    if (checkoutStep) sessionStorage.setItem('restro_checkout_step', checkoutStep);
    else sessionStorage.removeItem('restro_checkout_step');
  }, [checkoutStep]);

  useEffect(() => {
    if (liveOrderTrackingId) sessionStorage.setItem('restro_live_order_tracking_id', liveOrderTrackingId);
    else sessionStorage.removeItem('restro_live_order_tracking_id');
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
            theme: dbRest.theme || { primaryColor: '#bd3838', secondaryColor: '#0f172a', textColor: '#ffffff', styleType: 'glassmorphism' },
            timings: dbRest.timings || { open: '09:00', close: '22:00' },
            contact: dbRest.contact || { phone: '', email: '', address: '', socialLinks: {} },
            settings: dbRest.settings || { gstPercentage: 5, deliveryCharge: 0, minimumOrderAmount: 100 },
            tables: dbRest.tables || [{ tableNo: 'T1', qrCodeUrl: '' }],
            isApproved: dbRest.isApproved,
            isActive: dbRest.isActive,
            rating: dbRest.rating || 5.0,
            bankDetails: dbRest.bankDetails || { bankName: '', accountHolderName: '', accountNumber: '', ifscCode: '' }
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
              image: c.image || 'https://img.icons8.com/fluency/96/pizza.png',
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
              image: m.image || 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=600&auto=format&fit=crop',
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
    localStorage.removeItem('restro_current_user');
    sessionStorage.removeItem('restro_is_admin_preview');
    sessionStorage.removeItem('restro_cart');
    sessionStorage.removeItem('restro_active_table');
    sessionStorage.removeItem('restro_checkout_step');
    sessionStorage.removeItem('restro_live_order_tracking_id');
  };

  // ── Translation helper ────────────────────────────────────────────────
  const t = (key) => {
    const translations = {
      English: { searchFood: 'Search delicious dishes...', addToCart: 'Add to Cart', checkout: 'Secure Checkout', veg: 'Veg', nonVeg: 'Non-Veg', vegan: 'Vegan', spicy: 'Spicy', bestseller: 'Bestseller', special: "Today's Special", items: 'items', placeOrder: 'Place Order via Razorpay', liveTracking: 'Live Order Tracking', explore: 'Explore Restaurants', scanTable: 'Table Dine-in Menu', gst: 'GST (5%)', delivery: 'Delivery Charge', subtotal: 'Subtotal', total: 'Grand Total' },
      Hindi: { searchFood: 'स्वादिष्ट व्यंजन खोजें...', addToCart: 'कार्ट में जोड़ें', checkout: 'सुरक्षित चेकआउट', veg: 'शाकाहारी', nonVeg: 'मांसाहारी', vegan: 'वेगन', spicy: 'तीखा', bestseller: 'सबसे लोकप्रिय', special: 'आज की विशेषता', items: 'आइटम', placeOrder: 'ऑर्डर सबमिट करें', liveTracking: 'लाइव ऑर्डर ट्रैकिंग', explore: 'रेस्तरां देखें', scanTable: 'टेबल डाइन-इन मेनू', gst: 'जीएसटी (5%)', delivery: 'वितरण शुल्क', subtotal: 'उपयोग', total: 'कुल योग' },
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
              onClick={() => { if (!currentUser) { setCurrentView('landing'); setCheckoutStep(null); } }}
              className={`flex items-center ${!currentUser ? 'cursor-pointer' : 'cursor-default'} group`}
            >
              <img src="/order_logo.png" className="h-12 w-auto object-contain group-hover:scale-105 transition-all" alt="RestroSaaS" />
            </div>

            {/* Public navigation links */}
            {!currentUser && (
              <nav className="hidden md:flex items-center gap-8 text-xs font-black uppercase tracking-wider text-slate-500">
                <button
                  onClick={() => { setCurrentView('landing'); setCheckoutStep(null); }}
                  className={`hover:text-red-500 transition-colors ${currentView === 'landing' ? 'text-red-500' : ''}`}
                >
                  Home
                </button>
                <button
                  onClick={() => { setCurrentView('about'); }}
                  className={`hover:text-red-500 transition-colors ${currentView === 'about' ? 'text-red-500' : ''}`}
                >
                  About Us
                </button>
                <button
                  onClick={() => { setCurrentView('contact'); }}
                  className={`hover:text-red-500 transition-colors ${currentView === 'contact' ? 'text-red-500' : ''}`}
                >
                  Contact
                </button>
              </nav>
            )}

            {/* Right controls */}
            <div className="flex items-center gap-3">



              {/* Logged-in user bar */}
              {currentUser ? (
                <div className="flex items-center gap-3">
                  {/* Role badge */}
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold ${currentUser.role === 'super_admin' ? 'bg-purple-500/10 text-purple-600 border border-purple-200' : 'bg-red-500/10 text-red-600 border border-red-200'}`}>
                    {currentUser.role === 'super_admin' ? <Crown className="w-3.5 h-3.5" /> : <LayoutDashboard className="w-3.5 h-3.5" />}
                    <span className="hidden sm:block">{currentUser.name}</span>
                  </div>

                  {/* Browse store (for restaurant admins) */}
                  {currentUser.role === 'restaurant_admin' && adminRestaurant && (
                    <button
                      onClick={() => {
                        setSelectedRestaurantSlug(adminRestaurant.slug);
                        setCurrentView('customer');
                        setIsAdminPreview(true);
                      }}
                      className="bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-1.5">
                      <Utensils className="w-3.5 h-3.5" />
                      View Store
                    </button>
                  )}

                  {/* Logout */}
                  <button onClick={handleLogout}
                    className="flex items-center gap-1.5 bg-slate-100 hover:bg-red-50 border border-slate-200 hover:border-red-200 text-slate-600 hover:text-red-500 font-bold text-xs px-4 py-2.5 rounded-xl transition">
                    <LogOut className="w-3.5 h-3.5" />
                    <span className="hidden sm:block">Logout</span>
                  </button>
                </div>
              ) : (
                /* Book Now / Login button */
                <button
                  onClick={() => { setCurrentView('login'); }}
                  className="bg-red-500 hover:bg-red-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md transition hover:scale-[1.03] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Book Now
                </button>
              )}
            </div>
          </div>

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
              restaurants={restaurants}
              setSelectedRestaurantSlug={setSelectedRestaurantSlug}
              setCurrentView={setCurrentView}
              setActiveTableNo={setActiveTableNo}
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
                showRazorpayModal={showRazorpayModal} setShowRazorpayModal={setShowRazorpayModal}
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
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
                <p className="text-sm font-black text-white tracking-wide animate-pulse">Loading live digital menu from MongoDB...</p>
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

        </AnimatePresence>
      </main>

      {/* ── FOOTER ─────────────────────────────────────────────────────── */}
      {!isCustomerView && !currentUser && (
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
    </div>
  );
}
