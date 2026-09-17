import type { NextConfig } from "next";

// 部署到 GitHub Pages 时设置 GITHUB_PAGES=true(CI 里已配好),
// 本地 standalone 部署不受影响
const isGithubPages = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  output: isGithubPages ? "export" : "standalone",
  // GitHub Pages 项目页路径为 https://<user>.github.io/z-board/
  basePath: isGithubPages ? "/z-board" : "",
  images: {
    // 静态导出不支持服务端图片优化
    unoptimized: isGithubPages,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
