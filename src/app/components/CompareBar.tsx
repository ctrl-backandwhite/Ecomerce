import { useCompare } from "../context/CompareContext";
import { X, BarChart2, Trash2 } from "lucide-react";
import { Link } from "react-router";
import { motion, AnimatePresence } from "motion/react";

export function CompareBar() {
  const { items, remove, clear } = useCompare();

  return (
    <AnimatePresence>
      {items.length > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0,   opacity: 1 }}
          exit={{ y: 100,    opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4"
        >
          <div className="bg-white border border-gray-200 rounded-2xl shadow-xl px-5 py-3.5 flex items-center gap-4">
            {/* Icon */}
            <div className="w-8 h-8 rounded-lg bg-gray-500 flex items-center justify-center flex-shrink-0">
              <BarChart2 className="w-4 h-4 text-white" strokeWidth={1.5} />
            </div>

            {/* Products */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {items.map(p => (
                <div key={p.id} className="relative flex-shrink-0 group">
                  <img
                    src={p.image}
                    alt={p.name}
                    className="w-9 h-9 rounded-lg object-cover border border-gray-100 bg-gray-50"
                  />
                  <button
                    onClick={() => remove(p.id)}
                    className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-gray-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </div>
              ))}
              {Array.from({ length: 4 - items.length }).map((_, i) => (
                <div key={`empty-${i}`} className="w-9 h-9 rounded-lg border border-dashed border-gray-200 flex items-center justify-center flex-shrink-0">
                  <span className="text-gray-200 text-sm">+</span>
                </div>
              ))}
              <p className="text-xs text-gray-500 min-w-0 truncate hidden sm:block">
                {items.length} de 4 productos
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={clear}
                className="w-7 h-7 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <Link
                to="/compare"
                className="h-8 px-4 text-xs text-gray-700 bg-gray-200 rounded-xl hover:bg-gray-300 transition-colors flex items-center"
              >
                Comparar
              </Link>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}