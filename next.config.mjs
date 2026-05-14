/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'export',           // ← genera /out
    images: { unoptimized: true }, // ← para que <Image /> funcione en export
    // opcional
    trailingSlash: true,       // si lo prefieres true, CloudFront también funciona
};
export default nextConfig;
