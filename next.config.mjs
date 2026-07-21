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
  webpack: (config) => {
    // pdfjs-dist mencoba memuat modul 'canvas' yang tidak kita butuhkan
    // (kita hanya membaca teks PDF, bukan me-render gambar).
    config.resolve.alias.canvas = false;
    return config;
  },
};

export default nextConfig;
