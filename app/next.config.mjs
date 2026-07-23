/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["imapflow", "nodemailer"],
  },
};

export default nextConfig;
