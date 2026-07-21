/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
  // pdfjs-dist punya dynamic require/worker-loading yang sering rusak kalau
  // di-bundle Webpack untuk server route -- biarkan Node require aslinya
  // yang jalan di runtime (bukan hasil bundling Next.js).
  experimental: {
    serverComponentsExternalPackages: ["pdfjs-dist"],
  },
  webpack: (config) => {
    // pdfjs-dist mencoba memuat modul 'canvas' yang tidak kita butuhkan
    // (kita hanya membaca teks PDF, bukan me-render gambar).
    config.resolve.alias.canvas = false;
    return config;
  },
};

export default nextConfig;
