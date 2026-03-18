"use client";

import React from "react";
import { motion, Variants } from "framer-motion";

interface ConceptSectionProps {
  fadeIn: Variants;
}

export function ConceptSection({ fadeIn }: ConceptSectionProps) {
  return (
    <section id="concept" className="py-32 px-6 relative z-10">
      <div className="container mx-auto max-w-6xl">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeIn}
          className="mb-20 text-center max-w-3xl mx-auto"
        >
          <h2 className="text-4xl md:text-[5.5rem] font-serif font-light mb-6 heading-2 oxanium-heading">
            AI × Design.
            <br />
            <span className="text-area-1 text-xl md:text-2xl font-sans text-[#FFFFFF] block mt-4 font-normal">
              制作コストを削減して、その分を「質」に全振りする。
            </span>
          </h2>
          <p className="text-area-2 text-lg text-white/70 leading-relaxed">
            従来のWeb制作は、品質を上げれば費用がかかり、費用を抑えればテンプレートになる。
            <br />
            Noe
            Shifticaは、AIワークフローで制作の非効率を削ぎ落とし、本来なら50万〜数百万円かかるレベルのデザイン体験を、15万円〜で提供します。
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              title: "AIで速く、人間で美しく",
              desc: "コーディングの反復作業はAIが担い、デザインの感性と判断は人間が担う。速さと品質を同時に実現する構造です。",
            },
            {
              title: "本質から設計する",
              desc: "見た目を整えるのではなく、ブランドの核心から再設計します。Noesis（本質を掴む知性）× Shift（変化の設計）— それがNoe Shifticaの思想です。",
            },
            {
              title: "最新技術で、育つサイトを",
              desc: "Next.js / Payload CMS / Neonによる構成で、公開後も成長できるサイトを作ります。テンプレートでは作れない、拡張性と速度を両立した設計です。",
            },
          ].map((pillar, idx) => (
            <motion.div
              key={idx}
              custom={idx}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={fadeIn}
              className="bg-[#111111]/40 border border-[#888888]/20 p-8 rounded-2xl hover:border-[#FFFFFF]/50 transition-colors group"
            >
              <div className="text-4xl font-serif text-[#FFFFFF] mb-6 opacity-50 group-hover:opacity-100 transition-opacity">
                0{idx + 1}
              </div>
              <h3 className="text-xl font-extrabold mb-4">{pillar.title}</h3>
              <p className="text-white/70 text-xs leading-relaxed">
                {pillar.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
