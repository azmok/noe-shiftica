import React from "react";
import Link from "next/link";
import { Twitter, Github, Linkedin, Mail } from "lucide-react";

interface FooterProps {
  variant?: "landing" | "blog";
}

export function Footer({ variant = "landing" }: FooterProps) {
  const currentYear = new Date().getFullYear();
  const isBlog = variant === "blog";

  return (
    <footer
      className={`w-full pt-16 pb-8 px-6 mt-32 relative z-10 transition-colors duration-300 border-t ${isBlog
        ? "bg-[#F7F7F7] border-[#DDDDDD] text-[#222222]"
        : "bg-[#050505] text-white border-white/10"
        }`}
    >
      <div className="container mx-auto max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-12 gap-12 mb-16">
          <div className="lg:col-span-5 space-y-6">
            <Link href="/" className="inline-block">
              <span className="text-xl font-black tracking-tighter">Noe Shiftica</span>
            </Link>
            <p
              className={`text-sm max-w-sm leading-relaxed ${isBlog ? "text-slate-500" : "text-white/60"
                }`}
            >
              Design the Shift.
              <br />
              最新技術と本質の追求で、ビジネスの世界観を転換します。
            </p>
          </div>

          <div className="lg:col-span-3">
            <h3
              className={`text-sm font-bold uppercase tracking-wider mb-6 ${isBlog ? "text-slate-900" : "text-white"
                }`}
            >
              Navigation
            </h3>
            <ul className="space-y-4">
              {[
                { name: "About", href: "/about" },
                { name: "Services", href: "/#services" },
                { name: "Pricing", href: "/#pricing" },
                { name: "Blog", href: "/blog" },
              ].map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className={`text-sm transition-colors ${isBlog
                      ? "text-[#222222] hover:text-[var(--color-neu-primary)]"
                      : "text-white/80 hover:text-white"
                      }`}
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-4">
            <h3
              className={`text-sm font-bold uppercase tracking-wider mb-6 ${isBlog ? "text-slate-900" : "text-white"
                }`}
            >
              Connect
            </h3>
            <div className="flex flex-wrap gap-4 mb-6">
              {[
                { name: "X", icon: Twitter, href: "https://twitter.com" },
                { name: "GitHub", icon: Github, href: "https://github.com" },
                { name: "LinkedIn", icon: Linkedin, href: "https://linkedin.com" },
                { name: "Mail", icon: Mail, href: "mailto:info@noeshiftica.com" },
              ].map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`size-10 rounded-full flex items-center justify-center transition-all ${isBlog
                    ? "bg-white shadow-sm border border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900"
                    : "bg-white/5 hover:bg-white/10 text-white/70 hover:text-white"
                    }`}
                >
                  <social.icon size={18} />
                </a>
              ))}
            </div>
            <p className={`text-sm ${isBlog ? "text-slate-500" : "text-white/60"}`}>
              info@noe-shiftica.com
            </p>
          </div>
        </div>

        <div
          className={`pt-8 border-t flex flex-col md:flex-row items-center justify-between gap-6 ${isBlog ? "border-slate-200" : "border-white/10"
            }`}
        >
          <div className="flex flex-col md:flex-row items-center gap-2 md:gap-6 order-2 md:order-1">
            <p className={`text-sm ${isBlog ? "text-slate-500" : "text-white/50"}`}>
              &copy; {currentYear} Noe Shiftica
            </p>
            <span className={`hidden md:inline ${isBlog ? "text-slate-300" : "text-white/10"}`}>|</span>
            <div className="flex gap-6">
              <Link
                href="/privacy"
                className={`text-sm ${isBlog ? "text-slate-500 hover:text-slate-900" : "text-white/50 hover:text-white"
                  }`}
              >
                プライバシーポリシー
              </Link>
              <Link
                href="/terms"
                className={`text-sm ${isBlog ? "text-slate-500 hover:text-slate-900" : "text-white/50 hover:text-white"
                  }`}
              >
                利用規約
              </Link>
            </div>
          </div>

          <div className="order-1 md:order-2 flex items-center gap-4">
            <span className={`text-sm font-medium ${isBlog ? "text-slate-900" : "text-white"}`}>JP</span>
            <span className={`text-xs ${isBlog ? "text-slate-300" : "text-white/20"}`}>English coming soon</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
