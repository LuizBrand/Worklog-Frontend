import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Providers } from "./providers";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-sans",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
});

// Marca e títulos apenas — tem personalidade demais para corpo de texto
// numa UI densa de tickets. Ver memory/brand.md.
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "WorkLog",
  description: "Diário compartilhado do time de suporte",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={cn(
        "h-full antialiased font-sans",
        inter.variable,
        jetbrainsMono.variable,
        spaceGrotesk.variable,
      )}
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
