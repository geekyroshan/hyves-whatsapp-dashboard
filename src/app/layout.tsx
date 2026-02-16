import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";
import { StatusBanner } from "@/components/status-banner";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Hyves WhatsApp Dashboard",
  description: "Manage your WhatsApp scrapper - messages, contacts, groups",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} antialiased`}>
        <TooltipProvider>
          <Sidebar />
          <main className="md:ml-64">
            <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-background/80 backdrop-blur-sm px-6">
              <div className="ml-10 md:ml-0" />
              <StatusBanner />
            </header>
            <div className="p-6">{children}</div>
          </main>
          <Toaster />
        </TooltipProvider>
      </body>
    </html>
  );
}
