import type { NextConfig } from "next";

// When the blog is mounted under speechworks.app/blog (Cloudflare routes /blog/*
// to this app without stripping the prefix), set NEXT_PUBLIC_BASE_PATH=/blog so
// routes and _next assets resolve under /blog and never collide with the landing
// site. For the blog.speechworks.app subdomain fallback, leave it unset.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  basePath: basePath || undefined,
};

export default nextConfig;
