"use client";

import { motion } from "framer-motion";

export default function HeroSubtitle() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="mb-6 flex flex-col gap-3 items-center lg:items-start"
    >
      {/* Card 1 */}
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
        className="bg-white/95 backdrop-blur-md px-5 md:px-6 py-3 md:py-4 rounded-2xl shadow-lg inline-flex w-fit"
      >
        <h2 className="font-serif text-[1.4rem] sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 leading-none whitespace-nowrap pr-1">
          How to Eat Right, Protect Your Health,
        </h2>
      </motion.div>

      {/* Card 2 */}
      <motion.div
        animate={{ y: [0, 6, 0] }}
        transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 0.5 }}
        className="bg-white/95 backdrop-blur-md px-4 md:px-5 py-3 md:py-4 rounded-2xl shadow-lg max-w-fit"
      >
        <h2 className="font-serif text-[1.2rem] sm:text-xl md:text-2xl lg:text-3xl font-bold italic text-gray-900 leading-none">
          and Get as Many Healthy Years Out of Your Life as Possible.
        </h2>
      </motion.div>
    </motion.div>
  );
}
