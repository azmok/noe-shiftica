"use client";

import React from "react";
import { Variants } from "framer-motion";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { HeroSection } from "./components/HeroSection";
import { IntroSection } from "./components/IntroSection";
import { ConceptSection } from "./components/ConceptSection";
import { HowItWorksSection } from "./components/HowItWorksSection";
import { PricingSection } from "./components/PricingSection";
import { ContactSection } from "./components/ContactSection";
import { Faq } from "./components/Faq";
import { SideNav } from "./components/SideNav";
import { useState } from "react";

export default function HomePage() {
  const [selectedBudget, setSelectedBudget] = useState<string>("");

  // Fade In variants (Shared between sections)
  const fadeIn: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number = 1) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.05, duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
    }),
  };

  return (
    <div className="min-h-screen text-white overflow-hidden relative selection:bg-[#FFFFFF] selection:text-[#050505]">
      <div
        className="fixed inset-0 w-full h-full opacity-[0.07] pointer-events-none z-20"
        style={{ background: "url('https://grainy-gradients.vercel.app/noise.svg')" }}
      />
      <Header />
      <SideNav />

      <HeroSection fadeIn={fadeIn} />
      
      <IntroSection fadeIn={fadeIn} />

      <ConceptSection fadeIn={fadeIn} />

      <HowItWorksSection fadeIn={fadeIn} />

      <PricingSection fadeIn={fadeIn} onPlanSelect={setSelectedBudget} />

      <Faq />

      <ContactSection fadeIn={fadeIn} selectedBudget={selectedBudget} />

      <Footer />
    </div>
  );
}
