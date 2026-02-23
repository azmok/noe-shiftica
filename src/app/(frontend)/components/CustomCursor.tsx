"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import clsx from "clsx";

export function CustomCursor() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Clickable elements
      if (
        window.getComputedStyle(target).cursor === "pointer" ||
        target.tagName === "A" ||
        target.tagName === "BUTTON"
      ) {
        setIsActive(true);
      } else {
        setIsActive(false);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseover", handleMouseOver);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseover", handleMouseOver);
    };
  }, []);

  return (
    <motion.div
      className={clsx("custom-cursor", isActive && "active")}
      animate={{
        x: position.x,
        y: position.y,
        width: isActive ? 40 : 26,
        height: isActive ? 40 : 26,
      }}
      transition={{
        type: "tween",
        ease: [0.23, 1, 0.32, 1],
        duration: 0.15,
      }}
    />
  );
}
