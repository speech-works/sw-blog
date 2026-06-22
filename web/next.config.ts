import type { NextConfig } from "next";
import { withPayload } from "@payloadcms/next/withPayload";

// When the blog is mounted under speechworks.app/blog (Cloudflare routes /blog/*
// to this app without stripping the prefix), set NEXT_PUBLIC_BASE_PATH=/blog so
// routes and _next assets resolve under /blog and never collide with the landing
// site. For the blog.speechworks.app subdomain fallback, leave it unset.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  basePath: basePath || undefined,
  // Pin the workspace root to this app — a stray lockfile in the home directory
  // otherwise makes Next/Turbopack infer the wrong root.
  turbopack: { root: import.meta.dirname },
  // Keep the AWS SDK and its smithy dependencies out of the Next/webpack bundle.
  // When bundled, the V8 buffer internals change and AWS SDK signature-v4 receives
  // a SharedArrayBuffer instead of ArrayBuffer, causing a TypeError on R2 uploads.
  // Running them as native Node modules (external) avoids the transformation.
  serverExternalPackages: [
    "@aws-sdk/client-s3",
    "@smithy/core",
    "@smithy/signature-v4",
    "@smithy/middleware-serde",
  ],
};

// withPayload mounts the admin + API and configures bundling for Payload.
export default withPayload(nextConfig);
