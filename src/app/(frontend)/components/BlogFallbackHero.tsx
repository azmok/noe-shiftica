"use client";

import React from "react";

export function BlogFallbackHero() {
    return (
        <div className="w-full h-full min-h-[250px] flex items-center justify-center bg-[#e0e5ec] rounded-xl overflow-hidden font-sans">
            <div className="relative w-full h-full bg-[#e0e5ec] flex flex-col items-center justify-center">
                <svg className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-60" viewBox="0 0 800 400">
                    <path 
                        className="fill-none stroke-[#a3b1c6] stroke-2 stroke-linecap-round animate-[trace_10s_ease-in-out_infinite_alternate]" 
                        d="M100,200 C150,100 300,300 400,200 S650,100 700,200" 
                        style={{ filter: "blur(1px)", strokeDasharray: 1000, strokeDashoffset: 1000 }}
                    />
                    <path 
                        className="fill-none stroke-[#a3b1c6] stroke-2 stroke-linecap-round animate-[trace_10s_ease-in-out_infinite_alternate]" 
                        d="M200,350 Q400,150 600,350" 
                        style={{ filter: "blur(1px)", strokeDasharray: 1000, strokeDashoffset: 1000, animationDelay: "-2s", opacity: 0.3 }} 
                    />
                </svg>

                <div className="absolute top-[15%] right-[15%] w-3 h-3 bg-[#e0e5ec] rounded-full shadow-[inset_2px_2px_5px_#a3b1c6,inset_-2px_-2px_5px_#ffffff] after:content-[''] after:absolute after:top-1 after:left-1 after:w-1 after:h-1 after:bg-[#4caf50] after:rounded-full after:shadow-[0_0_10px_#4caf50]"></div>

                <h1 className="text-[clamp(2.5rem,8vw,5rem)] font-black uppercase tracking-tighter text-[#e0e5ec] leading-none m-0" style={{ textShadow: "2px 2px 3px #a3b1c6, -2px -2px 3px #ffffff" }}>
                    Noe Shiftica
                </h1>
                <div className="mt-6 text-[0.7rem] uppercase tracking-[0.5em] color-[#a3b1c6] font-bold">
                    Cognitive Architecture
                </div>
            </div>

            <style jsx global>{`
                @keyframes trace {
                    to {
                        stroke-dashoffset: 0;
                    }
                }
            `}</style>
        </div>
    );
}


