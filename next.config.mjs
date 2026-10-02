/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/products/copy-btac-eht-bourbon-bottle-neck-tags',
        destination: '/products/btac-eht-bourbon-bottle-neck-tags',
        permanent: true,
      },
      {
        source: '/products/custom-miscellaneous-bottle-neck-tags-77013',
        destination: '/custom/build',
        permanent: true,
      },
      {
        // Pre-builder custom order product; orders placed through it never create an inquiry or email.
        source: '/products/custom-miscellaneous-bottle-neck-tags-copy',
        destination: '/custom/build',
        permanent: true,
      },
      {
        source: '/products/6-sample-bottle-box-box-only',
        destination: '/collections/barware-accessories-1',
        permanent: true,
      },
      {
        source: '/products/2-oz-whiskey-sample-bottle-decorative-storage-box',
        destination: '/collections/barware-accessories-1',
        permanent: true,
      },
    ]
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.shopify.com',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 365,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
}

export default nextConfig
