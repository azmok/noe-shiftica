"use client";

import React, { useState, useEffect } from "react";

const VariantPatternB = () => (
    <div className="relative w-full h-full bg-[#0f1115] overflow-hidden flex items-center justify-center rounded-xl">
        <svg viewBox="0 0 1000 400" preserveAspectRatio="xMidYMid slice" className="absolute w-full h-full opacity-40">
            <path className="fill-none stroke-white/20 stroke-[0.5] stroke-dasharray-[1000] animate-[draw_15s_linear_infinite_alternate]" d="M-100,200 Q250,50 500,200 T1100,200" />
            <path className="fill-none stroke-white/20 stroke-[0.5] stroke-dasharray-[1000] animate-[draw_20s_linear_infinite_alternate] opacity-10" d="M-100,250 Q250,100 500,250 T1100,250" />
            <path className="fill-none stroke-white/20 stroke-[0.5] stroke-dasharray-[1000] animate-[draw_25s_linear_infinite_alternate] opacity-10" d="M-100,150 Q250,0 500,150 T1100,150" />

            <circle cx="500" cy="200" r="1.5" className="fill-white opacity-60 animate-[pulse_4s_ease-in-out_infinite]" />
            <circle cx="250" cy="125" r="1" className="fill-white opacity-60 animate-[pulse_4s_ease-in-out_infinite]" style={{ animationDelay: "-1s" }} />
            <circle cx="750" cy="275" r="1" className="fill-white opacity-60 animate-[pulse_4s_ease-in-out_infinite]" style={{ animationDelay: "-2s" }} />
        </svg>
        <h1 className="z-10 text-white font-extralight tracking-[0.2em] uppercase text-2xl md:text-4xl text-center">
            Noe Shiftica
        </h1>
        <style jsx>{`
        @keyframes draw { to { stroke-dashoffset: 0; } }
        `}</style>
    </div>
);

const VariantNeumorphic1 = () => (
    <div className="relative w-full h-full bg-[#e0e5ec] flex items-center justify-center p-4 rounded-xl">
        <div className="relative w-[90%] h-[90%] max-w-[600px] bg-[#e0e5ec] rounded-[50px] shadow-[20px_20px_60px_#a3b1c6,-20px_-20px_60px_#ffffff] flex flex-col items-center justify-center overflow-hidden">
            <svg viewBox="0 0 800 400" className="absolute inset-0 w-full h-full opacity-60 pointer-events-none">
                <path className="fill-none stroke-[#a3b1c6] stroke-2 stroke-linecap-round filter-[blur(1px)] stroke-dasharray-[1000] animate-[trace_10s_ease-in-out_infinite_alternate]" d="M100,200 C150,100 300,300 400,200 S650,100 700,200" />
                <path className="fill-none stroke-[#a3b1c6] stroke-2 stroke-linecap-round filter-[blur(1px)] stroke-dasharray-[1000] animate-[trace_10s_ease-in-out_infinite_alternate] opacity-30" style={{ animationDelay: "-2s" }} d="M200,350 Q400,150 600,350" />
            </svg>

            <div className="absolute top-[15%] right-[10%] w-3 h-3 bg-[#e0e5ec] rounded-full shadow-[inset_2px_2px_5px_#a3b1c6,inset_-2px_-2px_5px_#ffffff]">
                <div className="absolute top-1 left-1 w-1 h-1 bg-[#4caf50] rounded-full shadow-[0_0_10px_#4caf50]"></div>
            </div>

            <h1 className="text-3xl md:text-5xl font-black text-[#e0e5ec] uppercase tracking-tight shadow-none m-0 leading-none" style={{ textShadow: "2px 2px 3px #a3b1c6, -2px -2px 3px #ffffff" }}>
                Noe Shiftica
            </h1>
            <div className="mt-6 text-[10px] uppercase tracking-[0.5em] text-[#a3b1c6] font-bold">
                Cognitive Architecture
            </div>
        </div>
        <style jsx>{`
        @keyframes trace { to { stroke-dashoffset: 0; } }
        `}</style>
    </div>
);

const VariantGlowNeumorphism = () => (
    <div className="relative w-full h-full bg-[#e0e5ec] flex items-center justify-center p-4 rounded-xl">
        <div className="relative w-[90%] h-[90%] max-w-[600px] bg-[#e0e5ec] rounded-[40px] shadow-[15px_15px_30px_#a3b1c6,-15px_-15px_30px_#ffffff] flex flex-col items-center justify-center overflow-hidden text-center">
            <svg viewBox="0 0 700 300" className="absolute inset-0 w-full h-full opacity-40 z-0">
                <path className="fill-none stroke-[#6B2DA0] stroke-[1.5] stroke-linecap-round stroke-dasharray-[10,50] animate-[pulse-flow_5s_linear_infinite]" d="M0,150 Q175,50 350,150 T700,150" />
                <path className="fill-none stroke-[#6B2DA0] stroke-[1.5] stroke-linecap-round stroke-dasharray-[10,50] animate-[pulse-flow_5s_linear_infinite]" style={{ animationDelay: "-2.5s" }} d="M0,160 Q175,260 350,160 T700,160" />
            </svg>

            <div className="relative z-10">
                <h1 className="text-3xl md:text-5xl font-black text-[#e0e5ec] uppercase tracking-tight m-0" style={{ textShadow: "2px 2px 3px #a3b1c6, -1px -1px 2px #ffffff, 0 0 15px rgba(107,45,160,0.2)" }}>
                    Noe Shiftica
                </h1>
                <div className="w-10 h-1 bg-[#6B2DA0] mx-auto mt-8 rounded-sm shadow-[0_0_10px_rgba(107,45,160,0.5)]"></div>
                <p className="mt-8 text-[10px] tracking-[0.6em] text-[#3d4756] font-light uppercase">
                    Neural Shift Agency
                </p>
            </div>
        </div>
        <style jsx>{`
        @keyframes pulse-flow {
            0% { stroke-dashoffset: 100; opacity: 0.1; }
            50% { opacity: 0.5; }
            100% { stroke-dashoffset: 0; opacity: 0.1; }
        }
        `}</style>
    </div>
);

