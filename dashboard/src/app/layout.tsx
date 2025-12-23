import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "UAE Plate Auction Analytics",
  description: "Track price trends for UAE number plate auctions across all emirates",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
