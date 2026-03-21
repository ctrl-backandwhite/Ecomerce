import { useRef, useEffect, Suspense } from "react";
import { Outlet, ScrollRestoration, useLocation } from "react-router";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { CompareBar } from "./CompareBar";
import { NewsletterPopup } from "./NewsletterPopup";
import { TimezoneSidebar } from "./TimezoneSidebar";

/**
 * On mobile the scroll container is <main> (overflow-y-auto), not the window.
 * ScrollRestoration only handles window scroll, so we manually save/restore
 * the <main> element's scrollTop keyed by location.key.
 */
const scrollMap = new Map<string, number>();

export function Layout() {
  const mainRef = useRef<HTMLElement>(null);
  const location = useLocation();
  const prevKeyRef = useRef(location.key);

  /* Save scroll position of <main> whenever we navigate away */
  useEffect(() => {
    const prevKey = prevKeyRef.current;
    prevKeyRef.current = location.key;

    if (mainRef.current && prevKey && prevKey !== location.key) {
      scrollMap.set(prevKey, mainRef.current.scrollTop);
    }

    // Restore scroll position for the incoming location
    const saved = scrollMap.get(location.key);
    if (saved != null && mainRef.current) {
      // Small raf delay to let React render the content first
      requestAnimationFrame(() => {
        if (mainRef.current) mainRef.current.scrollTop = saved;
      });
    }
  }, [location.key]);

  return (
    /* Mobile: viewport fijo, sin scroll de página — el scroll ocurre dentro de <main>
       Desktop (sm+): layout normal min-h-screen con scroll de ventana            */
    <div className="flex flex-col h-dvh overflow-hidden sm:h-auto sm:min-h-screen sm:overflow-visible">
      <ScrollRestoration />
      <Header />
      <main ref={mainRef} className="flex-1 overflow-y-auto sm:overflow-visible">
        <Suspense fallback={<div className="flex items-center justify-center h-full min-h-48"><div className="w-6 h-6 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" /></div>}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
      <CompareBar />
      <NewsletterPopup />
      <TimezoneSidebar />
    </div>
  );
}