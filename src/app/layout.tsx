import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import { RegisterSW } from "@/components/RegisterSW";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tuto DT HR",
  description:
    "Ton tuteur de révision en Technologie Hôtelière. Il te guide, il ne te donne pas la réponse tout de suite.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Tuto DT HR" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // L'app occupe la hauteur réelle du téléphone, clavier compris.
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F7F5F0" },
    { media: "(prefers-color-scheme: dark)", color: "#0E1516" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="mx-auto flex h-dvh max-w-lg flex-col">
        {children}
        <Toaster position="top-center" richColors />
        <RegisterSW />
      </body>
    </html>
  );
}
