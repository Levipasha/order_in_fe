import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import {
  Lock, Mail, User, Phone, Store, ChevronRight,
  Check, Sparkles, ArrowLeft, CreditCard, Shield
} from 'lucide-react';
import { auth } from '../../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { apiRequest } from '../../utils/api';

const PLANS = [
  {
    id: 'free',
    name: 'Free Trial',
    price: 0,
    period: '1 Month',
    badge: null,
    color: 'border-white/10',
    features: ['1 Restaurant Profile', 'Basic digital menu', 'Table QR generator', 'Up to 50 orders/mo'],
  },
  {
    id: 'basic',
    name: 'Premium Pro',
    price: 1,
    period: 'Month',
    badge: 'Most Popular',
    color: 'border-[#bd3838]',
    features: ['Advanced glassmorphic themes', 'Realtime order dashboard', 'WhatsApp notifications', 'Unlimited monthly orders'],
  },
];

export default function AuthPage({ users, setUsers, restaurants, setRestaurants, setCategories, categories, setCurrentUser, setCurrentView }) {
  const [mode, setMode] = useState('login'); // 'login' | 'signup' | 'plan' | 'payment'
  const [authError, setAuthError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Login fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Signup fields
  const [signupData, setSignupData] = useState({
    restaurantName: '',
    ownerName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [selectedPlan, setSelectedPlan] = useState(null);

  // Payment mock
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [cardData, setCardData] = useState({ cardNo: '', expiry: '', cvv: '', name: '' });

  /* ─── LOGIN ─── */
  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      // 1. Authenticate with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      let user = null;

      try {
        // 2. Connect to Express/MongoDB backend API
        const res = await apiRequest('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password })
        });

        if (res.success) {
          localStorage.setItem('restro_token', res.token);
          
          user = {
            id: res.user.id,
            email: res.user.email,
            role: res.user.role,
            name: res.user.name,
            restaurantId: ''
          };

          // Fetch the admin's restaurant profile
          try {
            const restRes = await apiRequest('/restaurant/profile/me', {
              headers: { 'Authorization': `Bearer ${res.token}` }
            });
            if (restRes.success && restRes.restaurant) {
              user.restaurantId = restRes.restaurant._id;
              
              // Sync backend restaurant data with local React state
              if (!restaurants.find(r => r.id === restRes.restaurant._id)) {
                const fetchedRest = {
                  id: restRes.restaurant._id,
                  name: restRes.restaurant.name,
                  slug: restRes.restaurant.slug,
                  logo: restRes.restaurant.logo || 'https://img.icons8.com/fluency/196/hamburger.png',
                  banner: restRes.restaurant.banner || 'https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=1200&auto=format&fit=crop',
                  theme: restRes.restaurant.theme || { primaryColor: '#bd3838', secondaryColor: '#0f172a', textColor: '#ffffff', styleType: 'glassmorphism' },
                  timings: restRes.restaurant.timings || { open: '09:00', close: '22:00' },
                  contact: restRes.restaurant.contact || { phone: restRes.restaurant.contact?.phone || '', email: email, address: '', socialLinks: {} },
                  settings: restRes.restaurant.settings || { gstPercentage: 5, deliveryCharge: 0, minimumOrderAmount: 100 },
                  tables: restRes.restaurant.tables || [{ tableNo: 'T1', qrCodeUrl: '' }],
                  isApproved: restRes.restaurant.isApproved,
                  isActive: restRes.restaurant.isActive,
                  rating: restRes.restaurant.rating || 5.0,
                };
                setRestaurants(prev => [...prev, fetchedRest]);
              }
            }
          } catch (rErr) {
            console.warn("No backend restaurant profile found for this logged-in owner yet:", rErr.message);
          }
        }
      } catch (backendErr) {
        console.warn("Backend MongoDB authentication failed. Proceeding with frontend local mock sync:", backendErr.message);
      }

      // If backend login succeeded, set that user; otherwise, perform local mock authentication fallback
      if (!user) {
        user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (!user) {
          user = {
            email: firebaseUser.email,
            password: password,
            role: 'restaurant_admin',
            name: firebaseUser.displayName || 'Restaurant Owner',
            restaurantId: `rest_${Date.now()}`
          };
          setUsers(prev => [...prev, user]);
        }
      }

      setCurrentUser(user);
      if (user.role === 'super_admin') setCurrentView('super_admin');
      else setCurrentView('restaurant_admin');
    } catch (err) {
      console.error(err);
      
      // Auto-register seed user fallback for seamless demo transitions!
      const localSeedUser = users.find(
        u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
      );
      if (localSeedUser && (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential')) {
        try {
          await createUserWithEmailAndPassword(auth, email, password);
          setCurrentUser(localSeedUser);
          if (localSeedUser.role === 'super_admin') setCurrentView('super_admin');
          else setCurrentView('restaurant_admin');
          return;
        } catch (regErr) {
          console.error("Auto-registration of seed user failed:", regErr);
        }
      }

      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setAuthError('Invalid password. Please try again.');
      } else if (err.code === 'auth/user-not-found') {
        setAuthError('No account found with this email. Please register.');
      } else if (err.code === 'auth/too-many-requests') {
        setAuthError('Too many failed attempts. Try again later.');
      } else {
        setAuthError(err.message || 'Authentication failed. Please check your credentials.');
      }
    }
  };

  const quickFill = (e, pw) => { setEmail(e); setPassword(pw); setAuthError(''); };

  /* ─── SIGNUP STEP 1 ─── */
  const handleSignupNext = (e) => {
    e.preventDefault();
    setAuthError('');
    if (signupData.password !== signupData.confirmPassword) {
      setAuthError('Passwords do not match.');
      return;
    }
    if (users.find(u => u.email.toLowerCase() === signupData.email.toLowerCase())) {
      setAuthError('An account already exists with this email.');
      return;
    }
    setMode('plan');
  };

  /* ─── PLAN SELECTION ─── */
  const handlePlanSelect = (plan) => {
    setSelectedPlan(plan);
    if (plan.price === 0) {
      // Free plan — skip payment
      finalizeRegistration(plan, null);
    } else {
      setMode('payment');
    }
  };

  /* ── PAYMENT ── */
  const handlePayment = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setPaymentProcessing(true);
    setAuthError('');

    const keyId = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_live_Sqkynvgqfe1GZC';

    const options = {
      key: keyId,
      amount: (selectedPlan?.price || 1) * 100, // Amount in paisa (100 paisa = ₹1)
      currency: "INR",
      name: signupData.restaurantName || "RestroSaaS",
      description: `Subscription for ${selectedPlan?.name || 'Premium Pro'}`,
      image: "https://img.icons8.com/fluency/196/hamburger.png",
      handler: function (response) {
        // Payment success!
        console.log("Razorpay payment success response:", response);
        setPaymentProcessing(false);
        finalizeRegistration(selectedPlan, response);
      },
      prefill: {
        name: signupData.ownerName || "",
        email: signupData.email || "",
        contact: signupData.phone || ""
      },
      notes: {
        ownerName: signupData.ownerName || "",
        restaurantName: signupData.restaurantName || ""
      },
      theme: {
        color: "#bd3838"
      },
      modal: {
        ondismiss: function () {
          setPaymentProcessing(false);
          setAuthError('Payment was cancelled. Please try again.');
        }
      }
    };

    try {
      if (window.Razorpay) {
        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        // Fallback if Razorpay SDK failed to load
        console.warn("Razorpay SDK not found, loading dynamically...");
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => {
          const rzp = new window.Razorpay(options);
          rzp.open();
        };
        script.onerror = () => {
          setPaymentProcessing(false);
          setAuthError('Failed to load Razorpay payment gateway. Please check your internet connection.');
        };
        document.body.appendChild(script);
      }
    } catch (err) {
      console.error("Razorpay trigger error:", err);
      setPaymentProcessing(false);
      setAuthError('An error occurred while initializing Razorpay. Please try again.');
    }
  };

  /* ─── FINALIZE REGISTRATION ─── */
  const finalizeRegistration = async (plan, payment) => {
    setPaymentProcessing(true);
    try {
      // 1. Create Firebase user
      await createUserWithEmailAndPassword(auth, signupData.email, signupData.password);

      let restId = `rest_${Date.now()}`;
      const slug = signupData.restaurantName
        .toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');

      let newRestaurant = null;
      let newCategory = null;
      let newUser = null;

      try {
        // 2. Connect to Express/MongoDB backend API and register
        const regRes = await apiRequest('/auth/register', {
          method: 'POST',
          body: JSON.stringify({
            name: signupData.ownerName,
            email: signupData.email,
            password: signupData.password,
            role: 'restaurant_admin',
            phone: signupData.phone
          })
        });

        if (regRes.success) {
          const token = regRes.token;
          localStorage.setItem('restro_token', token);

          // 3. Create restaurant profile on backend MongoDB
          const restRes = await apiRequest('/restaurant/profile', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
              name: signupData.restaurantName,
              slug,
              logo: 'https://img.icons8.com/fluency/196/hamburger.png',
              banner: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=1200&auto=format&fit=crop',
              theme: { primaryColor: '#bd3838', secondaryColor: '#0f172a', textColor: '#ffffff', styleType: 'glassmorphism' },
              timings: { open: '09:00', close: '22:00' },
              contact: {
                phone: signupData.phone || '+91 9999988888',
                email: signupData.email,
                address: 'GF, Marketplace Plaza, India',
                socialLinks: { instagram: '', facebook: '', whatsapp: signupData.phone || '' },
              },
              settings: { gstPercentage: 5, deliveryCharge: 0, minimumOrderAmount: 150 }
            })
          });

          if (restRes.success) {
            const backendRest = restRes.restaurant;
            restId = backendRest._id;

            newRestaurant = {
              id: backendRest._id,
              name: backendRest.name,
              slug: backendRest.slug,
              logo: backendRest.logo,
              banner: backendRest.banner,
              theme: backendRest.theme,
              timings: backendRest.timings,
              contact: backendRest.contact,
              settings: backendRest.settings,
              tables: backendRest.tables || [{ tableNo: 'T1', qrCodeUrl: '' }],
              isApproved: backendRest.isApproved,
              isActive: backendRest.isActive,
              rating: backendRest.rating || 5.0,
            };

            // 4. Create initial Main Menu Category on backend MongoDB
            try {
              const catRes = await apiRequest('/restaurant/categories', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                  name: 'Main Menu',
                  image: 'https://img.icons8.com/fluency/96/pizza.png'
                })
              });
              if (catRes.success) {
                const backendCat = catRes.category;
                newCategory = {
                  id: backendCat._id,
                  name: backendCat.name,
                  image: backendCat.image,
                  restaurantId: backendRest._id,
                };
              }
            } catch (catErr) {
              console.warn("Could not seed default category on backend MongoDB:", catErr.message);
            }
          }
        }
      } catch (backendErr) {
        console.warn("Backend MongoDB registration failed. Falling back to local state initialization:", backendErr.message);
      }

      // If backend failed or succeeded, ensure local React data structures are populated correctly!
      if (!newRestaurant) {
        newRestaurant = {
          id: restId,
          name: signupData.restaurantName,
          slug,
          logo: 'https://img.icons8.com/fluency/196/hamburger.png',
          banner: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=1200&auto=format&fit=crop',
          theme: { primaryColor: '#bd3838', secondaryColor: '#0f172a', textColor: '#ffffff', styleType: 'glassmorphism' },
          timings: { open: '09:00', close: '22:00' },
          contact: {
            phone: signupData.phone || '+91 9999988888',
            email: signupData.email,
            address: 'GF, Marketplace Plaza, India',
            socialLinks: { instagram: '', facebook: '', whatsapp: signupData.phone || '' },
          },
          settings: { gstPercentage: 5, deliveryCharge: 0, minimumOrderAmount: 150 },
          tables: [{ tableNo: 'T1', qrCodeUrl: '' }],
          isApproved: true,
          isActive: true,
          rating: 5.0,
          featured: false,
          subscriptionPlan: plan.id,
          subscriptionActive: true,
          subscriptionExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        };
      }

      if (!newCategory) {
        newCategory = {
          id: `cat_${Date.now()}`,
          name: 'Main Menu',
          image: 'https://img.icons8.com/fluency/96/pizza.png',
          restaurantId: restId,
        };
      }

      if (!newUser) {
        newUser = {
          email: signupData.email,
          password: signupData.password,
          role: 'restaurant_admin',
          name: signupData.ownerName,
          restaurantId: restId,
        };
      }

      setRestaurants(prev => [...prev, newRestaurant]);
      setCategories(prev => [...prev, newCategory]);
      setUsers(prev => [...prev, newUser]);
      setCurrentUser(newUser);
      setPaymentProcessing(false);
      setCurrentView('restaurant_admin');
    } catch (err) {
      console.error(err);
      setPaymentProcessing(false);
      if (err.code === 'auth/email-already-in-use') {
        setAuthError('This email is already in use on Firebase.');
      } else if (err.code === 'auth/weak-password') {
        setAuthError('Password is too weak. Please use at least 6 characters.');
      } else {
        setAuthError(err.message || 'Registration failed.');
      }
      setMode('signup');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="min-h-[80vh] flex items-center justify-center py-8"
    >
      {/* ── LOTTIE PAYMENT PROCESSING OVERLAY ── */}
      <AnimatePresence>
        {paymentProcessing && (
          <motion.div
            key="payment-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex flex-col items-center justify-center gap-4"
          >
            <div className="w-64 h-64">
              <DotLottieReact
                src="https://lottie.host/feac8e96-35e3-4d1d-b36e-d7aea972747f/WJRXNHpxcY.lottie"
                loop
                autoplay
              />
            </div>
            <div className="text-center space-y-1">
              <p className="text-white font-black text-lg">Processing Payment...</p>
              <p className="text-slate-400 text-xs">Please wait while we activate your account</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full max-w-md">
        <AnimatePresence mode="wait">

          {/* ──────────── LOGIN ──────────── */}
          {mode === 'login' && (
            <motion.div
              key="login"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30 }}
              className="bg-slate-900 border border-white/5 rounded-3xl p-8 shadow-2xl space-y-6"
            >
              <div className="text-center space-y-2">
                <div className="w-14 h-14 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mx-auto">
                  <Lock className="w-6 h-6 text-red-400" />
                </div>
                <h2 className="text-2xl font-black text-white">Welcome Back</h2>
                <p className="text-xs text-slate-400">Sign in to manage your restaurant dashboard</p>
              </div>

              {authError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-xl text-center font-bold">
                  {authError}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5" /> Email Address
                  </label>
                  <input
                    type="email" required placeholder="owner@restaurant.com"
                    className="w-full bg-slate-800 border border-slate-700 px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-red-500 text-white"
                    value={email} onChange={e => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5" /> Password
                  </label>
                  <input
                    type="password" required placeholder="••••••••"
                    className="w-full bg-slate-800 border border-slate-700 px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-red-500 text-white"
                    value={password} onChange={e => setPassword(e.target.value)}
                  />
                </div>
                <button type="submit" className="w-full py-3.5 bg-red-500 hover:bg-red-600 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-red-500/20 transition hover:scale-[1.02]">
                  Sign In to Dashboard
                </button>
              </form>

              {/* Quick credentials */}
              <div className="space-y-3 pt-2 border-t border-white/5">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block text-center">Quick Demo Login</span>
                <div className="grid grid-cols-2 gap-2 text-[9px]">
                  {[
                    { label: '👑 Super Admin', e: 'admin@restrosaas.com', p: 'admin123', cls: 'border-purple-500/20 text-purple-300 bg-purple-500/5 hover:bg-purple-500/10' },
                    { label: '🍕 Pizza Hub', e: 'pizza@pizzahub.com', p: 'pizza123', cls: 'border-red-500/20 text-red-300 bg-red-500/5 hover:bg-red-500/10' },
                    { label: '🍛 Curry Palace', e: 'curry@currypalace.com', p: 'curry123', cls: 'border-yellow-500/20 text-yellow-300 bg-yellow-500/5 hover:bg-yellow-500/10' },
                    { label: '🥗 Green Garden', e: 'green@greengarden.com', p: 'green123', cls: 'border-green-500/20 text-green-300 bg-green-500/5 hover:bg-green-500/10' },
                  ].map(d => (
                    <button key={d.e} onClick={() => quickFill(d.e, d.p)}
                      className={`border font-bold p-2.5 rounded-xl transition text-left ${d.cls}`}>
                      {d.label}
                      <span className="block font-normal text-slate-400 mt-0.5 truncate">{d.e}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="text-center pt-2">
                <span className="text-xs text-slate-400">New restaurant owner? </span>
                <button onClick={() => { setMode('signup'); setAuthError(''); }}
                  className="text-xs text-red-400 font-bold hover:text-red-300 transition">
                  Register here →
                </button>
              </div>
            </motion.div>
          )}

          {/* ──────────── SIGNUP ──────────── */}
          {mode === 'signup' && (
            <motion.div
              key="signup"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              className="bg-slate-900 border border-white/5 rounded-3xl p-8 shadow-2xl space-y-6"
            >
              <div className="flex items-center gap-3">
                <button onClick={() => { setMode('login'); setAuthError(''); }}
                  className="p-2 bg-slate-800 border border-white/5 rounded-xl hover:bg-slate-700 text-slate-300 transition">
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <h2 className="text-xl font-black text-white">Register Your Restaurant</h2>
                  <p className="text-xs text-slate-400">Step 1 of 2 — Account Details</p>
                </div>
              </div>

              {authError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-xl text-center font-bold">
                  {authError}
                </div>
              )}

              <form onSubmit={handleSignupNext} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1">
                    <Store className="w-3.5 h-3.5" /> Restaurant Name
                  </label>
                  <input type="text" required placeholder="e.g. The Burger House"
                    className="w-full bg-slate-800 border border-slate-700 px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-red-500 text-white"
                    value={signupData.restaurantName}
                    onChange={e => setSignupData({ ...signupData, restaurantName: e.target.value })} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1">
                      <User className="w-3.5 h-3.5" /> Owner Name
                    </label>
                    <input type="text" required placeholder="Full Name"
                      className="w-full bg-slate-800 border border-slate-700 px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-red-500 text-white"
                      value={signupData.ownerName}
                      onChange={e => setSignupData({ ...signupData, ownerName: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5" /> Phone
                    </label>
                    <input type="tel" placeholder="+91 9999988888"
                      className="w-full bg-slate-800 border border-slate-700 px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-red-500 text-white"
                      value={signupData.phone}
                      onChange={e => setSignupData({ ...signupData, phone: e.target.value })} />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5" /> Email Address
                  </label>
                  <input type="email" required placeholder="owner@restaurant.com"
                    className="w-full bg-slate-800 border border-slate-700 px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-red-500 text-white"
                    value={signupData.email}
                    onChange={e => setSignupData({ ...signupData, email: e.target.value })} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5" /> Password
                    </label>
                    <input type="password" required placeholder="Min 6 chars"
                      className="w-full bg-slate-800 border border-slate-700 px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-red-500 text-white"
                      value={signupData.password}
                      onChange={e => setSignupData({ ...signupData, password: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1">
                      <Shield className="w-3.5 h-3.5" /> Confirm
                    </label>
                    <input type="password" required placeholder="Repeat"
                      className="w-full bg-slate-800 border border-slate-700 px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-red-500 text-white"
                      value={signupData.confirmPassword}
                      onChange={e => setSignupData({ ...signupData, confirmPassword: e.target.value })} />
                  </div>
                </div>

                <button type="submit" className="w-full py-3.5 bg-red-500 hover:bg-red-600 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-red-500/20 transition flex items-center justify-center gap-2">
                  Continue to Plan Selection <ChevronRight className="w-4 h-4" />
                </button>
              </form>

              <div className="text-center">
                <span className="text-xs text-slate-400">Already have an account? </span>
                <button onClick={() => { setMode('login'); setAuthError(''); }}
                  className="text-xs text-red-400 font-bold hover:text-red-300 transition">
                  Sign in →
                </button>
              </div>
            </motion.div>
          )}

          {/* ──────────── PLAN SELECTION ──────────── */}
          {mode === 'plan' && (
            <motion.div
              key="plan"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              className="space-y-6"
            >
              <div className="text-center space-y-2">
                <div className="w-14 h-14 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mx-auto">
                  <Sparkles className="w-6 h-6 text-red-400" />
                </div>
                <h2 className="text-2xl font-black text-white">Choose Your Plan</h2>
                <p className="text-sm text-slate-400">Step 2 of 2 — Activate your restaurant subscription</p>
              </div>

              <div className="grid grid-cols-1 gap-5">
                {PLANS.map(plan => (
                  <button key={plan.id} onClick={() => handlePlanSelect(plan)}
                    className={`relative p-6 rounded-3xl border-2 text-left transition-all hover:scale-[1.02] ${plan.color} ${plan.badge ? 'bg-gradient-to-b from-red-950/30 to-slate-900' : 'bg-slate-900/60'}`}>
                    {plan.badge && (
                      <span className="absolute -top-3 left-6 bg-red-500 text-white text-[10px] font-extrabold px-3 py-0.5 rounded-full uppercase tracking-wider">
                        {plan.badge}
                      </span>
                    )}
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-black text-white">{plan.name}</h3>
                        <div className="flex items-baseline gap-1 mt-1">
                          <span className="text-3xl font-black text-white">₹{plan.price}</span>
                          <span className="text-slate-400 text-xs">/ {plan.period}</span>
                        </div>
                      </div>
                      <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center ${plan.badge ? 'bg-red-500/20 border-red-500/30' : 'bg-white/5 border-white/10'}`}>
                        <ChevronRight className={`w-5 h-5 ${plan.badge ? 'text-red-400' : 'text-slate-400'}`} />
                      </div>
                    </div>
                    <ul className="mt-4 space-y-2">
                      {plan.features.map((f, i) => (
                        <li key={i} className="flex items-center gap-2 text-xs">
                          <Check className={`w-3.5 h-3.5 flex-shrink-0 ${plan.badge ? 'text-red-400' : 'text-green-400'}`} />
                          <span className="text-slate-300">{f}</span>
                        </li>
                      ))}
                    </ul>
                    {plan.price === 0 && (
                      <div className="mt-3 text-[10px] text-slate-500 font-medium">✓ No credit card required</div>
                    )}
                  </button>
                ))}
              </div>

              <button onClick={() => { setMode('signup'); setAuthError(''); }}
                className="w-full flex items-center justify-center gap-1.5 text-xs text-slate-400 hover:text-white transition">
                <ArrowLeft className="w-3.5 h-3.5" /> Back to account details
              </button>
            </motion.div>
          )}

          {/* ──────────── PAYMENT ──────────── */}
          {mode === 'payment' && (
            <motion.div
              key="payment"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              className="bg-slate-900 border border-white/5 rounded-3xl p-8 shadow-2xl space-y-6"
            >
              <div className="flex items-center gap-3">
                <button onClick={() => setMode('plan')}
                  className="p-2 bg-slate-800 border border-white/5 rounded-xl hover:bg-slate-700 text-slate-300 transition">
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <h2 className="text-xl font-black text-white">Payment Details</h2>
                  <p className="text-xs text-slate-400">Secure checkout — Premium Pro ₹1/month</p>
                </div>
              </div>

              {/* Plan Summary */}
              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex justify-between items-center">
                <div>
                  <p className="text-xs text-slate-400">Selected Plan</p>
                  <p className="text-white font-black">{selectedPlan?.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400">Amount Due</p>
                  <p className="text-2xl font-black text-red-400">₹{selectedPlan?.price}</p>
                </div>
              </div>

              <form onSubmit={handlePayment} className="space-y-6">
                <div className="bg-slate-950/80 border border-white/5 rounded-2xl p-6 space-y-4 text-center">
                  <div className="mx-auto w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                    <Shield className="w-6 h-6 text-blue-400" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-extrabold text-white">Razorpay Secure Payment Gateway</h3>
                    <p className="text-[11px] text-slate-400">
                      Pay securely using UPI (GPay, PhonePe, Paytm), Cards, Net Banking, or popular Wallets.
                    </p>
                  </div>
                  <div className="flex justify-center gap-3 opacity-75">
                    <img src="https://img.icons8.com/color/48/upi.png" className="h-6 object-contain animate-pulse" alt="UPI" />
                    <img src="https://img.icons8.com/color/48/visa.png" className="h-6 object-contain" alt="Visa" />
                    <img src="https://img.icons8.com/color/48/mastercard.png" className="h-6 object-contain" alt="Mastercard" />
                  </div>
                </div>

                <button type="submit" disabled={paymentProcessing}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-blue-500/25 transition flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  <CreditCard className="w-4 h-4" />
                  Pay ₹{selectedPlan?.price} Securely via Razorpay
                </button>

                <div className="flex items-center justify-center gap-2 text-[10px] text-slate-500">
                  <Shield className="w-3 h-3" />
                  256-bit SSL secured payment powered by Razorpay
                </div>
              </form>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </motion.div>
  );
}
