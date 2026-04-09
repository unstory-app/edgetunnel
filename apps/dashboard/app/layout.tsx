import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EdgeTunnel Dashboard",
  description: "Manage API keys, usage, and plans for your EdgeTunnel proxy network.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
