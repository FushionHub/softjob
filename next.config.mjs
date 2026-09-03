/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        unoptimized: true,
    },
    productionBrowserSourceMaps: false,
    // Turbopack sourceMap warnings are from node_modules dev server chunks — ignore
    webpack: (config) => {
        config.ignoreWarnings = [
            ...(config.ignoreWarnings || []),
            { module: /node_modules/ },
            /Invalid source map/,
        ];
        return config;
    },
};

export default nextConfig;
