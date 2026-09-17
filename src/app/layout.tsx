import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth/AuthContext";
import { Toaster } from "sonner";

const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const display = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Personal Productivity OS | Spider Command Center",
  description:
    "Remember everything. Decide less. Do what matters. High-velocity executive personal operating system.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#060709",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${sans.variable} ${display.variable} font-sans min-h-screen bg-background text-foreground antialiased selection:bg-primary/30 selection:text-white spider-web-universe`}
      >
        <AuthProvider>
          {children}
          <Toaster
            richColors
            position="bottom-right"
            closeButton
            theme="dark"
            toastOptions={{
              className: "spider-card text-foreground shadow-2xl rounded-xl text-xs font-sans border-border",
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
