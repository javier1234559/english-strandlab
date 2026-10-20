import type { Metadata } from "next";

import { AppShell } from "@/components/layout/app-shell";
import { Providers } from "@/components/layout/providers";

import "./globals.css";

export const metadata: Metadata = {
  title: "Footnote — English StrandLab",
  description: "A quiet English-learning journal powered by ChatGPT and Google Sheets.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
