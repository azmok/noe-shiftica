import React from "react";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import Link from "next/link";
import { getPayload } from "payload";
import configPromise from "@payload-config";

// 'force-dynamic'を削除することで、ビルド時に静的生成（SSG）され、オンデマンドISRの恩恵を受けられるようにします。
// 記事が更新された時の revalidatePath により裏側で再生成されます。
export const revalidate = 86400; // フォールバックとして24時間ごとに再検証（任意）

export default async function BlogPage() {
  const payload = await getPayload({ config: configPromise });
  const posts = await payload.find({
    collection: "posts",
    depth: 1,
    limit: 10,
    sort: "-publishedAt",
  });

  const featuredPost = posts.docs.length > 0 ? posts.docs[0] : null;
  const recentPosts = posts.docs.slice(1);

  return (
    <div className="bg-[var(--color-neu-bg-light)] text-slate-900 min-h-screen flex flex-col font-sans antialiased relative selection:bg-[var(--color-neu-primary)] selection:text-white">
      {/* 
        This absolute div sits behind the Header to provide contrast 
        since the background is now light but the Header text is white/transparent 
      */}
      <div className="absolute top-0 left-0 w-full h-[120px] bg-gradient-to-b from-slate-900/60 to-transparent pointer-events-none z-40"></div>

      <Header />

      <main className="flex-grow px-6 lg:px-40 py-24 md:py-32 relative z-10">
        <div className="max-w-[960px] mx-auto flex flex-col gap-10 mt-8">

          {posts.docs.length === 0 ? (
            <div className="text-center p-12 neu-flat rounded-2xl w-full">
              <h3 className="text-2xl font-bold mb-4 text-slate-800">
                No articles yet
              </h3>
              <p className="text-slate-500 mb-8 max-w-md mx-auto">
                Payload CMSの「Posts」コレクションから記事が投稿されると、ここに表示されます。現在準備中です。
              </p>
              <Link
                href="/admin"
                className="text-[var(--color-neu-primary)] font-bold hover:underline transition-colors"
              >
                Adminパネルへログインする
              </Link>
            </div>
          ) : (
            <>
              {/* Featured Post Hero */}
              {featuredPost && (
                <section>
                  <Link href={`/blog/${featuredPost.slug}`} className="block posts featured">
                    <div className="neu-flat p-6 rounded-[2rem] flex flex-col lg:flex-row gap-8 items-center group cursor-pointer transition-transform hover:-translate-y-1">
                      <div className="w-full lg:w-1/2 aspect-video rounded-2xl overflow-hidden shadow-inner relative bg-slate-200">
                        <div className="absolute inset-0 bg-gradient-to-tr from-[var(--color-neu-primary)]/20 to-transparent mix-blend-overlay z-10"></div>
                        <div
                          className="w-full h-full bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                          style={{ backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuAd6WHAIUYC2RmapvNyd7OP93dLOQT9bYKpD-XXG9dP5CoerdTQt3xLyU46lvkz4-KmXFEmf2tdhBBN-nAHJGXMkmYcsnvp3G5cvAYW6a7ihq-o9WZPtF4n3TewgWIvilitSfR5dOIqCToMuwA2b4H4-8JihDELlHYtFgzvuj75FQkTCUIOX1q66Do7v_GcH4tJ809fLoYkjBSzoOTsKnximdzKFJtm5fRuCiuc5rptutWcRv5MMX6ulvp9eHAE_DjGc7OJ-Kc0jMk')` }}
                        ></div>
                      </div>
                      <div className="flex flex-col gap-5 w-full lg:w-1/2 lg:pr-6">
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 rounded-full neu-pressed text-xs font-bold text-[var(--color-neu-primary)] uppercase tracking-wider">Featured</span>
                          {featuredPost.publishedAt && (
                            <span className="text-slate-400 text-sm font-medium">
                              {new Date(featuredPost.publishedAt).toLocaleDateString('ja-JP')}
                            </span>
                          )}
                        </div>
                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-800 leading-tight">
                          {featuredPost.title}
                        </h1>
                        <p className="text-slate-500 leading-relaxed text-lg line-clamp-3">
                          {"最新の記事をお届けします。クリックして本文をお読みください。"}
                        </p>
                        <div className="pt-2">
                          <button className="neu-btn-primary h-12 px-8 rounded-xl inline-flex items-center justify-center gap-2 text-white font-bold transition-all hover:shadow-blue-500/40">
                            Read Article
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </Link>
                </section>
              )}

              {/* Search Bar (Mobile/Tablet focus) */}
              <div className="lg:hidden mt-4">
                <div className="neu-pressed h-14 w-full rounded-2xl flex items-center px-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                  <input
                    className="flex-1 bg-transparent border-none focus:ring-0 text-slate-800 placeholder-slate-400 ml-2 outline-none"
                    placeholder="Search articles..."
                    type="text"
                  />
                </div>
              </div>

              {/* Recent Stories Section */}
              {recentPosts.length > 0 && (
                <section className="mt-8">
                  <div className="flex items-center justify-between mb-8 px-2">
                    <h2 className="text-2xl font-bold text-slate-800">Recent Stories</h2>
                    <div className="flex gap-2">
                      <button className="size-10 neu-btn rounded-full flex items-center justify-center text-slate-600 hover:text-[var(--color-neu-primary)]">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="7" x="3" y="3" rx="1" /><rect width="7" height="7" x="14" y="3" rx="1" /><rect width="7" height="7" x="14" y="14" rx="1" /><rect width="7" height="7" x="3" y="14" rx="1" /></svg>
                      </button>
                      <button className="size-10 neu-pressed rounded-full flex items-center justify-center text-slate-400">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" x2="21" y1="6" y2="6" /><line x1="8" x2="21" y1="12" y2="12" /><line x1="8" x2="21" y1="18" y2="18" /><line x1="3" x2="3.01" y1="6" y2="6" /><line x1="3" x2="3.01" y1="12" y2="12" /><line x1="3" x2="3.01" y1="18" y2="18" /></svg>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {recentPosts.map((post: any, idx: number) => {
                      // fallback images for prototype feel
                      const bgImages = [
                        'https://lh3.googleusercontent.com/aida-public/AB6AXuCG3OzgUK2cyU2lHk_ogXWT9mUBIMlT9dFRN-7ALHrT6akBip1PvEJj7thlRhBRqKB1qO7nTzu3mzI5tqJi3Qwinq8TK7YVsbrN2GxiDKKbE68G34P4yk1ZzshSy6ChKdlmQbFnYv6RQkNvMClahAp2DBdcDwsU9JSMIeTr2NvOKspTRyogeZTOLW_iH5Wg5kU5Y2gFBC6F5BDm7aZxyf8__DS4tcl-nHQf5YmQNi0DvsBTR6zwhYcdb-amHSahjcGJy6gSlFz0AcI',
                        'https://lh3.googleusercontent.com/aida-public/AB6AXuDvhOGQ480sK1WCMx-qKyd1RhkykUjFvmMfbGYRuZWAn87ChiSPJYrmkb_9fO60BVmaEbr4cnzEQVboBH3g60svGnzWJ8mHRqYqNcBLteCpVA3wYrtJXJwzy1-m4WgSM2i2JkewAeXaAQyR-bj15PD_dFspFaqMclHFY86DoelYP25SQvPP62IxorvnU4BUMzGWbUUgm9RYTOIsxIt0NDBmsbxd7hfta0g3XtksyhJQ0KNgcgkJnvWi_zL-zAoMb0ORD9XORlNBxqs',
                        'https://lh3.googleusercontent.com/aida-public/AB6AXuDZ0oW-plJrv7mcbOtoqIGlqXpxy3IBvfy3Gs2JEr4NsL4JDMTyV6IenQiaT-DiUCvHyB3jTY93IlcGqd6jN3uqaFpVHFCaqShbnuMbDJiF2oV40dhHHbsejhVE1rIz15tu55-6drmLx3rUu02hkJ3jUBAxHb9RwFt_EILl7cWhdYPjcAE1PAn1Ok2Ry9Ft_9DrxMGFVqYrrKbkraAWHJd2YOwczqJGK2bYsuNbNLg-OyUbEXJP9ndzRpC-wtPF-r1Gox3dwM7M0Rs'
                      ];
                      const bgImage = bgImages[idx % bgImages.length];

                      return (
                        <Link href={`/blog/${post.slug}`} key={post.id} className="block group font-sans blog-posts">
                          <article className="neu-flat rounded-2xl p-4 flex flex-col gap-4 relative transition-all duration-300 hover:scale-[1.02] hover:z-10 h-full">
                            <div className="aspect-[4/3] w-full rounded-xl overflow-hidden relative bg-slate-200">
                              <div
                                className="w-full h-full bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                                style={{ backgroundImage: `url('${bgImage}')` }}
                              ></div>
                            </div>
                            <div className="flex flex-col flex-1 px-2 pb-2">
                              <span className="text-xs font-bold text-[var(--color-neu-primary)] mb-2 uppercase tracking-wide">Journal</span>
                              <h3 className="text-xl font-bold text-slate-800 leading-snug mb-2 group-hover:text-[var(--color-neu-primary)] transition-colors">
                                {post.title}
                              </h3>
                              <p className="text-slate-500 text-sm line-clamp-2 mb-4">
                                {"記事の詳細を読むにはここをクリックしてください。"}
                              </p>
                              <div className="mt-auto flex items-center justify-between pt-4">
                                <span className="text-xs text-slate-400 font-medium">
                                  {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('ja-JP') : ''}
                                </span>
                                <button className="size-10 rounded-full neu-btn flex items-center justify-center text-slate-600 group-hover:text-[var(--color-neu-primary)] group-hover:translate-x-1 transition-all">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                                </button>
                              </div>
                            </div>
                          </article>
                        </Link>
                      );
                    })}
                  </div>
                </section>
              )}
            </>
          )}

          {/* Newsletter Section */}
          <section className="mt-16 mb-8">
            <div className="neu-flat rounded-[2rem] p-8 lg:p-12 relative overflow-hidden">
              <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
                <div className="max-w-md text-center lg:text-left">
                  <h2 className="text-2xl font-bold text-slate-800 mb-3">Join our community</h2>
                  <p className="text-slate-500">最新のデザイン考察や技術情報をメールでお届けします。</p>
                </div>
                <div className="w-full max-w-md">
                  <form className="flex flex-col sm:flex-row gap-4">
                    <input
                      className="flex-1 neu-pressed rounded-xl border-none px-6 py-3 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--color-neu-primary)]/20"
                      placeholder="Your email address"
                      type="email"
                    />
                    <button
                      className="neu-btn-primary rounded-xl px-8 py-3 font-bold text-white shadow-lg hover:translate-y-px transition-transform"
                      type="button"
                    >
                      Subscribe
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </section>

        </div>
      </main>

      {/* Neuromorphic Footer Custom for Blog */}
      <footer className="neu-flat mt-auto py-12 px-6 lg:px-40 border-t border-white/50">
        <div className="max-w-[960px] mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <span>© {new Date().getFullYear()} Noe Shiftica. All rights reserved.</span>
          </div>
          <div className="flex gap-6">
            <a href="#" className="size-10 rounded-full neu-btn flex items-center justify-center text-slate-500 hover:text-[var(--color-neu-primary)] transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
            </a>
            <a href="#" className="size-10 rounded-full neu-btn flex items-center justify-center text-slate-500 hover:text-[var(--color-neu-primary)] transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 11a9 9 0 0 1 9 9" /><path d="M4 4a16 16 0 0 1 16 16" /><circle cx="5" cy="19" r="1" /></svg>
            </a>
            <a href="#" className="size-10 rounded-full neu-btn flex items-center justify-center text-slate-500 hover:text-[var(--color-neu-primary)] transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" x2="12" y1="2" y2="15" /></svg>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
