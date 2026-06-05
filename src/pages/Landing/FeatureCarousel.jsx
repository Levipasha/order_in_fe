import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { QrCode, Smartphone, ChefHat, Calendar, Navigation } from "lucide-react";
import slideImage from "./Untitled design (5).png";
import slideImageTwo from "./Untitled design (4).png";
import slideImageThree from "./Gemini_Generated_Image_2evpxz2evpxz2evp.png";
import slideImageFour from "./Gemini_Generated_Image_it848kit848kit84.png";
import slideImageFive from "./Gemini_Generated_Image_w7ket2w7ket2w7ke.png";

const FEATURES = [
  {
    id: "sustainable",
    label: "QR-Based Tables",
    icon: QrCode,
    image: slideImage,
    description: "Scan the QR and order food. It gets delivered straight to the table you ordered from.",
  },
  {
    id: "community",
    label: "Chef Direct",
    icon: ChefHat,
    image: slideImageTwo,
    description: "Let the chef receive your order directly for instant preparation.",
  },
  {
    id: "easy-menu",
    label: "Easy Menu",
    icon: Smartphone,
    image: slideImageThree,
    description: "Access the digital menu on your phone and order directly without needing a waiter.",
  },
  {
    id: "schedule-order",
    label: "Schedule Order",
    icon: Calendar,
    image: slideImageFour,
    description: "You can schedule your order and book.",
  },
  {
    id: "route-order",
    label: "Route Order",
    icon: Navigation,
    image: slideImageFive,
    description: "Order food while travelling and pick it up on your route without waiting.",
  },
];

const AUTO_PLAY_INTERVAL = 3000;

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

export function FeatureCarousel() {
  const [step, setStep] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const currentIndex =
    ((step % FEATURES.length) + FEATURES.length) % FEATURES.length;

  const nextStep = useCallback(() => {
    setStep((prev) => prev + 1);
  }, []);

  const handleChipClick = (index) => {
    const diff = (index - currentIndex + FEATURES.length) % FEATURES.length;
    if (diff > 0) setStep((s) => s + diff);
  };

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(nextStep, AUTO_PLAY_INTERVAL);
    return () => clearInterval(interval);
  }, [nextStep, isPaused]);

  const getCardStatus = (index) => {
    const diff = index - currentIndex;
    const len = FEATURES.length;

    let normalizedDiff = diff;
    if (diff > len / 2) normalizedDiff -= len;
    if (diff < -len / 2) normalizedDiff += len;

    if (normalizedDiff === 0) return "active";
    if (normalizedDiff === -1) return "prev";
    if (normalizedDiff === 1) return "next";
    return "hidden";
  };

  return (
    <div className="w-full max-w-7xl mx-auto md:p-8">
      <div className="relative overflow-hidden rounded-[2.5rem] lg:rounded-[4rem] flex flex-col min-h-[600px] lg:min-h-[680px] border border-slate-200/60 shadow-lg bg-white">

        {/* Merged header: feature tabs (no blue sidebar) */}
        <div className="w-full px-6 md:px-10 pt-8 md:pt-10 pb-4 md:pb-6 border-b border-slate-100">
          <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4">
            {FEATURES.map((feature, index) => {
              const isActive = index === currentIndex;
              const IconComponent = feature.icon;

              return (
                <button
                  key={feature.id}
                  onClick={() => handleChipClick(index)}
                  onMouseEnter={() => setIsPaused(true)}
                  onMouseLeave={() => setIsPaused(false)}
                  className={cn(
                    "flex items-center gap-2.5 px-5 md:px-7 py-3 md:py-3.5 rounded-full transition-all duration-500 text-left border cursor-pointer",
                    isActive
                      ? "bg-slate-900 text-white border-slate-900 shadow-md"
                      : "bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-800"
                  )}
                >
                  <IconComponent
                    size={18}
                    strokeWidth={2}
                    className={isActive ? "text-red-400" : "text-slate-400"}
                  />
                  <span className="font-semibold text-xs md:text-sm tracking-tight whitespace-nowrap uppercase">
                    {feature.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Carousel — same white surface */}
        <div className="flex-1 relative bg-white flex items-center justify-center py-12 md:py-16 px-6 md:px-12 overflow-hidden">
          <div className="relative w-full max-w-[420px] aspect-[4/5] flex items-center justify-center">
            {FEATURES.map((feature, index) => {
              const status = getCardStatus(index);
              const isActive = status === "active";
              const isPrev = status === "prev";
              const isNext = status === "next";

              return (
                <motion.div
                  key={feature.id}
                  initial={false}
                  animate={{
                    x: isActive ? 0 : isPrev ? -100 : isNext ? 100 : 0,
                    scale: isActive ? 1 : isPrev || isNext ? 0.85 : 0.7,
                    opacity: isActive ? 1 : isPrev || isNext ? 0.4 : 0,
                    rotate: isPrev ? -3 : isNext ? 3 : 0,
                    zIndex: isActive ? 20 : isPrev || isNext ? 10 : 0,
                    pointerEvents: isActive ? "auto" : "none",
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 260,
                    damping: 25,
                    mass: 0.8,
                  }}
                  className="absolute inset-0 rounded-[2rem] md:rounded-[2.8rem] overflow-hidden bg-white shadow-xl origin-center"
                >
                  <img
                    src={feature.image}
                    alt={feature.label}
                    className={cn(
                      "w-full h-full object-cover transition-all duration-700",
                      isActive
                        ? "grayscale-0 blur-0"
                        : "grayscale blur-[2px] brightness-75"
                    )}
                  />

                  <AnimatePresence>
                    {isActive && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute inset-x-0 bottom-0 p-10 pt-32 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end pointer-events-none"
                      >
                        <div className="bg-white text-slate-800 px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-[0.2em] w-fit shadow-lg mb-3 border border-slate-200">
                          {index + 1} • {feature.label}
                        </div>
                        <p className="text-white font-semibold text-xl md:text-2xl leading-tight drop-shadow-md tracking-tight">
                          {feature.description}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div
                    className={cn(
                      "absolute top-8 left-8 flex items-center gap-3 transition-opacity duration-300",
                      isActive ? "opacity-100" : "opacity-0"
                    )}
                  >
                    <div className="w-2 h-2 rounded-full bg-white shadow-[0_0_10px_white]" />
                    <span className="text-white/80 text-[10px] font-bold uppercase tracking-[0.3em] font-mono">
                      Live Session
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}

export default FeatureCarousel;
