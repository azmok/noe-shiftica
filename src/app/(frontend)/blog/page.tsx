import React from "react";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { BlogFallbackHero } from "../components/BlogFallbackHero";
import { BlogRecentStoriesClient } from "../components/BlogRecentStoriesClient";
import Link from "next/link";
import { getPostsByStatus } from "@/lib/db";

// 記事が更新された時の revalidatePath により再生成されます
export const revalidate = 86400;

export default async function BlogPage() {
  // posts テーブルの _status = 'published' の記事のみ直接クエリ
  // Payload CMS のドラフトバージョン管理を完全にバイパスする
  let posts: Awaited<ReturnType<typeof getPostsByStatus>> = [];
  try {
    posts = await getPostsByStatus('published');
  } catch (error) {
    console.error("Failed to fetch posts:", error);
  }

  const featuredPost = posts.length > 0 ? posts[0] : null;
  const recentPosts = posts.slice(1);

  return (
    <div className="bg-[var(--color-neu-bg-light)] text-slate-900 min-h-screen flex flex-col font-sans antialiased relative selection:bg-[var(--color-neu-primary)] selection:text-white">
      {/* 
        This absolute div sits behind the Header to provide contrast 
        since the background is now light but the Header text is white/transparent 
      */}
      <div className="absolute top-0 left-0 w-full h-[120px] bg-gradient-to-b from-slate-900/60 to-transparent pointer-events-none z-40"></div>

      <Header alwaysBackdrop={true} />

      <main className="flex-grow px-6 lg:px-40 py-24 md:py-32 relative z-10">
        <div className="max-w-[960px] mx-auto flex flex-col gap-10 mt-8">

          {posts.length === 0 ? (
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
                        {(() => {
                          if (featuredPost.heroUrl || featuredPost.coverUrl) {
                            const imgUrl = featuredPost.heroUrl || featuredPost.coverUrl;
                            return (
                              <>
                                <div className="absolute inset-0 bg-gradient-to-tr from-[var(--color-neu-primary)]/20 to-transparent mix-blend-overlay z-10"></div>
                                <div
                                  className="w-full h-full bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                                  style={{ backgroundImage: `url('${imgUrl}')` }}
                                ></div>
                              </>
                            );
                          }
                          return <BlogFallbackHero />;
                        })()}
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
                          <div className="neu-btn-primary h-12 px-8 rounded-xl inline-flex items-center justify-center gap-2 text-white font-bold transition-all hover:shadow-blue-500/40">
                            Read Article
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                          </div>
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
              <BlogRecentStoriesClient recentPosts={recentPosts} />
            </>
          )}

        </div>
      </main>

      <Footer variant="blog" />
    </div>
  );
}
