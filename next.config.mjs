/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Node.js 네이티브 모듈 번들링 제외
  serverExternalPackages: ["fluent-ffmpeg", "ffmpeg-static", "openai"],
}

export default nextConfig
