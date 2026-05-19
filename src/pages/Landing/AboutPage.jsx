import React from 'react';
import { motion } from 'framer-motion';
import { 
  Building2, Rocket, Target, Cpu, 
  Users, CreditCard, RefreshCw, BarChart3, 
  MapPin, CheckCircle2, ChevronRight, ArrowRight
} from 'lucide-react';

export default function AboutPage({ setCurrentView }) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } }
  };

  const ecosystemFeatures = [
    {
      icon: <Cpu className="w-6 h-6 text-red-500" />,
      title: "POS Management",
      desc: "An intuitive Point of Sale system running smoothly on desktops, tablets, or mobiles. Manage menus, tables, and bills with zero training required."
    },
    {
      icon: <RefreshCw className="w-6 h-6 text-red-500" />,
      title: "Order Management",
      desc: "Unify dine-in, takeaway, and delivery orders. Live tracking and status updates keep your kitchen and customers perfectly in sync."
    },
    {
      icon: <Users className="w-6 h-6 text-red-500" />,
      title: "Customer Handling",
      desc: "Build strong loyalty. Store preferences, run digital coupons, and send custom alerts to keep your patrons coming back."
    },
    {
      icon: <CreditCard className="w-6 h-6 text-red-500" />,
      title: "Payment Integration",
      desc: "Collect payments seamlessly via UPI, Cards, and Netbanking with secure integrations including Cashfree and Razorpay."
    },
    {
      icon: <ArrowRight className="w-6 h-6 text-red-500" />,
      title: "Vendor Settlements",
      desc: "Automated splits and settlements for multi-vendor marketplaces. Clear, rule-based direct payouts with complete transparency."
    },
    {
      icon: <BarChart3 className="w-6 h-6 text-red-500" />,
      title: "Business Analytics",
      desc: "Deep insights into sales trends, busy hours, top-selling dishes, and financial health to drive strategic growth."
    }
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-6xl mx-auto space-y-16 pb-12 text-slate-800"
    >
      {/* Hero Header */}
      <motion.div variants={itemVariants} className="text-center space-y-4 py-8">
        <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-600 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase">
          <Building2 className="w-4 h-4 text-red-500" />
          Who We Are
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
          Empowering Local Merchants With <span className="text-gradient">Next-Gen Tech</span>
        </h1>
        <p className="text-base text-slate-500 max-w-2xl mx-auto font-light leading-relaxed">
          SkyWeb IT Solutions Private Limited is a Hyderabad-based technology startup. We build modern, robust, and intuitive SaaS products that digitize, simplify, and accelerate retail and dining operations.
        </p>
      </motion.div>

      {/* Vision & Mission */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300">
          <div className="absolute top-0 left-0 w-2 h-full bg-red-500"></div>
          <div className="space-y-4">
            <div className="bg-red-50 w-12 h-12 rounded-2xl flex items-center justify-center">
              <Rocket className="w-6 h-6 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Our Vision</h2>
            <p className="text-slate-500 text-sm leading-relaxed">
              To be the leading technological backbone for local commerce across India, building reliable ecosystem solutions that bridge the gap between offline merchants and the digital-first customer base.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300">
          <div className="absolute top-0 left-0 w-2 h-full bg-slate-800"></div>
          <div className="space-y-4">
            <div className="bg-slate-100 w-12 h-12 rounded-2xl flex items-center justify-center">
              <Target className="w-6 h-6 text-slate-800" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Our Mission</h2>
            <p className="text-slate-500 text-sm leading-relaxed">
              To provide cafes, restaurants, local grocery stores, and vendors with state-of-the-art POS software, online ordering gateways, instant payouts, and rich analytics that levels the playing field against corporate giants.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Ecosystem Title */}
      <motion.div variants={itemVariants} className="space-y-4 text-center">
        <h2 className="text-3xl font-bold text-slate-900">The SkyWeb SaaS Ecosystem</h2>
        <p className="text-slate-500 text-sm max-w-xl mx-auto">
          We bring everything required to run a modern storefront into a single unified cloud portal.
        </p>
      </motion.div>

      {/* Ecosystem Cards */}
      <motion.div 
        variants={containerVariants}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {ecosystemFeatures.map((feat, index) => (
          <motion.div
            key={index}
            variants={itemVariants}
            whileHover={{ y: -5 }}
            className="bg-white rounded-3xl p-6 border border-slate-100 hover:border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="bg-red-500/5 w-12 h-12 rounded-2xl flex items-center justify-center">
                {feat.icon}
              </div>
              <h3 className="text-lg font-bold text-slate-900">{feat.title}</h3>
              <p className="text-slate-500 text-xs leading-relaxed">{feat.desc}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Why Choose Us */}
      <motion.div 
        variants={itemVariants}
        className="bg-slate-900 text-white rounded-3xl p-8 md:p-12 relative overflow-hidden shadow-xl"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 via-transparent to-red-500/10 z-0"></div>
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="space-y-6">
            <h2 className="text-3xl font-black tracking-tight">Why Hundreds of Retailers Choose SkyWeb</h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              We design our applications from the ground up to solve daily bottlenecks. No complex server maintenance, no hidden billing costs—just clean, reliable, and hyper-fast software.
            </p>
            <div className="space-y-3.5">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-red-500 shrink-0" />
                <span className="text-xs text-slate-200">100% cloud-synced database with offline capabilities</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-red-500 shrink-0" />
                <span className="text-xs text-slate-200">Fully complaint with Indian digital retail and payment policies</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-red-500 shrink-0" />
                <span className="text-xs text-slate-200">Secured with enterprise-grade SSL and database encryption</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-red-500 shrink-0" />
                <span className="text-xs text-slate-200">24/7 dedicated local support for onboarding and setup</span>
              </div>
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-white/10">
              <MapPin className="w-5 h-5 text-red-400" />
              <div>
                <h4 className="text-sm font-bold text-white">Hyderabad Tech Center</h4>
                <p className="text-[11px] text-slate-400">Our Main Startup Office</p>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Being situated in India's major tech hub Hyderabad, Telangana, we have access to world-class engineering talent, enabling us to continuously push high-performance updates to our partners daily.
            </p>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">SkyWeb IT Solutions Pvt. Ltd.</span>
              <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full font-bold uppercase tracking-wider text-[9px] border border-red-500/30">
                Active Startup
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* CTA Button */}
      <motion.div variants={itemVariants} className="text-center pt-4">
        <button
          onClick={() => setCurrentView('landing')}
          className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-6 py-3.5 rounded-xl shadow-md transition-all duration-300 hover:scale-[1.02]"
        >
          Explore Our Marketplace Partners
          <ChevronRight className="w-4 h-4" />
        </button>
      </motion.div>
    </motion.div>
  );
}
