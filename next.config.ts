import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "reviewnote-production.s3.ap-northeast-2.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "dq-files.gcdn.ntruss.com",
      },
      {
        protocol: "https",
        hostname: "dinnerqueen.net",
      },
      {
        protocol: "https",
        hostname: "gangnam-review.net",
      },
      {
        protocol: "https",
        hostname: "cdn.cdnreviewplace.co.kr",
      },
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
        pathname: "/v0/b/reviewnote-e92d9.appspot.com/**",
      },
      {
        protocol: "https",
        hostname: "www.seoulouba.co.kr",
      },
      {
        protocol: "https",
        hostname: "xn--6j1br0ag3lba435lvsj96p.com",
      },
      {
        protocol: "https",
        hostname: "pavlovu.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "ssl.pstatic.net",
      },
      {
        protocol: "https",
        hostname: "phinf.pstatic.net",
      },
      {
        protocol: "https",
        hostname: "logo.clearbit.com",
      },
      {
        protocol: "https",
        hostname: "www.google.com",
      },
      {
        protocol: "https",
        hostname: "www.reviewplace.co.kr",
      },
    ],
  },
};

export default nextConfig;
