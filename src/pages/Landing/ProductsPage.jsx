import React from 'react';
import { motion } from 'framer-motion';
import { 
  QrCode, Keyboard, Users, Monitor, Sparkles, 
  ChevronRight, CheckCircle2, Smartphone, ShieldCheck, Zap
} from 'lucide-react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

export default function ProductsPage({ setCurrentView }) {
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

  const products = [
    {
      icon: <QrCode className="w-6 h-6 text-red-500" />,
      title: "Smart QR Code Ordering",
      tagline: "Contactless Dining Reimagined",
      description: "Allow your customers to scan a table QR code, browse a gorgeous multilingual menu, customize items with add-ons, and pay instantly via UPI or cards. No app download needed.",
      features: ["Instant table mapping", "Self-service checkout", "Real-time cart updates"]
    },
    {
      icon: <Keyboard className="w-6 h-6 text-red-500" />,
      title: "Cloud POS Billing Hub",
      tagline: "Ultra-Fast Order Management",
      description: "An intuitive dashboard for servers and cashiers to process dine-in, takeaway, and delivery orders. Works seamlessly on tablets, smartphones, and desktop computers.",
      features: ["Kitchen Display System (KDS)", "Split billing support", "Offline sync technology"]
    },
    {
      icon: <Users className="w-6 h-6 text-red-500" />,
      title: "Multi-Vendor Marketplace",
      tagline: "Unified Aggregator Portal",
      description: "Host multiple restaurant brands on a single unified platform. Automate payment splits, track vendor performance, and orchestrate commissions cleanly.",
      features: ["Automatic escrow payouts", "Vendor-specific panels", "Aggregated reports"]
    },
    {
      icon: <Monitor className="w-6 h-6 text-red-500" />,
      title: "Lobby Queue TV Display",
      tagline: "Engage Waiting Patrons",
      description: "Display live order preparation status on any Smart TV or monitor in your lobby. Reduce perceived wait times and organize takeaways systematically.",
      features: ["Ready & Preparing columns", "Audio chime alerts", "Fully customizable layout"]
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
        <div className="w-48 h-48 mx-auto flex items-center justify-center">
          <DotLottieReact
            src="https://lottie.host/2b237f75-722d-40a7-b8ac-df7221b2790d/et9XsTYVpT.lottie"
            loop
            autoplay
          />
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
          Next-Gen Platform for <span className="text-gradient">Modern Food Brands</span>
        </h1>
        <p className="text-base text-slate-500 max-w-2xl mx-auto font-light leading-relaxed">
          From self-service QR codes to centralized admin dashboards and live queue displays, we build high-performance tools that elevate customer experience and boost operational efficiency.
        </p>
      </motion.div>

      {/* Product List Grid */}
      <motion.div 
        variants={containerVariants}
        className="grid grid-cols-1 md:grid-cols-2 gap-8"
      >
        {products.map((prod, index) => (
          <motion.div
            key={index}
            variants={itemVariants}
            whileHover={{ y: -6 }}
            className="bg-white rounded-3xl p-8 border border-slate-100 hover:border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between"
          >
            <div className="space-y-5">
              <div className="flex justify-between items-start">
                <div className="bg-red-50 w-12 h-12 rounded-2xl flex items-center justify-center">
                  {prod.icon}
                </div>
                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full uppercase tracking-wider">
                  SaaS Core
                </span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">{prod.title}</h3>
                <p className="text-xs font-semibold text-red-500 mt-1">{prod.tagline}</p>
              </div>
              <p className="text-slate-500 text-xs leading-relaxed">{prod.description}</p>
              
              <ul className="space-y-2 pt-2 border-t border-slate-50">
                {prod.features.map((feat, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    {feat}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Key Architectural Highlights */}
      <motion.div 
        variants={itemVariants}
        className="bg-slate-900 text-white rounded-3xl p-8 md:p-12 relative overflow-hidden shadow-xl"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 via-transparent to-red-500/10 z-0"></div>
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
          <div className="space-y-3">
            <div className="mx-auto md:mx-0 bg-red-500/10 w-12 h-12 rounded-2xl flex items-center justify-center border border-red-500/20">
              <Smartphone className="w-6 h-6 text-red-400" />
            </div>
            <h4 className="text-base font-bold text-white">Mobile-First Architecture</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Designed explicitly to run beautifully on all mobile phones and web browsers, maximizing guest engagement rates.
            </p>
          </div>
          <div className="space-y-3">
            <div className="mx-auto md:mx-0 bg-red-500/10 w-12 h-12 rounded-2xl flex items-center justify-center border border-red-500/20">
              <ShieldCheck className="w-6 h-6 text-red-400" />
            </div>
            <h4 className="text-base font-bold text-white">Secure Encrypted Payments</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              All transactions are encrypted and processed through fully verified UPI and card settlement aggregators.
            </p>
          </div>
          <div className="space-y-3">
            <div className="mx-auto md:mx-0 bg-red-500/10 w-12 h-12 rounded-2xl flex items-center justify-center border border-red-500/20">
              <Zap className="w-6 h-6 text-red-400" />
            </div>
            <h4 className="text-base font-bold text-white">Ultra-Low Latency Updates</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Live menu price shifts and order status updates sync instantly to the kitchen and guest display panels in milliseconds.
            </p>
          </div>
        </div>
      </motion.div>

      {/* CTA Button */}
      <motion.div variants={itemVariants} className="text-center pt-4">
        <button
          onClick={() => setCurrentView('contact')}
          className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-6 py-3.5 rounded-xl shadow-md transition-all duration-300 hover:scale-[1.02]"
        >
          Book a Personal Demo
          <ChevronRight className="w-4 h-4" />
        </button>
      </motion.div>
    </motion.div>
  );
}
