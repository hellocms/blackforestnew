/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    // Core Ant Design packages
    'antd',
    '@ant-design/icons',
    '@ant-design/icons-svg',
    // Unscoped rc-* packages
    'rc-util',
    'rc-picker',
    'rc-tree',
    'rc-table',
    'rc-input',
    'rc-pagination',
    'rc-select',
    'rc-textarea',
    'rc-dropdown',
    'rc-menu',
    'rc-notification',
    // Scoped @rc-component/* packages
    '@rc-component/util',    // Current error
    '@rc-component/portal',  // Common in Ant Design for modals/popovers
    '@rc-component/context', // Context utilities
    '@rc-component/tour',    // For tours/tooltips
  ],
  webpack: (config) => {
    config.resolve.fallback = { fs: false, path: false };
    return config;
  },
};

export default nextConfig;