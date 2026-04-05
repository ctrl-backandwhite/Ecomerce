import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { newsletterRepository } from "../repositories/CmsRepository";

interface NewsletterContextType {
  showPopup: boolean;
  dismiss: () => void;
  subscribe: (email: string) => Promise<void>;
}

const Ctx = createContext<NewsletterContextType | undefined>(undefined);

export function NewsletterProvider({ children }: { children: ReactNode }) {
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem("nexa_newsletter_dismissed");
    if (!dismissed) {
      const t = setTimeout(() => setShowPopup(true), 4000);
      return () => clearTimeout(t);
    }
  }, []);

  const dismiss = () => {
    setShowPopup(false);
    localStorage.setItem("nexa_newsletter_dismissed", "1");
  };

  const subscribe = async (email: string) => {
    try {
      await newsletterRepository.subscribe(email);
    } catch { /* popup still dismisses on error */ }
    dismiss();
  };

  return <Ctx.Provider value={{ showPopup, dismiss, subscribe }}>{children}</Ctx.Provider>;
}

export function useNewsletter() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useNewsletter must be used within NewsletterProvider");
  return ctx;
}