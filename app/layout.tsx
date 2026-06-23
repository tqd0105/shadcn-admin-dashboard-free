import { Inter } from "next/font/google";
import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/providers/auth-provider";
import { Toaster } from "@/components/ui/sonner";
import NextTopLoader from "nextjs-toploader";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "LuxeCommerce - Mua sắm hàng hiệu",
  description: "Trải nghiệm mua sắm đẳng cấp với những sản phẩm được tuyển chọn kỹ lưỡng.",
  icons: {
    icon: "https://cdn-icons-png.flaticon.com/512/3176/3176363.png",
  },
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body className={inter.className}>
        <NextTopLoader 
          color="#006affff" 
          initialPosition={0.08} 
          crawlSpeed={200} 
          height={5} 
          crawl={true} 
          showSpinner={false} 
          easing="ease" 
          speed={200} 
          shadow="0 0 10px #18181b,0 0 5px #18181b" 
        />
        <AuthProvider>
          {children}
          <Toaster position="top-center" richColors />
        </AuthProvider>
      </body>
    </html>
  );
}
