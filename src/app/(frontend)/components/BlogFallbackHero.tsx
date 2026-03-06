"use client";

import React from "react";

export function BlogFallbackHero() {
    return (
        <div className="neumorphic-fallback-wrapper">
            <div className="artifact-container">
                <svg className="neural-groove" viewBox="0 0 800 400">
                    <path className="groove-path" d="M100,200 C150,100 300,300 400,200 S650,100 700,200" />
                    <path className="groove-path" d="M200,350 Q400,150 600,350" style={{ animationDelay: "-2s", opacity: 0.3 }} />
                </svg>

                <div className="status-dot"></div>

                <h1 className="brand-engraved">Noe Shiftica</h1>
                <div className="tagline">Cognitive Architecture</div>
            </div>

            <style jsx>{`
                .neumorphic-fallback-wrapper {
                    /* wrapper to match the card content area */
                    width: 100%;
                    height: 100%;
                    min-height: 250px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background-color: #e0e5ec;
                    border-radius: 12px; /* fallback container bounding */
                    overflow: hidden;
                    font-family: 'Inter', -apple-system, sans-serif;
                }

                .artifact-container {
                    position: relative;
                    width: 100%;
                    height: 100%;
                    background: #e0e5ec;
                    border-radius: 0px; 
                    /* removed outer box-shadow so it sits flat inside the card, 
                       or we can keep it if they want it floating */
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                }

                .brand-engraved {
                    font-size: clamp(2.5rem, 8vw, 5rem);
                    font-weight: 900;
                    color: #e0e5ec;
                    text-transform: uppercase;
                    letter-spacing: -0.02em;
                    text-shadow: 2px 2px 3px #a3b1c6, -2px -2px 3px #ffffff;
                    margin: 0;
                    line-height: 1;
                }

                .tagline {
                    margin-top: 1.5rem;
                    font-size: 0.7rem;
                    text-transform: uppercase;
                    letter-spacing: 0.5em;
                    color: #a3b1c6;
                    font-weight: 700;
                }

                .neural-groove {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    pointer-events: none;
                    opacity: 0.6;
                }

                .groove-path {
                    fill: none;
                    stroke: #a3b1c6;
                    stroke-width: 2;
                    stroke-linecap: round;
                    filter: blur(1px);
                    stroke-dasharray: 1000;
                    stroke-dashoffset: 1000;
                    animation: trace 10s ease-in-out infinite alternate;
                }

                @keyframes trace {
                    to {
                        stroke-dashoffset: 0;
                    }
                }

                .status-dot {
                    position: absolute;
                    top: 15%;
                    right: 15%;
                    width: 12px;
                    height: 12px;
                    background: #e0e5ec;
                    border-radius: 50%;
                    box-shadow: inset 2px 2px 5px #a3b1c6, inset -2px -2px 5px #ffffff;
                }

                .status-dot::after {
                    content: '';
                    position: absolute;
                    top: 4px;
                    left: 4px;
                    width: 4px;
                    height: 4px;
                    background: #4caf50;
                    border-radius: 50%;
                    box-shadow: 0 0 10px #4caf50;
                }
            `}</style>
        </div>
    );
}


