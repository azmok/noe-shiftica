import React from "react";
import Link from "next/link";

interface FooterProps {
  variant?: "landing" | "blog";
}

export function Footer({ variant = "landing" }: FooterProps) {
  const currentYear = new Date().getFullYear();

  const isBlog = variant === "blog";

  return (
    <footer
      className={`w-full pt-16 pb-8 px-6 mt-32 position-relative z-10 transition-colors duration-300 ${isBlog
        ? "bg-[var(--color-neu-bg-light)] border-t border-white/50"
        : "bg-[#050505] border-t border-white/10"
        }`}
    >
      <div className="container mx-auto max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="md:col-span-2 space-y-4">
            <p
              className={`text-xs max-w-sm leading-relaxed ${isBlog ? "text-slate-500" : "text-white/60"
                }`}
            >
              Design the Shift.
              <br />
              最新技術と本質の追求で、ビジネスの世界観を転換します。
            </p>
          </div>

          <div>
            <h3
              className={`font-mono text-xs uppercase tracking-wider mb-4 ${isBlog ? "text-slate-800" : "text-[#FFFFFF]"
                }`}
            >
              Navigation
            </h3>
            <ul className="space-y-3">
              {[
                { name: "About", href: "/about" },
                { name: "Services", href: "/#services" },
                { name: "Pricing", href: "/#pricing" },
                { name: "Blog", href: "/blog" },
              ].map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className={`transition-colors text-xs px-5 py-[11px] rounded-full inline-block ${isBlog
                      ? "text-slate-600 hover:text-[var(--color-neu-primary)]"
                      : "text-white/80 hover:text-white"
                      }`}
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3
              className={`font-mono text-xs uppercase tracking-wider mb-4 ${isBlog ? "text-slate-800" : "text-[#FFFFFF]"
                }`}
            >
              Connect
            </h3>
            <ul className="space-y-3">
              {[
                { name: "X (Twitter)", href: "https://twitter.com", target: "_blank" },
                { name: "GitHub", href: "https://github.com", target: "_blank" },
                { name: "LinkedIn", href: "https://linkedin.com", target: "_blank" },
                { name: "Contact Us", href: "mailto:info@noeshiftica.com" },
              ].map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    target={link.target}
                    className={`transition-colors text-xs px-5 py-[11px] rounded-full inline-block ${isBlog
                      ? "text-slate-600 hover:text-[var(--color-neu-primary)]"
                      : "text-white/80 hover:text-white"
                      }`}
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div
          className={`pt-8 border-t flex flex-col md:flex-row items-center justify-between gap-4 ${isBlog ? "border-white/50" : "border-white/10"
            }`}
        >
          <p className={`text-xs ${isBlog ? "text-slate-400" : "text-white/50"}`}>
            &copy; {currentYear} Noe Shiftica. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link
              href="/privacy"
              className={`text-xs px-5 py-[11px] rounded-full ${isBlog ? "text-slate-400 hover:text-slate-600" : "text-white/50 hover:text-white"
                }`}
            >
              プライバシーポリシー
            </Link>
            <Link
              href="/terms"
              className={`text-xs px-5 py-[11px] rounded-full ${isBlog ? "text-slate-400 hover:text-slate-600" : "text-white/50 hover:text-white"
                }`}
            >
              利用規約
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
