import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The main dashboard page uses Supabase real-time subscriptions and
  // reads env vars at runtime — it must never be statically prerendered.
  // Setting `dynamic = 'force-dynamic'` via this config prevents the
  // "supabaseUrl is required" build-time crash on Vercel.
  experimental: {},
};

export default nextConfig;
