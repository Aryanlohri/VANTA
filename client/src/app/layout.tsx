import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CodeLens AI — Intelligent Code Review Platform",
  description: "AI-powered code review platform. Get instant line-by-line feedback, detect bugs, security vulnerabilities, and performance issues. Built for teams.",
  keywords: ["code review", "AI", "code quality", "developer tools", "GitHub"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
