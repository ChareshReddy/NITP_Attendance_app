import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Next IT Point - Attendance & Track Sheet Management",
  description: "Internal Employee Attendance, Track Sheets, Task Assignment and Analytics platform.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col font-body bg-[#EEF2F9] text-brand-gray">
        {children}
      </body>
    </html>
  );
}

