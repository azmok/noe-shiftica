import React from "react";
import Link from "next/link";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-[#050505] border-t border-white/10 pt-16 pb-8 px-6 mt-32 position-relative z-10">
      <div className="container mx-auto max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="md:col-span-2 space-y-4">

            <p className="text-white/60 text-xs max-w-sm leading-relaxed">
              Design the Shift.
              <br />
              最新技術と本質の追求で、ビジネスの世界観を転換します。
            </p>
          </div>

          <div>
            <h3 className="font-mono text-[#FFFFFF] text-xs uppercase tracking-wider mb-4">
              Navigation
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/about"
                  className="text-white/80 hover:text-white transition-colors text-xs"
                >
                  Philosophy & Approach
                </Link>
              </li>
              <li>
                <Link
                  href="#services"
                  className="text-white/80 text-xs"
                >
                  Services
                </Link>
              </li>
              <li>
                <Link
                  href="#pricing"
                  className="text-white/80 text-xs"
                >
                  Pricing
                </Link>
              </li>
              <li>
                <Link
                  href="/blog"
                  className="text-white/80 text-xs"
                >
                  Journal / Tech Blog
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-mono text-[#FFFFFF] text-xs uppercase tracking-wider mb-4">
              Connect
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="https://twitter.com"
                  target="_blank"
                  className="text-white/80 hover:text-white transition-colors text-xs"
                >
                  X (Twitter)
                </Link>
              </li>
              <li>
                <Link
                  href="https://github.com"
                  target="_blank"
                  className="text-white/80 text-xs"
                >
                  GitHub
                </Link>
              </li>
              <li>
                <Link
                  href="https://linkedin.com"
                  target="_blank"
                  className="text-white/80 text-xs"
                >
                  LinkedIn
                </Link>
              </li>
              <li>
                <Link
                  href="#contact"
                  className="text-white/80 text-xs"
                >
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-white/50 text-xs">
            &copy; {currentYear} Noe Shiftica. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link
              href="/privacy"
              className="text-white/50 text-xs"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="text-white/50 text-xs"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
