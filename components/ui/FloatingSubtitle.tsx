"use client";

import { motion } from "framer-motion";

export default function FloatingSubtitle() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="mb-12 mt-2 pb-4 relative inline-block text-center"
    >
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
        className="relative z-10"
      >
        {/* Layer 3 (Bottom Stack Card) */}
        <div className="absolute inset-x-[8%] -bottom-4 top-4 bg-white/70 backdrop-blur-md rounded-[10px] shadow-sm z-[-2] border border-gray-200/40" />
        
        {/* Layer 2 (Middle Stack Card) */}
        <div className="absolute inset-x-[4%] -bottom-2 top-2 bg-white/85 backdrop-blur-md rounded-[10px] shadow-md z-[-1] border border-gray-200/60" />

        {/* Main Card (Top Layer) */}
        <div className="bg-white/95 backdrop-blur-md px-6 py-5 rounded-[10px] shadow-lg border border-gray-200 max-w-2xl text-center">
          <p className="font-serif text-[1.1rem] sm:text-xl font-bold text-gray-900 leading-snug m-0 text-center">
            How to Eat Right, Protect Your Health, and Get as Many Healthy Years Out of Your Life as Possible.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
