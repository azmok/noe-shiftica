import React from "react";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import Link from "next/link";
import { getPayload } from "payload";
import configPromise from "@payload-config";

export default async function BlogPage() {
  const payload = await getPayload({ config: configPromise });
  const posts = await payload.find({
    collection: "posts",
    depth: 1,
    limit: 10,
    sort: "-publishedAt",
  });

  return (
    <div className="min-h-screen text-white relative selection:bg-[#FFFFFF] selection:text-[#050505]">
      <Header />

      <section className="pt-48 pb-20 px-6">
        <div className="container mx-auto max-w-4xl text-center">
          <h1 className="text-5xl md:text-7xl font-serif font-bold tracking-tight mb-4">
            Journal.
          </h1>
          <h2 className="text-xl md:text-2xl text-[#FFFFFF] font-sans mb-12">
            デザイン・技術・AIについての思考と探求。
          </h2>
        </div>
      </section>

      <section className="py-12 px-6 relative z-10">
        <div className="container mx-auto max-w-4xl min-h-[40vh]">
          {posts.docs.length === 0 ? (
            <div className="text-center p-12 bg-[#111111]/30 border border-white/10 rounded-2xl w-full">
              <div className="bg-white/10 w-16 h-16 mx-auto rounded-full mb-6"></div>
              <h3 className="text-2xl font-serif mb-4 text-white">
                No articles yet
              </h3>
              <p className="text-white/50 mb-8 max-w-md mx-auto">
                Payload CMSの「Posts」コレクションから記事が投稿されると、ここに表示されます。現在準備中です。
              </p>
              <Link
                href="/admin"
                className="text-[#FFFFFF] hover:underline hover:text-[#CCCCCC] transition-colors"
              >
                Adminパネルへログインする
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {posts.docs.map((post: any) => (
                <Link href={`/blog/${post.slug}`} key={post.id} className="block group">
                  <div className="bg-[#111111]/30 border border-white/10 rounded-2xl p-6 transition-all duration-300 hover:bg-[#111111]/60 hover:border-white/20 h-full flex flex-col">
                    <h3 className="text-2xl font-serif text-white mb-3 group-hover:text-[var(--color-primary)] transition-colors">
                      {post.title}
                    </h3>
                    {post.publishedAt && (
                      <div className="text-sm text-white/50 mt-auto pt-4">
                        {new Date(post.publishedAt).toLocaleDateString('ja-JP')}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
