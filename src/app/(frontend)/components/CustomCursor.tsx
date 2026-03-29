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
  const hoveredElementRef = useRef<HTMLElement | null>(null);

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
    hoveredElementRef.current = null;
    setIsHoveringFeatured(false);
    stateRef.current = "normal";
    xAnimRef.current?.stop();
    yAnimRef.current?.stop();
  }, [pathname]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
    
    const updateDeviceType = () => {
      if (!mediaQuery.matches || window.innerWidth <= 768) {
        setIsMobile(true);
      } else {
        setIsMobile(false);
      }
    };

    updateDeviceType();
    mediaQuery.addEventListener("change", updateDeviceType);
    window.addEventListener("resize", updateDeviceType);

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

      if (target.closest(".blog-posts") || target.closest(".posts.featured") || target.closest(".no-custom-cursor")) return;

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
        hoveredElementRef.current = el;
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

        hoveredElementRef.current = null;
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
      mediaQuery.removeEventListener("change", updateDeviceType);
      window.removeEventListener("resize", updateDeviceType);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseover", handleMouseOver);
      window.removeEventListener("mouseout", handleMouseOut);
    };
  }, [cursorX, cursorY]);

  // Handle position loop via direct tick over motionvalues
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

        // Snappy lerp
        cursorX.set(cx + dx * 0.35);
        cursorY.set(cy + dy * 0.35);

        if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) {
          stateRef.current = "normal";
          cursorX.set(tx);
          cursorY.set(ty);
        }
      } else if (stateRef.current === "hovered" && hoveredElementRef.current) {
        // 対象の要素が画面遷移やReactの再描画によってDOMから消え去った場合、
        // mouseoutイベントが発火しないため、ここで検知して強制的に状態を解除する。
        if (!document.body.contains(hoveredElementRef.current)) {
          hoveredElementRef.current = null;
          setHoveredElProps(null);
          stateRef.current = "springing";
        } else {
          // ホバー中も常に位置をアップデートし、アニメーション（移動）に追従させる
          const rect = hoveredElementRef.current.getBoundingClientRect();
          
          // props経由での更新（幅・高さ用）
          setHoveredElProps(prev => {
            if (!prev || prev.left !== rect.left || prev.top !== rect.top || prev.width !== rect.width || prev.height !== rect.height) {
              return {
                width: rect.width,
                height: rect.height,
                left: rect.left,
                top: rect.top,
                borderRadius: prev?.borderRadius || "0px"
              };
            }
            return prev;
          });

          // 位置の更新
          cursorX.set(rect.left);
          cursorY.set(rect.top);
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
