import "./globals.css";
import type { Metadata } from "next";
import Header from "../components/Header";
import Footer from "../components/Footer";

export const metadata: Metadata = {
  metadataBase: new URL("https://certs.softowetto.com"),
  title: {
    default: "GetITCertified | IT, Cloud, and Cyber Security Study Hub",
    template: "%s | GetITCertified",
  },
  description:
    "GetITCertified is a dark, tech-focused study hub for IT, cloud, and cyber security certification paths, PDFs, videos, bookmarks, and exam resources.",
  applicationName: "GetITCertified",
  keywords: [
    "IT certifications",
    "cyber security training",
    "cloud certifications",
    "certification study resources",
    "PDF study guides",
    "video lessons",
    "exam preparation",
  ],
  authors: [{ name: "GetITCertified" }],
  creator: "GetITCertified",
  publisher: "GetITCertified",
  category: "education",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    shortcut: "/favicon.ico",
    apple: "/icon.svg",
  },
  openGraph: {
    type: "website",
    url: "https://certs.softowetto.com",
    siteName: "GetITCertified",
    title: "GetITCertified | IT, Cloud, and Cyber Security Study Hub",
    description:
      "Browse certification paths, organize PDFs and video lessons, bookmark study targets, and prepare for IT and cyber security exams.",
    images: [
      {
        url: "/icon.svg",
        width: 512,
        height: 512,
        alt: "GetITCertified logo",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "GetITCertified | IT, Cloud, and Cyber Security Study Hub",
    description:
      "Browse certification paths, organize PDFs and video lessons, bookmark study targets, and prepare for IT and cyber security exams.",
    images: ["/icon.svg"],
  },
  robots: {
    index: true,
    follow: true,
  },
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
