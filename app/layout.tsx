import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { ToastProvider } from "@/components/providers/ToastProvider";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "KnowDrive — Your files, understood.",
  description:
    "Production-quality AI Personal Knowledge Drive. Store anything, ask anything, and find the knowledge inside your files with source-grounded citations.",
  keywords: ["Knowledge Drive", "AI Assistant", "pgvector", "RAG", "Gemini", "Document Search"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased min-h-screen bg-background text-foreground flex flex-col`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
          <ToastProvider />
        </ThemeProvider>
      </body>
    </html>
  );
}
