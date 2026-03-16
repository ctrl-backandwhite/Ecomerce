import { Truck, Shield, CreditCard } from "lucide-react";

export function InfoBanner() {
  return (
    <div className="hidden sm:block bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:grid md:grid-cols-3 divide-y divide-gray-100 md:divide-y-0 md:gap-6 py-2 md:py-4">
          {/* Envío Gratis */}
          <div className="flex items-center justify-center gap-3 text-sm py-3 md:py-0">
            <Truck className="w-5 h-5 text-gray-700 flex-shrink-0" />
            <span className="text-gray-700">
              <span className="hidden sm:inline">Envío gratis en compras sobre </span>
              <span className="sm:hidden">Envío gratis +</span>
              <span className="font-medium">$100</span>
            </span>
          </div>

          {/* Compra Segura */}
          <div className="flex items-center justify-center gap-3 text-sm py-3 md:py-0">
            <Shield className="w-5 h-5 text-gray-700 flex-shrink-0" />
            <span className="text-gray-700 font-medium">Compra 100% segura</span>
          </div>

          {/* Pago Fácil */}
          <div className="flex items-center justify-center gap-3 text-sm py-3 md:py-0">
            <CreditCard className="w-5 h-5 text-gray-700 flex-shrink-0" />
            <span className="text-gray-700 font-medium">Múltiples métodos de pago</span>
          </div>
        </div>
      </div>
    </div>
  );
}