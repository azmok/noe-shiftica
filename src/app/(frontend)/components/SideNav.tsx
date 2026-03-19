"use client";

import React, { useEffect, useState } from "react";

const navItems = [
  { id: "concept", label: "Concept" },
  { id: "how-it-works", label: "How it works" },
  { id: "pricing", label: "Pricing" },
  { id: "contact", label: "Contact" },
];

export function SideNav() {
  const [activeSegment, setActiveSegment] = useState("");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSegment(entry.target.id);
          }
        });
      },
      { threshold: 0.2, rootMargin: "-20% 0px -20% 0px" }
    );

    navItems.forEach((item) => {
      const element = document.getElementById(item.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  const handleClick = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <nav className="fixed right-8 top-1/2 -translate-y-1/2 z-50 hidden md:flex flex-col gap-8 items-center pointer-events-none">
      {navItems.map((item) => {
        const isActive = activeSegment === item.id;
        return (
          <div
            key={item.id}
            className="group flex flex-row items-center cursor-pointer pointer-events-auto"
            onClick={() => handleClick(item.id)}
          >
            {/* Label Text */}
            <span
              className={`
                mr-4 text-[10px] tracking-widest font-medium uppercase
                [writing-mode:vertical-rl] rotate-180
                transition-all duration-300 ease-in-out
                ${isActive 
                  ? "text-white opacity-100" 
                  : "text-white/40 opacity-0 group-hover:opacity-100"
                }
              `}
            >
              {item.label}
            </span>
            
            {/* Dot Indicator */}
            <div
              className={`
                w-2 h-2 rounded-full transition-all duration-300 ease-in-out
                ${isActive 
                  ? "bg-primary scale-125 shadow-[0_0_10px_#CCDD00]" 
                  : "bg-white/30 scale-100 hover:bg-white/60"
                }
              `}
            />
          </div>
        );
      })}
    </nav>
  );
}
