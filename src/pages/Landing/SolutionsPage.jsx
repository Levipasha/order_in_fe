import React from 'react';
import { motion } from 'framer-motion';
import { 
  UtensilsCrossed, Wine, Layers, Hotel, Sparkles, 
  ChevronRight, CheckCircle2, ArrowRight
} from 'lucide-react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

export default function SolutionsPage({ setCurrentView }) {
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

  const solutions = [
    {
      icon: <UtensilsCrossed className="w-6 h-6 text-red-500" />,
      title: "Cafes & Quick Service (QSR)",
      tagline: "Accelerate Turnover, Eliminate Queues",
      description: "Ideal for high-volume counter operations. Customers scan, choose, and pay before their order goes to the kitchen display. Reduce counter congestion by up to 45%.",
      highlights: ["Pre-paid UPI ordering", "Instant ticket printing", "Peak-hour queue management"]
    },
    {
      icon: <Wine className="w-6 h-6 text-red-500" />,
      title: "Fine Dining & Bistros",
      tagline: "Elevate Guest Experience & Table Service",
      description: "Offer guests a high-resolution, interactive menu. Support course-by-course pacing (appetizers, mains, desserts) and allow guests to summon waitstaff or request water via a single tap.",
      highlights: ["Course-by-course routing", "Digital waiter call-button", "Premium design themes"]
    },
    {
      icon: <Layers className="w-6 h-6 text-red-500" />,
      title: "Food Courts & Multi-Brands",
      tagline: "One QR Code, Multiple Kitchens",
      description: "Empower customers to order from different brands at the court in a single transaction. The system automatically splits payments, prints distinct slips, and manages settlements.",
      highlights: ["Multi-vendor order splitting", "Unified guest checkout", "Centralized admin oversight"]
    },
    {
      icon: <Hotel className="w-6 h-6 text-red-500" />,
      title: "Hotel Room Service & Resorts",
      tagline: "Seamless Dining Direct to Rooms",
      description: "Equip guest rooms with static QR codes. Guests browse the kitchen menu, input their room number, and order breakfast, snacks, or toiletries without phone wait times.",
      highlights: ["Room number validation", "Late-night menu scheduling", "Direct room-bill integration"]
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
            src="https://lottie.host/583ec54e-c652-490b-a706-ec7a57a6fe42/rOjzxMCJrr.lottie"
            loop
            autoplay
          />
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
          Tailored Operating Systems for <span className="text-gradient">Every Concept</span>
        </h1>
        <p className="text-base text-slate-500 max-w-2xl mx-auto font-light leading-relaxed">
          Whether you run a fast-paced cafe in HITEC City or a multi-brand culinary playground, our SaaS suite adapts dynamically to fit your service flows, table rules, and billing logic.
        </p>
      </motion.div>

      {/* Solutions Grid */}
      <motion.div 
        variants={containerVariants}
        className="grid grid-cols-1 md:grid-cols-2 gap-8"
      >
        {solutions.map((sol, index) => (
          <motion.div
            key={index}
            variants={itemVariants}
            whileHover={{ y: -6 }}
            className="bg-white rounded-3xl p-8 border border-slate-100 hover:border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between"
          >
            <div className="space-y-5">
              <div className="flex justify-between items-start">
                <div className="bg-red-50 w-12 h-12 rounded-2xl flex items-center justify-center">
                  {sol.icon}
                </div>
                <span className="text-[10px] font-bold text-red-600 bg-red-50 px-3 py-1 rounded-full uppercase tracking-wider">
                  Targeted
                </span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">{sol.title}</h3>
                <p className="text-xs font-semibold text-red-500 mt-1">{sol.tagline}</p>
              </div>
              <p className="text-slate-500 text-xs leading-relaxed">{sol.description}</p>
              
              <div className="space-y-2 pt-4 border-t border-slate-50">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Key Capabilities:</h4>
                <ul className="space-y-2">
                  {sol.highlights.map((feat, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      {feat}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Trust Quote / Stats Section */}
      <motion.div 
        variants={itemVariants}
        className="bg-slate-900 text-white rounded-3xl p-8 md:p-12 relative overflow-hidden shadow-xl"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 via-transparent to-red-500/10 z-0"></div>
        <div className="relative z-10 max-w-3xl mx-auto text-center space-y-6">
          <p className="text-lg md:text-xl font-medium italic text-slate-200">
            "By implementing the Room-Service QR system, we eliminated call bottlenecks and increased room-service beverage sales by 35% in our resort."
          </p>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-white">General Manager, Meadows Resort</h4>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Hospitality Partner</p>
          </div>
        </div>
      </motion.div>

      {/* CTA Button */}
      <motion.div variants={itemVariants} className="text-center pt-4">
        <button
          onClick={() => setCurrentView('contact')}
          className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-6 py-3.5 rounded-xl shadow-md transition-all duration-300 hover:scale-[1.02]"
        >
          Consult our Solutions Architects
          <ArrowRight className="w-4 h-4" />
        </button>
      </motion.div>
    </motion.div>
  );
}
