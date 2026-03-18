"use client";

import React from "react";
import dynamic from "next/dynamic";
import { motion, useScroll, useTransform, Variants } from "framer-motion";

const PastelTopology = dynamic(
  () => import("./PastelTopology").then((m) => ({ default: m.PastelTopology })),
  { ssr: false, loading: () => null }
);

interface HeroSectionProps {
  fadeIn: Variants;
}

export function HeroSection({ fadeIn }: HeroSectionProps) {
  const { scrollYProgress } = useScroll();
  const yHero = useTransform(scrollYProgress, [0, 1], [0, 300]);

  return (
    <section className="relative h-screen flex flex-col justify-center items-center text-center px-6">
      <PastelTopology />
      <motion.div
        style={{ y: yHero }}
        className="z-10 hero-container w-full"
      >
        <motion.h1
          custom={1}
          initial={false}
          animate="visible"
          variants={fadeIn}
          className="hero-h1 heading-1 oxanium-heading text-right"
        >
          Design the Shift.
        </motion.h1>
        <motion.h2
          custom={2}
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="hero-h2 heading-2 text-right"
        >
          本質を設計する。世界観を転換する。
        </motion.h2>
      </motion.div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/50"
      >
        <span className="text-xs tracking-widest uppercase">Scroll</span>
        <div className="w-[1px] h-12 bg-gradient-to-b from-white/50 to-transparent"></div>
      </motion.div>
    </section>
  );
}
