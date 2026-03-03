"use client";

import React from "react";

export function BlogFallbackHero() {
    return (
        <div className="relative w-full h-full bg-[#e0e5ec] flex items-center justify-center overflow-hidden rounded-xl">
            {/* Neumorphic Container */}
            <div className="relative w-[90%] max-w-[500px] p-12 bg-[#e0e5ec] rounded-[40px] shadow-[15px_15px_30px_#a3b1c6,-15px_-15px_30px_#ffffff] text-center overflow-hidden">

                {/* SVG Pulse paths */}
                <svg className="absolute inset-0 w-full h-full opacity-40 z-0" viewBox="0 0 700 300" preserveAspectRatio="none">
                    <path
                        className="fill-none stroke-[#6B2DA0] stroke-[1.5] stroke-linecap-round animate-[pulse-flow_5s_linear_infinite]"
                        d="M0,150 Q175,50 350,150 T700,150"
                        style={{ strokeDasharray: "10, 50" }}
                    />
                    <path
                        className="fill-none stroke-[#6B2DA0] stroke-[1.5] stroke-linecap-round animate-[pulse-flow_5s_linear_infinite]"
                        d="M0,160 Q175,260 350,160 T700,160"
                        style={{ animationDelay: "-2.5s", strokeDasharray: "10, 50" }}
                    />
                </svg>

                <div className="relative z-10">
                    <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-[#CCDD00] drop-shadow-[2px_2px_3px_#a3b1c6]">
                        Noe Shiftica
                    </h1>
                    <div className="w-10 h-1 bg-[#6B2DA0] mx-auto mt-6 rounded-full shadow-[0_0_10px_rgba(107,45,160,0.5)]"></div>
                    <p className="mt-6 text-[10px] tracking-[0.6em] text-[#3d4756] uppercase font-light">
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
}
