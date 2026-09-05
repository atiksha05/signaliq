import "./globals.css";

export const metadata = {
  title: "SignalIQ",
  description: "AI Product Feedback Intelligence",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
