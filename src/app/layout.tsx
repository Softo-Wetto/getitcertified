import "./globals.css";
import type { Metadata } from "next";
import Header from "../components/Header";
import Footer from "../components/Footer";

export const metadata: Metadata = {
  title: "GetItCertified",
  description: "Download PDFs and MP3 study resources for popular certifications.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased">
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}