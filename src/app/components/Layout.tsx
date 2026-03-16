import { Outlet, ScrollRestoration } from "react-router";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { CompareBar } from "./CompareBar";
import { NewsletterPopup } from "./NewsletterPopup";

export function Layout() {
  return (
    <div className="flex flex-col min-h-screen">
      <ScrollRestoration />
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <CompareBar />
      <NewsletterPopup />
    </div>
  );
}