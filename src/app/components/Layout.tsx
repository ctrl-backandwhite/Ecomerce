import { Outlet, ScrollRestoration } from "react-router";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { CompareBar } from "./CompareBar";
import { NewsletterPopup } from "./NewsletterPopup";
import { TimezoneSidebar } from "./TimezoneSidebar";

export function Layout() {
  return (
    /* Mobile: viewport fijo, sin scroll de página — el scroll ocurre dentro de <main>
       Desktop (sm+): layout normal min-h-screen con scroll de ventana            */
    <div className="flex flex-col h-dvh overflow-hidden sm:h-auto sm:min-h-screen sm:overflow-visible">
      <ScrollRestoration />
      <Header />
      <main className="flex-1 overflow-y-auto sm:overflow-visible">
        <Outlet />
      </main>
      <Footer />
      <CompareBar />
      <NewsletterPopup />
      <TimezoneSidebar />
    </div>
  );
}