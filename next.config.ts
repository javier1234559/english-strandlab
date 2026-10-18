import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Allow ChatGPT / MCP Apps hosts to embed the app in an iframe widget
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "frame-ancestors",
              "'self'",
              "https://chatgpt.com",
              "https://*.chatgpt.com",
              "https://chat.openai.com",
              "https://*.openai.com",
              "https://*.oaiusercontent.com",
            ].join(" "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
