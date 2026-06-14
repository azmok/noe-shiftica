import type { Metadata } from "next";

// page.tsx is a Client Component ("use client"), which cannot export `metadata`.
// This layout provides the route's metadata instead. The self-referencing
// canonical prevents inheriting the root layout's `canonical: "/"`, which would
// otherwise make this page look like a duplicate of the homepage.
export const metadata: Metadata = {
  alternates: {
    canonical: "/about",
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
