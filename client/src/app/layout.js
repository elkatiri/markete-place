import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Toaster } from "react-hot-toast";

export const metadata = {
  title: "Marketplace - Buy & Sell Online",
  description: "A premium online marketplace where users can sell and buy products",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#2563eb",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col">
        <AuthProvider>
          <Navbar />
          <main className="mobile-app-shell flex-1 pb-[calc(6.5rem+env(safe-area-inset-bottom))] md:pb-0">{children}</main>
          <Footer />
          <Toaster
            position="top-center"
            toastOptions={{
              style: { borderRadius: "12px", padding: "12px 16px", fontSize: "14px" },
              success: { iconTheme: { primary: "#059669", secondary: "#fff" } },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
