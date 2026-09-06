import "./globals.css";

export const metadata = {
  title: "SignalIQ — Product Intelligence",
  description:
    "AI-powered Voice of Customer intelligence for product teams.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}