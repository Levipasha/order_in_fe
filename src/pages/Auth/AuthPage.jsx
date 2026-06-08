import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import {
  Lock, Mail, User, Phone, Store, ChevronRight,
  Check, Sparkles, ArrowLeft, CreditCard, Shield, MapPin
} from 'lucide-react';
import { auth } from '../../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, signInWithRedirect } from 'firebase/auth';
import { apiRequest } from '../../utils/api';
import { SUBSCRIPTION_MONTHLY_PRICE_INR } from '../../config/subscription';

const PLANS = [
  {
    id: 'basic',
    name: 'Premium Pro',
    price: 799,
    period: 'Month',
    description: 'Try 1 Month Free, then ₹799/month',
    badge: 'Limited Offer',
    color: 'border-[#ff385c] hover:border-red-500 bg-gradient-to-b from-red-950/25 to-slate-900/95 shadow-lg shadow-red-950/5',
    features: [
      'Try 1 Month Free Trial',
      'After trial: ₹799/month',
      'Advanced glassmorphic themes',
      'Realtime order dashboard',
      'Email payout alerts',
      'Instant payout',
      'Call Support',
      'Multiple tables QR code'
    ],
  }
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
    address: '',
    pinCode: '',
    bankName: '',
    accountHolderName: '',
    accountNumber: '',
    ifscCode: '',
  });
  const [selectedPlan, setSelectedPlan] = useState(null);

  // Payment mock
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [cardData, setCardData] = useState({ cardNo: '', expiry: '', cvv: '', name: '' });

  // Customer & Restaurant splits
  const [loginType, setLoginType] = useState(null); // null | 'restaurant'
  const [tempCustomer, setTempCustomer] = useState(() => {
    const saved = sessionStorage.getItem('Orderin_temp_customer');
    if (saved) {
      sessionStorage.removeItem('Orderin_temp_customer');
      setTimeout(() => setMode('customer_phone'), 100);
      return JSON.parse(saved);
    }
    return null;
  });
  const [customerPhoneInput, setCustomerPhoneInput] = useState('');

  const handleGoogleLogin = async () => {
    setAuthError('');
    try {
      const provider = new GoogleAuthProvider();
      
      let result;
      try {
        result = await signInWithPopup(auth, provider);
      } catch (popupErr) {
        if (popupErr.code === 'auth/popup-blocked' || popupErr.code === 'auth/cancelled-popup-request' || popupErr.message?.includes('Cross-Origin-Opener-Policy')) {
          console.warn("Popup blocked or COOP violation. Falling back to redirect...");
          await signInWithRedirect(auth, provider);
          return;
        }
        throw popupErr;
      }

      const user = result.user;

      // Check if we already have their phone number saved locally
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
        setTempCustomer(loggedInUser);
        setMode('customer_phone');
      } else {
        localStorage.setItem('Orderin_customer_phone', savedPhone);
        setCurrentUser(loggedInUser);
        setCurrentView('landing');
      }
    } catch (err) {
      console.error("Google login failed:", err);
      setAuthError(err.message || 'Google Sign-In failed. Please try again.');
    }
  };

  /* ─── LOGIN ─── */
  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      let user = null;
      let token = null;

      try {
        // 1. Connect to Express/MongoDB backend API first
        const res = await apiRequest('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password })
        });

        if (res.success) {
          token = res.token;
          localStorage.setItem('Orderin_token', token);
          
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
              headers: { 'Authorization': `Bearer ${token}` }
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
        console.warn("Backend MongoDB authentication failed:", backendErr.message);
      }

      // 2. Synchronize with Firebase
      try {
        await signInWithEmailAndPassword(auth, email, password);
      } catch (fbErr) {
        // If user succeeds backend validation but is missing from Firebase, auto-register them!
        if (user && (fbErr.code === 'auth/user-not-found' || fbErr.code === 'auth/invalid-credential')) {
          try {
            await createUserWithEmailAndPassword(auth, email, password);
            console.log("Auto-registered backend user in Firebase successfully.");
          } catch (createFbErr) {
            console.warn("Firebase auto-registration failed:", createFbErr.message);
          }
        } else if (!user) {
          throw fbErr; // Reject if both backend and Firebase failed
        }
      }

      if (!user) {
        setAuthError('Invalid email or password. Please try again.');
        return;
      }

      setCurrentUser(user);
      if (user.role === 'super_admin') setCurrentView('super_admin');
      else setCurrentView('restaurant_admin');
    } catch (err) {
      console.error(err);
      
      if (err.message && err.message.includes('status 401')) {
        setAuthError('Invalid email or password. Please try again.');
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setAuthError('Invalid password. Please try again.');
      } else if (err.code === 'auth/user-not-found') {
        setAuthError('No account found with this email. Please register.');
      } else {
        setAuthError(err.message || 'Authentication failed. Please check your credentials.');
      }
    }
  };

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
    if (plan.price === 0 || plan.id === 'basic') {
      // Free trial — skip payment initially
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
      name: signupData.restaurantName || "Orderin",
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
          localStorage.setItem('Orderin_token', token);

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
                address: signupData.address,
                socialLinks: { instagram: '', facebook: '', whatsapp: signupData.phone || '' },
              },
              address: signupData.address,
              pinCode: signupData.pinCode,
              bankDetails: {
                bankName: signupData.bankName,
                accountHolderName: signupData.accountHolderName,
                accountNumber: signupData.accountNumber,
                ifscCode: signupData.ifscCode
              },
              settings: { gstPercentage: 5, deliveryCharge: 0, minimumOrderAmount: 150 },
              subscriptionPlan: plan.id,
              subscriptionExpiry: plan.id === 'free'
                ? new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString()
                : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              subscriptionActive: true
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
              subscriptionPlan: backendRest.subscriptionPlan,
              subscriptionExpiry: backendRest.subscriptionExpiry,
              subscriptionActive: backendRest.subscriptionActive,
              pinCode: backendRest.pinCode,
              bankDetails: backendRest.bankDetails
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
            address: signupData.address,
            socialLinks: { instagram: '', facebook: '', whatsapp: signupData.phone || '' },
          },
          address: signupData.address,
          pinCode: signupData.pinCode,
          bankDetails: {
            bankName: signupData.bankName,
            accountHolderName: signupData.accountHolderName,
            accountNumber: signupData.accountNumber,
            ifscCode: signupData.ifscCode
          },
          settings: { gstPercentage: 5, deliveryCharge: 0, minimumOrderAmount: 150 },
          tables: [{ tableNo: 'T1', qrCodeUrl: '' }],
          isApproved: true,
          isActive: true,
          rating: 5.0,
          subscriptionPlan: plan.id,
          subscriptionActive: true,
          subscriptionExpiry: plan.id === 'free'
            ? new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString()
            : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
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

      <div className={`w-full transition-all duration-300 ${mode === 'plan' ? 'max-w-3xl' : 'max-w-md'}`}>
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
              {loginType === null ? (
                // Split Role Selection Screen
                <div className="space-y-6">
                  <div className="text-center space-y-2">
                    <div className="w-28 h-28 mx-auto flex items-center justify-center">
                      <DotLottieReact
                        src="https://lottie.host/c5e0819e-e633-4119-93c2-0f7fad0aadc2/TetmkvA3Y4.lottie"
                        loop
                        autoplay
                      />
                    </div>
                    <h2 className="text-2xl font-black text-white">Welcome to Orderin</h2>
                    <p className="text-xs text-slate-400">Choose your account type to proceed</p>
                  </div>

                  {authError && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-xl text-center font-bold">
                      {authError}
                    </div>
                  )}

                  <div className="space-y-4">
                    {/* Customer / Diner Login Card */}
                    <button
                      onClick={handleGoogleLogin}
                      className="w-full text-left bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-white/10 hover:border-red-500/30 p-5 rounded-2xl transition hover:scale-[1.02] flex items-center gap-4 group"
                    >
                      <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-md">
                        <img src="https://img.icons8.com/color/48/google-logo.png" className="w-6 h-6" alt="Google" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-black text-white group-hover:text-red-400 transition">I am a Customer / Diner</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">Dine-in table QR, pre-order foods & check scheduled pickups</p>
                      </div>
                    </button>

                    {/* Restaurant Partner Login Card */}
                    <button
                      onClick={() => setLoginType('restaurant')}
                      className="w-full text-left bg-slate-800/50 border border-white/5 hover:border-white/10 p-5 rounded-2xl transition hover:scale-[1.02] flex items-center gap-4 group"
                    >
                      <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
                        <Store className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-black text-white group-hover:text-red-400 transition">I am a Restaurant Owner</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">Manage digital menus, tables, live dashboard & payouts</p>
                      </div>
                    </button>
                  </div>
                </div>
              ) : (
                // Restaurant Owner Email/Password Login
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <button onClick={() => { setLoginType(null); setAuthError(''); }}
                      className="p-2 bg-slate-800 border border-white/5 rounded-xl hover:bg-slate-700 text-slate-300 transition">
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div>
                      <h2 className="text-xl font-black text-white">Owner Portal</h2>
                      <p className="text-xs text-slate-400">Manage your restaurant dashboard</p>
                    </div>
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

                  <div className="text-center pt-2">
                    <span className="text-xs text-slate-400">New restaurant owner? </span>
                    <button onClick={() => { setMode('signup'); setAuthError(''); }}
                      className="text-xs text-red-400 font-bold hover:text-red-300 transition">
                      Register here →
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ──────────── CUSTOMER PHONE STEP ──────────── */}
          {mode === 'customer_phone' && (
            <motion.div
              key="customer_phone"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              className="bg-slate-900 border border-white/5 rounded-3xl p-8 shadow-2xl space-y-6"
            >
              <div className="text-center space-y-3 py-2">
                <h2 className="text-xl font-extrabold text-white">Enter the number for order confirmation</h2>
                <p className="text-xs text-slate-400">Please provide your mobile number to finalize your transaction details.</p>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                if (!customerPhoneInput) return;
                const finalizedUser = {
                  ...tempCustomer,
                  phone: customerPhoneInput
                };
                localStorage.setItem(`Orderin_phone_${tempCustomer.id}`, customerPhoneInput);
                localStorage.setItem('Orderin_customer_phone', customerPhoneInput);
                setCurrentUser(finalizedUser);
                setCurrentView('landing');
              }} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Mobile Number</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. +91 9988776655"
                    className="w-full bg-slate-800 border border-slate-700 px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-red-500 text-white"
                    value={customerPhoneInput}
                    onChange={e => setCustomerPhoneInput(e.target.value)}
                  />
                </div>
                <button type="submit" className="w-full py-3.5 bg-red-500 hover:bg-red-600 text-white font-extrabold text-sm rounded-xl shadow-lg transition">
                  Confirm & View Dashboard
                </button>
              </form>
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

                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2 space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" /> Restaurant Address
                    </label>
                    <input type="text" required placeholder="e.g. 123 Main St, Madhapur"
                      className="w-full bg-slate-800 border border-slate-700 px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-red-500 text-white"
                      value={signupData.address}
                      onChange={e => setSignupData({ ...signupData, address: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1">
                      PIN Code
                    </label>
                    <input type="text" required placeholder="e.g. 500081"
                      className="w-full bg-slate-800 border border-slate-700 px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-red-500 text-white"
                      value={signupData.pinCode}
                      onChange={e => setSignupData({ ...signupData, pinCode: e.target.value })} />
                  </div>
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

                {/* Bank Details Section */}
                <div className="pt-3 border-t border-white/5 space-y-3 text-left">
                  <h4 className="text-[11px] font-black text-slate-200 tracking-wider uppercase flex items-center gap-2">
                    <img src="https://img.icons8.com/color/48/bank.png" className="h-4 w-4 object-contain" alt="" />
                    Bank Account Details
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Bank Name</label>
                      <input type="text" required placeholder="e.g. HDFC Bank"
                        className="w-full bg-slate-800 border border-slate-700 px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-red-500 text-white"
                        value={signupData.bankName}
                        onChange={e => setSignupData({ ...signupData, bankName: e.target.value })} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Holder Name</label>
                      <input type="text" required placeholder="Account Holder Name"
                        className="w-full bg-slate-800 border border-slate-700 px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-red-500 text-white"
                        value={signupData.accountHolderName}
                        onChange={e => setSignupData({ ...signupData, accountHolderName: e.target.value })} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Account Number</label>
                      <input type="text" required placeholder="Account Number"
                        className="w-full bg-slate-800 border border-slate-700 px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-red-500 text-white"
                        value={signupData.accountNumber}
                        onChange={e => setSignupData({ ...signupData, accountNumber: e.target.value })} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">IFSC Code</label>
                      <input type="text" required placeholder="e.g. HDFC0001234"
                        className="w-full bg-slate-800 border border-slate-700 px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-red-500 text-white"
                        value={signupData.ifscCode}
                        onChange={e => setSignupData({ ...signupData, ifscCode: e.target.value })} />
                    </div>
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
              className="bg-slate-900 border border-white/5 rounded-3xl p-4 sm:p-8 shadow-2xl space-y-6 text-left"
            >
              <div className="text-center space-y-2">
                <div className="w-24 h-24 mx-auto flex items-center justify-center">
                  <DotLottieReact
                    src="https://lottie.host/903fbc08-e1df-43b2-bf40-7c90a6ef28fd/Odme2elFXQ.lottie"
                    loop
                    autoplay
                  />
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white font-sans">Choose Your Plan</h2>
                <p className="text-xs sm:text-sm text-slate-400">Step 2 of 2 — Activate your restaurant subscription</p>
              </div>

              <div className="flex justify-center max-w-sm mx-auto w-full">
                {PLANS.map(plan => (
                  <div key={plan.id} onClick={() => handlePlanSelect(plan)}
                    className={`relative p-4 sm:p-6 rounded-2xl sm:rounded-3xl border-2 text-left transition-all duration-300 hover:scale-[1.02] cursor-pointer flex flex-col justify-between h-full ${plan.color} ${plan.badge ? 'bg-gradient-to-b from-red-950/25 to-slate-900/95 shadow-lg shadow-red-950/5' : 'bg-slate-950/60'}`}>
                    
                    <div>
                      {plan.badge && (
                        <span className="absolute -top-3 left-4 sm:left-6 bg-red-500 text-white text-[8px] sm:text-[9px] font-black px-2 sm:px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                          {plan.badge}
                        </span>
                      )}
                      <div className="flex justify-between items-start gap-1">
                        <div>
                          <h3 className="text-sm sm:text-lg font-black text-white leading-tight">{plan.name}</h3>
                          {plan.description && <p className="text-[9px] sm:text-[11px] text-slate-400 mt-0.5 font-medium leading-tight">{plan.description}</p>}
                        </div>
                        <div className={`w-7 h-7 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl border flex items-center justify-center flex-shrink-0 ${plan.badge ? 'bg-red-500/20 border-red-500/30 text-red-400' : 'bg-white/5 border-white/10 text-slate-400'}`}>
                          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                      </div>
                      
                      <div className="flex items-baseline gap-0.5 sm:gap-1 mt-3 sm:mt-4">
                        <span className="text-xl sm:text-3xl font-black text-white">₹{plan.price}</span>
                        <span className="text-slate-400 text-[10px] sm:text-xs font-semibold">/ {plan.period}</span>
                      </div>
                      
                      <ul className="mt-4 sm:mt-5 space-y-2 sm:space-y-2.5">
                        {plan.features.map((f, i) => {
                          const isHighlighted = f.toLowerCase().includes('try 1 month') || f.toLowerCase().includes('free trial');
                          return (
                            <li key={i} className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs">
                              <Check className={`w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0 ${isHighlighted ? 'text-[#ccff00]' : (plan.badge ? 'text-red-400' : 'text-green-400')}`} />
                              <span className={`leading-tight ${isHighlighted ? 'text-[#ccff00] font-extrabold' : 'text-slate-300 font-medium'}`}>{f}</span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>

                    <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-white/5 space-y-2.5 sm:space-y-3">
                      {(plan.price === 0 || plan.id === 'basic') && (
                        <div className="text-[8px] sm:text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                          <span>✓</span> No credit card required
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handlePlanSelect(plan); }}
                        className="w-full py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-black text-[10px] sm:text-xs transition duration-200 cursor-pointer bg-[#ccff00] hover:bg-[#bbf000] text-slate-950 shadow shadow-[#ccff00]/15 hover:scale-[1.01]"
                      >
                        {plan.id === 'basic' ? 'Try 1 Month Free' : `Select ${plan.name}`}
                      </button>
                    </div>
                  </div>
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
              className="bg-slate-900 border border-white/5 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6"
            >
              <div className="flex items-center gap-3">
                <button onClick={() => setMode('plan')}
                  className="p-2 bg-slate-800 border border-white/5 rounded-xl hover:bg-slate-700 text-slate-300 transition">
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="text-left">
                  <h2 className="text-lg sm:text-xl font-black text-white font-sans">Payment Details</h2>
                  <p className="text-[10px] sm:text-xs text-slate-400">Secure checkout — Premium Pro ₹{SUBSCRIPTION_MONTHLY_PRICE_INR}/month</p>
                </div>
              </div>

              {/* Premium Welcome Banner */}
              <div className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/20 rounded-2xl p-4 text-left flex items-center gap-4 shadow-lg shadow-red-500/5">
                <div className="w-12 h-12 flex items-center justify-center flex-shrink-0">
                  <DotLottieReact
                    src="https://lottie.host/f2a35b07-b6fe-4835-8f14-64e3ad046e5e/K5q8Js9AeD.lottie"
                    loop
                    autoplay
                  />
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-black text-white">Hey {signupData.ownerName || 'Partner'},</h4>
                  <p className="text-xs sm:text-sm text-slate-200 mt-1 leading-relaxed font-semibold">
                    You are one step ahead to improve your business!
                  </p>
                </div>
              </div>

              {/* Plan Summary */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-white/5 rounded-2xl p-5 flex justify-between items-center shadow-lg relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-red-500/10 transition-all duration-500" />
                <div className="relative z-10 text-left">
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Selected Plan</p>
                  <p className="text-sm sm:text-base font-black text-white mt-1 flex items-center gap-2">
                    {selectedPlan?.name} 
                    <span className="bg-red-500/10 border border-red-500/20 text-red-400 text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider">Active</span>
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{selectedPlan?.description}</p>
                </div>
                <div className="relative z-10 text-right">
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Amount Due</p>
                  <p className="text-xl sm:text-2xl font-black text-red-400 mt-0.5">₹{selectedPlan?.price}</p>
                  <p className="text-[9px] text-slate-400 mt-0.5">/ {selectedPlan?.period}</p>
                </div>
              </div>

              <form onSubmit={handlePayment} className="space-y-6">
                <div className="bg-slate-950/40 border border-white/5 rounded-2xl p-6 space-y-4 text-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none" />
                  <div className="mx-auto w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shadow-md relative z-10">
                    <Shield className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="space-y-1.5 relative z-10 max-w-xs mx-auto">
                    <h3 className="text-xs sm:text-sm font-extrabold text-white">Razorpay Secure Payment Gateway</h3>
                    <p className="text-[10px] sm:text-[11px] text-slate-400 leading-relaxed font-medium">
                      Pay securely using UPI (GPay, PhonePe, Paytm), Debit/Credit Cards, Net Banking, or popular Wallets.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-3.5 relative z-10 pt-2 opacity-95">
                    <img src="https://img.icons8.com/color/48/google-pay.png" className="h-5 sm:h-6 object-contain hover:scale-110 transition duration-250" alt="Google Pay" title="Google Pay" />
                    <img src="https://uxwing.com/wp-content/themes/uxwing/download/brands-and-social-media/phonepe-icon.png" className="h-5 sm:h-6 object-contain hover:scale-110 transition duration-250" alt="PhonePe" title="PhonePe" />
                    <img src="https://img.icons8.com/color/48/paytm.png" className="h-5 sm:h-6 object-contain hover:scale-110 transition duration-250" alt="Paytm" title="Paytm" />
                    <div className="h-4 w-[1.5px] bg-white/15 mx-0.5" />
                    <img src="https://img.icons8.com/color/48/visa.png" className="h-4 sm:h-5 object-contain hover:scale-110 transition duration-250" alt="Visa" title="Visa" />
                    <img src="https://img.icons8.com/color/48/mastercard.png" className="h-4 sm:h-5 object-contain hover:scale-110 transition duration-250" alt="Mastercard" title="Mastercard" />
                    <div className="h-4 w-[1.5px] bg-white/15 mx-0.5" />
                    <img src="https://img.icons8.com/color/48/bank.png" className="h-4 sm:h-5 object-contain hover:scale-110 transition duration-250" alt="Net Banking" title="Net Banking" />
                    <img src="https://img.icons8.com/color/48/wallet.png" className="h-4 sm:h-5 object-contain hover:scale-110 transition duration-250" alt="Wallets" title="Wallets" />
                  </div>
                </div>

                <button type="submit" disabled={paymentProcessing}
                  className="w-full py-3.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-lg shadow-red-500/15 hover:shadow-red-500/25 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed transform active:scale-[0.99] cursor-pointer uppercase tracking-wider font-sans"
                >
                  <CreditCard className="w-4 h-4" />
                  Pay ₹{selectedPlan?.price} Securely via Razorpay
                </button>

                <div className="flex items-center justify-center gap-2 text-[10px] text-slate-500">
                  <Shield className="w-3 h-3 text-slate-400" />
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
