import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VANTA — AI Code Intelligence",
  description: "AI-powered code review platform. Get instant line-by-line feedback, detect bugs, security vulnerabilities, and performance issues. Built for developers who ship.",
  keywords: ["code review", "AI", "code quality", "developer tools", "GitHub", "VANTA"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@200;300;400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