const VariantPrimaryAccent = () => (
    <div className="relative w-full h-full bg-[#e0e5ec] flex items-center justify-center p-4 rounded-xl">
        <div className="relative w-[90%] h-[90%] max-w-[600px] bg-[#e0e5ec] rounded-[40px] shadow-[15px_15px_30px_#a3b1c6,-15px_-15px_30px_#ffffff] flex flex-col items-center justify-center overflow-hidden text-center">
            <svg viewBox="0 0 700 300" className="absolute inset-0 w-full h-full opacity-40 z-0">
                <path className="fill-none stroke-[#6B2DA0] stroke-[1.5] stroke-linecap-round stroke-dasharray-[10,50] animate-[pulse-flow_5s_linear_infinite]" d="M0,150 Q175,50 350,150 T700,150" />
                <path className="fill-none stroke-[#6B2DA0] stroke-[1.5] stroke-linecap-round stroke-dasharray-[10,50] animate-[pulse-flow_5s_linear_infinite]" style={{ animationDelay: "-2.5s" }} d="M0,160 Q175,260 350,160 T700,160" />
            </svg>

            <div className="relative z-10">
                <h1 className="text-3xl md:text-5xl font-black text-[#CCDD00] uppercase tracking-tight m-0" style={{ textShadow: "2px 2px 3px #a3b1c6, -1px -1px 2px #ffffff, 0 0 15px rgba(107,45,160,0.2)" }}>
                    Noe Shiftica
                </h1>
                <div className="w-10 h-1 bg-[#6B2DA0] mx-auto mt-8 rounded-sm shadow-[0_0_10px_rgba(107,45,160,0.5)]"></div>
                <p className="mt-8 text-[10px] tracking-[0.6em] text-[#3d4756] font-light uppercase">
                    Neural Shift Agency
                </p>
            </div>
        </div>
        <style jsx>{`
        @keyframes pulse-flow {
            0% { stroke-dashoffset: 100; opacity: 0.1; }
            50% { opacity: 0.5; }
            100% { stroke-dashoffset: 0; opacity: 0.1; }
        }
        `}</style>
    </div>
);

const VariantRefined = () => (
    <div className="relative w-full h-full flex items-center justify-center rounded-xl overflow-hidden" style={{ background: "radial-gradient(circle at 50% 50%, #111 0%, #0a0a0a 100%)" }}>
        <div className="absolute inset-0 pointer-events-none opacity-5 mix-blend-overlay z-50 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[length:5vw_5vw] [mask-image:radial-gradient(circle_at_center,black_30%,transparent_80%)]"></div>

        <svg viewBox="0 0 1000 1000" className="absolute w-full h-full opacity-25 filter-[blur(1px)]">
            <path className="fill-none stroke-white stroke-[0.5] opacity-40 stroke-dasharray-[400] animate-[flow_20s_linear_infinite]" d="M0,500 C200,450 400,550 500,500 S800,450 1000,500" style={{ animationDuration: "15s" }} />
            <path className="fill-none stroke-white stroke-[0.5] opacity-10 stroke-dasharray-[400] animate-[flow_20s_linear_infinite]" d="M0,520 C250,480 450,580 550,520 S850,480 1000,520" style={{ animationDuration: "25s" }} />
            <path className="fill-none stroke-white stroke-[0.5] opacity-20 stroke-dasharray-[400] animate-[flow_20s_linear_infinite]" d="M500,0 C550,200 450,400 500,500 S550,800 500,1000" style={{ animationDuration: "20s" }} />
        </svg>

        <div className="relative z-10 text-center flex flex-col items-center">
            <h1 className="text-4xl md:text-7xl font-black text-white uppercase tracking-tight leading-[0.85] m-0 flex flex-col items-center">
                <span>Noe</span>
                <span className="text-transparent italic ml-8" style={{ WebkitTextStroke: "1px rgba(255,255,255,0.3)" }}>Shiftica</span>
            </h1>
        </div>

        <div className="absolute bottom-6 left-[5%] text-[8px] md:text-[10px] uppercase tracking-[0.3em] text-white/40 [writing-mode:vertical-rl]">
            Cognitive Science // Neural Dynamics // Est. 2026
        </div>

        <style jsx>{`
        @keyframes flow { to { stroke-dashoffset: 0; } }
        `}</style>
    </div>
);

const VARIANTS = [
    VariantPatternB,
    VariantNeumorphic1,
    VariantGlowNeumorphism,
    VariantPrimaryAccent,
    VariantRefined,
];

export function BlogFallbackHero() {
    const [variantIndex, setVariantIndex] = useState(0); // Default to first on server
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setVariantIndex(Math.floor(Math.random() * VARIANTS.length));
        setMounted(true);
    }, []);

    const SelectedVariant = VARIANTS[variantIndex];

    return (
        <div className="w-full h-full relative transition-opacity duration-500" style={{ opacity: mounted ? 1 : 0 }}>
            <SelectedVariant />
        </div>
    );
}

