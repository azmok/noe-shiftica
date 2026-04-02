import React from "react"
import Script from "next/script"
import { Header } from "../components/Header"
import { Footer } from "../components/Footer";
import { BlogFallbackHero } from "../components/BlogFallbackHero";
import { BlogRecentStoriesClient } from "../components/BlogRecentStoriesClient";
import Link from "next/link";
import { getPostsByStatus, getDistinctTags } from "@/lib/db";
import { GcsImage } from "@/lib/GcsImage";

// 記事が更新された時の revalidatePath により再生成されます
export default async function BlogPage() {
  // posts テーブルの _status = 'published' の記事のみ直接クエリ
  // Payload CMS のドラフトバージョン管理を完全にバイパスする
  let posts: Awaited<ReturnType<typeof getPostsByStatus>> = [];
  let tags: string[] = [];
  try {
    [posts, tags] = await Promise.all([
      getPostsByStatus('published'),
      getDistinctTags(),
    ]);
  } catch (error) {
    console.error("Failed to fetch posts:", error);
  }

  const featuredPost = posts.length > 0 ? posts[0] : null;
  const recentPosts = posts.slice(1);

  return (
    <div className="min-h-screen bg-background-void font-sans antialiased relative selection:bg-(--color-neu-primary)/40 overflow-hidden">
      {/* Premium Depth Background Elements */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Mesh Gradient Blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-(--color-neu-primary)/10 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] rounded-full bg-(--color-neu-primary)/5 blur-[100px]" />
        <div className="absolute top-[40%] right-[10%] w-[20%] h-[20%] rounded-full bg-blue-500/5 blur-[80px]" />

        {/* SVG Noise Texture Overlay */}
        <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none" style={{ filter: 'url(#noiseFilter)' }}></div>
      </div>

      <Header />

      <main className="grow px-4 sm:px-6 lg:px-12 pt-20 pb-24 md:pt-28 md:pb-32 relative z-10 transition-colors duration-500">
        <div className="max-w-7xl mx-auto flex flex-col gap-8 md:gap-10 mt-2 md:mt-8">

          {posts.length === 0 ? (
            <div className="text-center p-12 bg-white/5 border border-white/10 rounded-2xl w-full backdrop-blur-sm">
              <h3 className="text-2xl font-bold mb-4 text-white">
                No articles yet
              </h3>
              <p className="text-slate-400 mb-8 max-w-md mx-auto">
                Payload CMSの「Posts」コレクションから記事が投稿されると、ここに表示されます。現在準備中です。
              </p>
              <Link
                href="/admin"
                className="text-(--color-neu-primary) font-bold hover:underline transition-colors"
              >
                Adminパネルへログインする
              </Link>
            </div>
          ) : (
            <>
              {/* Desktop Featured Post Hero */}
              {featuredPost && (
                <section className="hidden md:block">
                  <Link href={`/blog/${featuredPost.slug}`} className="block posts featured group">
                    <div className="border border-white/10 bg-white/5 backdrop-blur-md p-6 sm:p-8 rounded-3xl flex flex-col lg:flex-row gap-10 items-center cursor-pointer transition-all hover:border-white/20 duration-300 hover:-translate-y-1 shadow-2xl">
                      <div className="w-full lg:w-1/2 aspect-video rounded-2xl overflow-hidden shadow-2xl relative bg-black/40">
                        {(() => {
                          const preGenUrl = featuredPost.heroMediumUrl || featuredPost.coverMediumUrl;
                          const imgUrl = preGenUrl || featuredPost.heroUrl || featuredPost.coverUrl;
                          if (imgUrl) {
                            return (
                              <>
                                <div className="absolute inset-0 bg-linear-to-tr from-(--color-neu-primary)/20 to-transparent mix-blend-overlay z-10 pointer-events-none" />
                                <div className="w-full h-full transition-transform duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-110">
                                  <GcsImage
                                    src={imgUrl}
                                    alt={featuredPost.title}
                                    priority
                                    preOptimized={!!preGenUrl}
                                    objectFit="cover"
                                    className="w-full h-full"
                                  />
                                </div>
                              </>
                            );
                          }
                          return <BlogFallbackHero />;
                        })()}
                      </div>
                      <div className="flex flex-col gap-5 w-full lg:w-1/2 lg:pr-6">
                        <div className="flex items-center gap-3">
                          <span className="px-3 py-1 rounded-full bg-(--color-neu-primary)/20 text-[10px] font-bold text-(--color-neu-primary) uppercase tracking-widest border border-(--color-neu-primary)/30">Featured</span>
                          {featuredPost.publishedAt && (
                            <span className="text-slate-400 text-sm font-medium">
                              {featuredPost.publishedAt ? new Date(featuredPost.publishedAt).toISOString().split('T')[0].replace(/-/g, '.') : ''}
                            </span>
                          )}
                        </div>
                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight tracking-tighter">
                          {featuredPost.title}
                        </h1>

                        <div className="pt-2">
                          <div className="h-10 px-6 rounded-lg inline-flex items-center justify-center gap-2 bg-(--color-neu-primary) text-black text-sm font-bold transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(var(--color-neu-primary-rgb),0.3)]">
                            Read Article
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </section>
              )}

              {/* Mobile Featured Post Section */}
              {featuredPost && (
                <section className="md:hidden blog-posts">
                  <Link href={`/blog/${featuredPost.slug}`} className="block">
                    <div className="relative w-full aspect-video rounded-[24px] overflow-hidden shadow-2xl bg-black">
                      {(() => {
                        const imgUrl = featuredPost.heroUrl || featuredPost.coverUrl;
                        if (imgUrl) {
                          return (
                            <GcsImage
                              src={imgUrl}
                              alt={featuredPost.title}
                              priority
                              objectFit="cover"
                              className="w-full h-full"
                            />
                          );
                        }
                        return <BlogFallbackHero />;
                      })()}
                      <div className="absolute inset-x-0 bottom-0 h-full bg-linear-to-t from-black/90 via-black/50 to-transparent z-10 pointer-events-none" />
                      <div className="absolute bottom-0 left-0 right-0 p-6 z-20">
                        <h2 className="text-lg font-sans text-white leading-tight mb-2 drop-shadow-[0_2px_1px_rgba(0,0,0,1)]">
                          {featuredPost.title}
                        </h2>
                        <div className="flex items-center gap-2 text-white/60 text-xs font-sans drop-shadow-md">
                          <span>{featuredPost.publishedAt ? new Date(featuredPost.publishedAt).toISOString().split('T')[0].replace(/-/g, '.') : ''}</span>
                        </div>
                      </div>
                      <span className="absolute bottom-[10px] right-[10px] px-3 py-1 rounded-full bg-(--color-neu-primary) text-[10px] font-bold text-black uppercase tracking-widest z-30 shadow-lg">
                        Featured
                      </span>
                    </div>
                  </Link>
                </section>
              )}

              {/* Mobile Tag Scroll */}
              {tags.length > 0 && (
                <div className="md:hidden -mx-4 overflow-x-auto flex items-center gap-3 px-4 no-scrollbar">
                  <Link
                    href="/blog"
                    className="px-5 py-2 rounded-full whitespace-nowrap text-xs font-bold transition-all bg-white/10 border border-white/20 text-white shadow-lg"
                  >
                    All
                  </Link>
                  {tags.map((tag) => (
                    <Link
                      key={tag}
                      href={`/blog/tag/${encodeURIComponent(tag)}`}
                      className="px-5 py-2 rounded-full whitespace-nowrap text-xs font-bold transition-all bg-white/5 border border-white/10 text-slate-400 hover:text-white active:bg-white/10"
                    >
                      {tag}
                    </Link>
                  ))}
                </div>
              )}

              {/* Search Bar (Tablet focus) */}
              <div className="hidden sm:block lg:hidden mt-4">
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

      {/* GLOBAL FAILSAFE: Force visibility for any images stuck at opacity: 0 */}
      <Script
        id="force-image-visibility"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              const forceImages = () => {
                document.querySelectorAll('img').forEach(img => {
                  try {
                    if (img.closest('.hidden')) return;
                    const inlineStyle = img.style.opacity;
                    const computedStyle = window.getComputedStyle(img);
                    if (inlineStyle === '0' || computedStyle.opacity === '0') {
                      img.style.setProperty('opacity', '1', 'important');
                      img.style.setProperty('visibility', 'visible', 'important');
                      img.classList.add('is-forced-loaded');
                    }
                  } catch (e) {}
                });
              };
              forceImages();
              window.addEventListener('load', forceImages);
              window.addEventListener('pageshow', forceImages);
              const interval = setInterval(forceImages, 1000);
              setTimeout(() => clearInterval(interval), 8000);
            })();
          `
        }}
      />
    </div>
  );
}
