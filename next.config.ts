import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prevent Next.js from picking up the parent folder's package-lock.json as workspace root
  outputFileTracingRoot: path.join(__dirname)
};

export default nextConfig;
