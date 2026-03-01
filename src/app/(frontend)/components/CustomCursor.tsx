"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion, useMotionValue, animate } from "framer-motion";
import { usePathname } from "next/navigation";
import clsx from "clsx";

export function CustomCursor() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [hoveredElProps, setHoveredElProps] = useState<{
    width: number;
    height: number;
    left: number;
    top: number;
    borderRadius: string;
  } | null>(null);

  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);
  const [isHoveringFeatured, setIsHoveringFeatured] = useState(false);

  // 遅延をなくすために React State を経由せず Motion Value を直接更新する
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);

  const mouseX = useRef(0);
  const mouseY = useRef(0);

  // "normal" = 遅延なしのマウス追従
  // "hovered" = ホバー要素の座標に完全固定
  // "springing" = ホバー解除後にマウスに向かってバネで戻っている状態
  const stateRef = useRef<"normal" | "hovered" | "springing">("normal");

  // Framer Motionのアニメーションをキャンセルできるように参照を保持
  const xAnimRef = useRef<any>(null);
  const yAnimRef = useRef<any>(null);

  const loopRef = useRef<number>(0);

  // パス名（ページ遷移）が変わった際に、強制的にカーソルの残存ホバー状態をキャンセルする
  useEffect(() => {
    setHoveredElProps(null);
    setIsHoveringFeatured(false);
    stateRef.current = "normal";
    xAnimRef.current?.stop();
    yAnimRef.current?.stop();
  }, [pathname]);

  useEffect(() => {
    // Check if device is mobile, touch-enabled, or simulated in dev tools
    const isTouchDevice =
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0 ||
      window.matchMedia("(pointer: coarse)").matches ||
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (isTouchDevice || window.innerWidth <= 768) {
      setIsMobile(true);
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      mouseX.current = e.clientX;
      mouseY.current = e.clientY;

      if (stateRef.current === "normal") {
        // 遅延完全ゼロの同期更新
        cursorX.set(e.clientX - 13);
        cursorY.set(e.clientY - 13);
      }
    };

    const handleMouseOver = (e: MouseEvent) => {
      let target = e.target as HTMLElement;
      let relatedTarget = e.relatedTarget as HTMLElement;

      // .blog-posts クラスを持つ要素（ブログカード等）や .posts.featured はホバー時の変形効果を無効化する
      if (target.closest(".posts.featured")) {
        setIsHoveringFeatured(true);
      }

      if (target.closest(".blog-posts") || target.closest(".posts.featured")) return;

      const interactiveEl = target.closest("a, button, [role='button']") as HTMLElement;

      if (
        interactiveEl ||
        window.getComputedStyle(target).cursor === "pointer"
      ) {
        if (interactiveEl && relatedTarget && interactiveEl.contains(relatedTarget)) {
          return; // 要素内部の移動は無視
        }

        const el = interactiveEl || target;
        const rect = el.getBoundingClientRect();
        const computedStyle = window.getComputedStyle(el);

        stateRef.current = "hovered";
        xAnimRef.current?.stop();
        yAnimRef.current?.stop();

        setHoveredElProps({
          width: rect.width,
          height: rect.height,
          left: rect.left,
          top: rect.top,
          borderRadius: computedStyle.borderRadius || "0px",
        });
      }
    };

    const handleMouseOut = (e: MouseEvent) => {
      let target = e.target as HTMLElement;
      let relatedTarget = e.relatedTarget as HTMLElement;

      const featured = target.closest(".posts.featured");
      if (featured) {
        if (!relatedTarget || !featured.contains(relatedTarget)) {
          setIsHoveringFeatured(false);
        }
      }

      // .blog-posts クラスを持つ要素（ブログカード等）や .posts.featured はホバー時の変形効果を無効化する
      if (target.closest(".blog-posts") || target.closest(".posts.featured")) return;

      const interactiveEl = target.closest("a, button, [role='button']");
      if (interactiveEl || window.getComputedStyle(target).cursor === "pointer") {
        if (interactiveEl && relatedTarget && interactiveEl.contains(relatedTarget)) {
          return; // 要素内部の移動は無視
        }

        setHoveredElProps(null);
        stateRef.current = "springing";
        xAnimRef.current?.stop();
        yAnimRef.current?.stop();
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseover", handleMouseOver);
    window.addEventListener("mouseout", handleMouseOut);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseover", handleMouseOver);
      window.removeEventListener("mouseout", handleMouseOut);
    };
  }, [cursorX, cursorY]);

  // Handle springing loop via direct tick over motionvalues
  useEffect(() => {
    if (isMobile) return;

    let isMounted = true;

    const loop = () => {
      if (!isMounted) return;
      if (stateRef.current === "springing") {
        const tx = mouseX.current - 13;
        const ty = mouseY.current - 13;
        const cx = cursorX.get();
        const cy = cursorY.get();

        const dx = tx - cx;
        const dy = ty - cy;

        // Snappy lerp (35% approach per frame = butter smooth curve without stutter)
        cursorX.set(cx + dx * 0.35);
        cursorY.set(cy + dy * 0.35);

        if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) {
          stateRef.current = "normal";
          cursorX.set(tx);
          cursorY.set(ty);
        }
      }
      loopRef.current = requestAnimationFrame(loop);
    };

    loopRef.current = requestAnimationFrame(loop);
    return () => {
      isMounted = false;
      cancelAnimationFrame(loopRef.current);
    };
  }, [isMobile, cursorX, cursorY]);

  // ホバー対象が存在する場合のみ、固定位置へのスムーズな吸着アニメーションを発火
  useEffect(() => {
    if (hoveredElProps && stateRef.current === "hovered") {
      const elCenterX = hoveredElProps.left + hoveredElProps.width / 2;
      const elCenterY = hoveredElProps.top + hoveredElProps.height / 2;

      const targetX = elCenterX - hoveredElProps.width / 2;
      const targetY = elCenterY - hoveredElProps.height / 2;

      xAnimRef.current?.stop();
      yAnimRef.current?.stop();
      xAnimRef.current = animate(cursorX, targetX, { type: "tween", ease: [0.23, 1, 0.32, 1], duration: 0.15 });
      yAnimRef.current = animate(cursorY, targetY, { type: "tween", ease: [0.23, 1, 0.32, 1], duration: 0.15 });
    }
  }, [hoveredElProps, cursorX, cursorY]);

  if (isMobile) return null;

  let cursorWidth = 26;
  let cursorHeight = 26;
  let cursorBorderRadius = "50%";

  if (hoveredElProps) {
    cursorWidth = hoveredElProps.width;
    cursorHeight = hoveredElProps.height;
    cursorBorderRadius = hoveredElProps.borderRadius;
  }

  return (
    <motion.div
      className={clsx(
        "custom-cursor",
        hoveredElProps && "active",
        isHoveringFeatured && "featured-hover"
      )}
      // x, y は MotionValue を紐づけて React State から完全に切り離す
      style={{
        x: cursorX,
        y: cursorY,
      }}
      animate={{
        width: cursorWidth,
        height: cursorHeight,
        borderRadius: cursorBorderRadius,
      }}
      transition={{
        width: { type: "tween", ease: [0.23, 1, 0.32, 1], duration: 0.15 },
        height: { type: "tween", ease: [0.23, 1, 0.32, 1], duration: 0.15 },
        borderRadius: { duration: 0.15 },
      }}
    />
  );
}
