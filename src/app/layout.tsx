import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Daily Games Hub",
  description: "Every daily game in one place, with scores and streaks.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh antialiased">
        <div className="mx-auto w-full max-w-3xl px-4 py-6">{children}</div>
      </body>
    </html>
  );
}
