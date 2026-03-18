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
      className={`w-full pt-16 pb-8 px-6 mt-0 md:mt-0 relative z-10 transition-colors duration-300 border-t ${isBlog
        ? "bg-background-void border-white/10 text-white/60"
        : "bg-background-void text-white border-white/10"
        }`}
    >
      <div className="container mx-auto max-w-7xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-12 mb-16 px-4">
          <div className="lg:col-span-4 space-y-0">
            <Link href="/" className="inline-block text-xs rounded-full px-5 pt-[10px] pb-[15px] leading-none text-[2rem] font-bold tracking-tighter align-middle opacity-90">
              Noe Shiftica
            </Link>
            <div
              className={`text-[8px] max-w-xs font-light ${isBlog ? "text-slate-500" : "text-white/40"
                }`}
            >
              <p className="leading-4 text-[0.8rem] font-medium tracking-tighter opacity-90">Design the Shift.</p>

              <p className="leading-4">最新技術と本質の追求で、ビジネスの世界観を転換します。</p>
            </div>
          </div>

          <div className="lg:col-span-2">
            <h3
              className={`text-[12px] font-bold uppercase tracking-[0.2em] mb-2 ${isBlog ? "text-slate-400" : "text-white/30"
                }`}
            >
              Navigation
            </h3>
            <ul className="space-y-1.5 pl-0">
              {[
                { name: "About", href: "/about" },
                { name: "Services", href: "/#services" },
                { name: "Pricing", href: "/#pricing" },
                { name: "Blog", href: "/blog" },
              ].map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className={`text-[12px] leading-[16px] transition-colors font-light rounded-full px-5 py-[11px] ${isBlog
                      ? "text-white/60 hover:text-(--color-neu-primary)"
                      : "text-white/60 hover:text-white"
                      }`}
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h3
              className={`text-[12px] font-bold uppercase tracking-[0.2em] mb-3 ${isBlog ? "text-slate-400" : "text-white/30"
                }`}
            >
              Support
            </h3>
            <ul className="space-y-1 pl-0">
              {[
                { name: "Privacy Policy", href: "/privacy" },
                { name: "特定商取引法に基づく表記", href: "/tokusho" },
                { name: "Terms of Service", href: "/terms" },
              ].map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className={`text-[12px] transition-colors font-light rounded-full px-5 py-[11px] ${isBlog
                      ? "text-white/60 hover:text-(--color-neu-primary)"
                      : "text-white/60 hover:text-white"
                      }`}
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-4 sm:col-span-2">
            <h3
              className={`text-[11px] font-bold uppercase tracking-[0.2em] mb-4 ${isBlog ? "text-slate-400" : "text-white/30"
                }`}
            >
              Stay Connected
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
                  className={`size-9 rounded-full flex items-center justify-center transition-all ${isBlog
                    ? "bg-(--color-neu-primary) text-white hover:opacity-90"
                    : "bg-white/5 hover:bg-white/10 text-white/40 hover:text-white"
                    }`}
                >
                  <social.icon size={16} />
                </a>
              ))}
            </div>

          </div>
        </div>

        <div
          className={`pt-8 border-t flex flex-col md:flex-row items-center justify-between gap-6 px-4 ${isBlog ? "border-slate-100" : "border-white/5"
            }`}
        >
          <div className="flex flex-col md:flex-row items-center gap-2 md:gap-6 order-2 md:order-1">
            <p className={`text-[11px] tracking-wider font-light ${isBlog ? "text-slate-400" : "text-white/30"}`}>
              &copy; {currentYear} Noe Shiftica
            </p>
          </div>
        </div>
      </div>
    </footer >
  );
}
