import React from 'react';
import { motion } from 'framer-motion';
import { 
  Sparkles, CheckCircle2, ArrowRight, Shield, Zap, Clock, 
  HeadphonesIcon, TrendingUp, Users, IndianRupee, Wifi, 
  BarChart3, Lock, Smartphone, RefreshCw, Star, Heart,
  ChevronRight, Globe, ServerCog, Utensils
} from 'lucide-react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

export default function ResourcesPage({ setCurrentView, restaurants = [], orders = [] }) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } }
  };

  const benefits = [
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Go Live in 10 Minutes",
      description: "No complex setup. Just sign up, add your menu items, generate QR codes, and start receiving orders instantly. Zero technical knowledge required.",
      color: "text-amber-500",
      bg: "bg-amber-50"
    },
    {
      icon: <IndianRupee className="w-6 h-6" />,
      title: "Zero Commission Fees",
      description: "Unlike aggregators that eat 25–30% of every order, we charge zero commission. Every rupee your customer pays goes directly to your account. Only gateway charges apply (we only take 2.9% for gateway charges).",
      color: "text-emerald-500",
      bg: "bg-emerald-50"
    },
    {
      icon: <Smartphone className="w-6 h-6" />,
      title: "No App Download Needed",
      description: "Your customers simply scan a QR code and browse your full menu on their phone browser. No app installs, no friction — just instant ordering.",
      color: "text-blue-500",
      bg: "bg-blue-50"
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: "Real-Time Analytics Dashboard",
      description: "Track daily revenue, best-selling dishes, peak hours, and customer trends from your owner dashboard. Make smarter business decisions with live data.",
      color: "text-violet-500",
      bg: "bg-violet-50"
    },
    {
      icon: <Lock className="w-6 h-6" />,
      title: "Secure UPI & Card Payments",
      description: "Powered by Razorpay, all transactions are PCI-DSS compliant and protected with bank-grade encryption. Payouts settle directly to your bank account.",
      color: "text-red-500",
      bg: "bg-red-50"
    },
    {
      icon: <RefreshCw className="w-6 h-6" />,
      title: "Live Kitchen Display (KDS)",
      description: "Orders appear on a real-time Kitchen TV screen with dish names and table numbers. Your chef knows exactly what to cook — no paper tickets, no confusion.",
      color: "text-teal-500",
      bg: "bg-teal-50"
    }
  ];

  const supportPillars = [
    {
      icon: <HeadphonesIcon className="w-7 h-7 text-red-500" />,
      title: "Dedicated Account Manager",
      description: "Every restaurant gets a personal point of contact who helps with onboarding, menu setup, staff training, and ongoing optimization."
    },
    {
      icon: <Clock className="w-7 h-7 text-red-500" />,
      title: "24/7 Priority Support",
      description: "Reach us anytime via WhatsApp, email, or in-app chat. Critical issues during peak dinner hours? We respond within 15 minutes, guaranteed."
    },
    {
      icon: <ServerCog className="w-7 h-7 text-red-500" />,
      title: "99.9% Uptime SLA",
      description: "Our cloud infrastructure is built for reliability. Auto-scaling servers, CDN-backed menus, and redundant payment gateways ensure you never miss an order."
    },
    {
      icon: <Globe className="w-7 h-7 text-red-500" />,
      title: "Free Menu Digitization",
      description: "Send us your existing PDF or paper menu — our team will digitize it completely free, with images, categories, pricing, and add-ons configured for you."
    }
  ];

  const stats = [
    { value: restaurants?.length || 0, label: "Restaurants Powered", icon: <Users className="w-5 h-5" /> },
    { value: (restaurants?.length || 0) * 150, label: "Transactions in a day", icon: <TrendingUp className="w-5 h-5" /> },
    { value: "99.9%", label: "Platform Uptime", icon: <Shield className="w-5 h-5" /> },
    { value: "<15min", label: "Support Response", icon: <Clock className="w-5 h-5" /> }
  ];

  const vsAggregators = [
    { feature: "Commission per order", us: "2.9% (Lowest in India)", them: "25–30%" },
    { feature: "Customer data ownership", us: "100% yours", them: "They own it" },
    { feature: "Direct bank payouts", us: "✓ Same day", them: "7–14 day cycles" },
    { feature: "Custom branding & logo", us: "✓ Fully branded", them: "Their branding" },
    { feature: "QR dine-in ordering", us: "✓ Built-in", them: "Not available" },
    { feature: "Kitchen display (TV)", us: "✓ Included", them: "Extra cost" },
    { feature: "App download required", us: "No", them: "Yes, for customers" },
    { feature: "Monthly platform fee", us: "Affordable SaaS", them: "High commissions" }
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-6xl mx-auto space-y-20 pb-16 text-slate-800"
    >
      {/* ── Hero Header ──────────────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="text-center space-y-5 py-8">
        <div className="w-48 h-48 mx-auto flex items-center justify-center">
          <DotLottieReact
            src="https://lottie.host/0dab9551-1066-4a30-b9b6-08d50936261b/Rld89y0OGL.lottie"
            loop
            autoplay
          />
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
          Built for Restaurants,<br />
          <span className="text-gradient">Not Against Them</span>
        </h1>
        <p className="text-base text-slate-500 max-w-2xl mx-auto font-light leading-relaxed">
          Unlike food aggregators that charge 25–30% per order and hide your customer data, 
          Orderin gives you a direct digital storefront with zero commissions, 
          full branding control, and instant bank payouts.
        </p>
      </motion.div>

      {/* ── Stats Counter Bar ──────────────────────────────────────── */}
      <motion.div 
        variants={itemVariants}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {stats.map((stat, idx) => (
          <motion.div
            key={idx}
            variants={itemVariants}
            className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm text-center space-y-2 hover:shadow-md hover:border-slate-200 transition-all duration-300"
          >
            <div className="w-10 h-10 rounded-2xl bg-red-50 flex items-center justify-center text-red-500 mx-auto">
              {stat.icon}
            </div>
            <h3 className="text-2xl md:text-3xl font-black text-slate-900">{stat.value}</h3>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Key Benefits Grid ─────────────────────────────────────── */}
      <div className="space-y-8">
        <motion.div variants={itemVariants} className="text-center space-y-2">
          <h2 className="text-3xl font-black text-slate-900">Everything You Need to Grow</h2>
          <p className="text-sm text-slate-500 font-light max-w-xl mx-auto">
            Powerful tools designed specifically for Indian restaurants, cafes, and food courts.
          </p>
        </motion.div>

        <motion.div 
          variants={containerVariants}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {benefits.map((benefit, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ y: -6 }}
              className="bg-white rounded-3xl p-7 border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all duration-300 space-y-4"
            >
              <div className={`${benefit.bg} w-12 h-12 rounded-2xl flex items-center justify-center ${benefit.color}`}>
                {benefit.icon}
              </div>
              <h3 className="text-lg font-bold text-slate-900">{benefit.title}</h3>
              <p className="text-slate-500 text-xs leading-relaxed font-light">{benefit.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* ── Orderin vs Aggregators Comparison ─────────────────────── */}
      <div className="space-y-8">
        <motion.div variants={itemVariants} className="text-center space-y-2">
          <h2 className="text-3xl font-black text-slate-900">Orderin vs Food Aggregators</h2>
          <p className="text-sm text-slate-500 font-light max-w-xl mx-auto">
            See why hundreds of restaurant owners are switching from Swiggy/Zomato to their own branded ordering system.
          </p>
        </motion.div>

        <motion.div 
          variants={itemVariants}
          className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden"
        >
          {/* Table Header */}
          <div className="grid grid-cols-3 bg-slate-900 text-white text-xs font-bold uppercase tracking-wider">
            <div className="px-6 py-4">Feature</div>
            <div className="px-6 py-4 text-center bg-red-600">
              <span className="flex items-center justify-center gap-1.5">
                <Star className="w-3.5 h-3.5" /> Orderin
              </span>
            </div>
            <div className="px-6 py-4 text-center text-slate-400">Aggregators</div>
          </div>

          {/* Table Rows */}
          {vsAggregators.map((row, idx) => (
            <div 
              key={idx} 
              className={`grid grid-cols-3 text-xs ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'} ${idx < vsAggregators.length - 1 ? 'border-b border-slate-100' : ''}`}
            >
              <div className="px-6 py-4 font-semibold text-slate-700">{row.feature}</div>
              <div className="px-6 py-4 text-center font-bold text-emerald-600 bg-emerald-50/30">{row.us}</div>
              <div className="px-6 py-4 text-center text-slate-400 font-medium">{row.them}</div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* ── Our Support & Service ──────────────────────────────────── */}
      <div className="space-y-8">
        <motion.div variants={itemVariants} className="text-center space-y-2">
          <h2 className="text-3xl font-black text-slate-900">World-Class Support</h2>
          <p className="text-sm text-slate-500 font-light max-w-xl mx-auto">
            We don't just sell software — we partner with you. Our team ensures you succeed from day one.
          </p>
        </motion.div>

        <motion.div 
          variants={containerVariants}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {supportPillars.map((pillar, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ y: -4 }}
              className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all duration-300 flex gap-5"
            >
              <div className="bg-red-50 w-14 h-14 rounded-2xl flex items-center justify-center shrink-0">
                {pillar.icon}
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-slate-900">{pillar.title}</h3>
                <p className="text-slate-500 text-xs leading-relaxed font-light">{pillar.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* ── Testimonial / Trust Banner ─────────────────────────────── */}
      <motion.div 
        variants={itemVariants}
        className="bg-slate-900 text-white rounded-3xl p-8 md:p-12 relative overflow-hidden shadow-xl"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 via-transparent to-red-500/10 z-0"></div>
        <div className="relative z-10 max-w-3xl mx-auto text-center space-y-6">
          <div className="flex justify-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-5 h-5 text-amber-400 fill-amber-400" />
            ))}
          </div>
          <p className="text-lg md:text-xl font-medium italic text-slate-200">
            "We were paying ₹1.2 lakh per month in Swiggy commissions. After switching to Orderin, 
            our direct orders grew 4x and we kept 100% of the revenue. The QR system paid for itself in 3 days."
          </p>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-white">Restaurant Owner, Hyderabad</h4>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Multi-Outlet QSR Chain</p>
          </div>
        </div>
      </motion.div>

      {/* ── What's Included Free ───────────────────────────────────── */}
      <motion.div variants={itemVariants} className="space-y-6">
        <h2 className="text-2xl font-black text-slate-900 text-center">Everything Included — No Hidden Costs</h2>
        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-8">
            {[
              "Unlimited menu items & categories",
              "QR code generator for every table",
              "Live kitchen display (Chef TV)",
              "Customer order tracking page",
              "Owner analytics dashboard",
              "Razorpay payment integration",
              "WhatsApp order notifications",
              "Custom restaurant branding",
              "Multi-table dine-in support",
              "Coupon & discount management",
              "GST & tax configuration",
              "Free menu digitization support"
            ].map((feature, idx) => (
              <div key={idx} className="flex items-center gap-2.5 text-xs text-slate-700 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                {feature}
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── CTA Section ───────────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="text-center space-y-4 pt-4">
        <h2 className="text-2xl font-black text-slate-900">Ready to Take Control?</h2>
        <p className="text-sm text-slate-500 font-light max-w-lg mx-auto">
          Join hundreds of restaurants who stopped paying commissions and started building their own brand.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <button
            onClick={() => setCurrentView('order')}
            className="inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-7 py-3.5 rounded-xl shadow-md transition-all duration-300 hover:scale-[1.02]"
          >
            Let's Start
            <Utensils className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
