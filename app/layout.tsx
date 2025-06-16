"use client";

import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "./components/ThemeProvider";
import { usePathname } from "next/navigation";
import { BottomNavigationBar } from "./components/BottomNavigationBar";
import { FloatingAiButton } from "./components/FloatingAiButton";
import { useEffect, useState } from "react";

const inter = Inter({ subsets: ["latin"] });

/*
export const metadata: Metadata = {
  title: "Al-Quran Digital",
  description: "Aplikasi Al-Quran Digital dengan Next.js dan Shadcn UI",
};
*/

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const [hideComponents, setHideComponents] = useState(false);

  useEffect(() => {
    // Hide components for chat page and detail pages (e.g., /surah/1, /page/10)
    const shouldHide = pathname === "/chat" || Boolean(pathname.match(/^\/[^/]+\/\d+$/));
    setHideComponents(shouldHide);
  }, [pathname]);

  return (
    <html lang="id" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <main className="min-h-screen bg-background pb-16 md:pb-0">
            {children}
          </main>
          {!hideComponents && <BottomNavigationBar />}
          {!hideComponents && <FloatingAiButton />}
        </ThemeProvider>
      </body>
    </html>
  );
}
