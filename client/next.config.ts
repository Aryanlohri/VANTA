import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  devIndicators: {
    appIsrStatus: false,
    buildActivity: true,
    buildActivityPosition: "bottom-right",
  },
};

export default nextConfig;
