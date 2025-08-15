import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import QueryProvider from "@/components/providers/QueryProvider";
import ClientAuthLoader from "@/components/ClientAuthLoader";
import ClientHeader from "@/components/ClientHeader";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "IT Issue Tracker",
  description: "Realtime & Webhook Ready Issue Tracker",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <QueryProvider>
          <ClientAuthLoader>
            <div className="container mx-auto p-4">
              <header className="flex items-center justify-between mb-4">
                <h1 className="text-lg font-semibold">IT Issue Tracker</h1>
                {/* Logout button available on every page (client) */}
                <div>
                  <ClientHeader />
                </div>
              </header>

              <main>
                {children}
              </main>
            </div>
          </ClientAuthLoader>
        </QueryProvider>
      </body>
    </html>
  );
}