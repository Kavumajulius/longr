import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/.well-known/apple-developer-merchantid-domain-association",
        destination: "https://whop.com/.well-known/apple-platform-integrator/apple-developer-merchantid-domain-association",
      },
    ];
  },
};

export default nextConfig;
