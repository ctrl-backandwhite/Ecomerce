import { useState } from "react";
import { X, Mail, CheckCircle2, Gift } from "lucide-react";
import { useNewsletter } from "../context/NewsletterContext";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";

export function NewsletterPopup() {
  const { showPopup, dismiss, subscribe } = useNewsletter();
  const [email, setEmail] = useState("");
  const [done,  setDone]  = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) { toast.error("Introduce un email válido"); return; }
    subscribe(email);
    setDone(true);
    setTimeout(() => dismiss(), 2500);
    toast.success("¡Suscripción confirmada! Revisa tu email.");
  };

  return (
    <AnimatePresence>
      {showPopup && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50"
            onClick={dismiss}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden pointer-events-auto">
              {/* Top decoration */}
              <div className="bg-gray-600 px-6 pt-8 pb-6 text-center relative">
                <button
                  onClick={dismiss}
                  className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-3">
                  <Gift className="w-6 h-6 text-white" strokeWidth={1.5} />
                </div>
                <p className="text-white text-lg tracking-tight">-10% en tu primera compra</p>
                <p className="text-gray-400 text-xs mt-1.5">Suscríbete y recibe el cupón al instante</p>
              </div>

              {/* Body */}
              <div className="px-6 py-6">
                {done ? (
                  <div className="text-center py-4">
                    <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" strokeWidth={1.5} />
                    <p className="text-sm text-gray-900 mb-1">¡Gracias por suscribirte!</p>
                    <p className="text-xs text-gray-400">Revisa tu email — el cupón está en camino.</p>
                  </div>
                ) : (
                  <>
                    <form onSubmit={handleSubmit} className="space-y-3">
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" />
                        <input
                          type="email"
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          placeholder="tu@email.com"
                          className="w-full h-9 pl-9 pr-3 text-xs text-gray-900 border border-gray-200 rounded-xl focus:outline-none focus:border-gray-400 placeholder-gray-300"
                        />
                      </div>
                      <button type="submit" className="w-full h-9 text-xs text-gray-700 bg-gray-200 rounded-xl hover:bg-gray-300 transition-colors">
                        Obtener mi cupón -10%
                      </button>
                    </form>
                    <p className="text-[10px] text-gray-400 text-center mt-3">
                      Sin spam. Te puedes dar de baja en cualquier momento.
                    </p>
                  </>
                )}
              </div>

              {/* Skip */}
              <div className="pb-5 text-center">
                <button onClick={dismiss} className="text-xs text-gray-400 hover:text-gray-600 underline transition-colors">
                  No gracias, prefiero pagar precio completo
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}