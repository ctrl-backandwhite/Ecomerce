import { Truck, Shield, CreditCard } from "lucide-react";

export function InfoBanner() {
  return (
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 py-4">
          {/* Envío Gratis */}
          <div className="flex items-center justify-center gap-3 text-sm">
            <Truck className="w-5 h-5 text-gray-700 flex-shrink-0" />
            <span className="text-gray-700">
              <span className="hidden sm:inline">Envío gratis en compras sobre </span>
              <span className="sm:hidden">Envío gratis +</span>
              <span className="font-medium">$100</span>
            </span>
          </div>

          {/* Compra Segura */}
          <div className="flex items-center justify-center gap-3 text-sm">
            <Shield className="w-5 h-5 text-gray-700 flex-shrink-0" />
            <span className="text-gray-700">
              <span className="font-medium">Compra 100% segura</span>
            </span>
          </div>

          {/* Pago Fácil */}
          <div className="flex items-center justify-center gap-3 text-sm">
            <CreditCard className="w-5 h-5 text-gray-700 flex-shrink-0" />
            <span className="text-gray-700">
              <span className="font-medium">Múltiples métodos de pago</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
