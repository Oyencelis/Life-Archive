import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Lets the dev server accept HMR/asset requests when you open it via
  // the machine's LAN IP (e.g. from another device on the network)
  // instead of localhost.
  allowedDevOrigins: ["192.168.0.169"],
};

export default nextConfig;
