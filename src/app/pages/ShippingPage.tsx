import { Truck, Clock, MapPin, Package, RefreshCcw, Shield } from "lucide-react";

const carriers = [
  { name: "NX036 Express",     time: "24 h",        price: "Gratis +$100 / $4.99",  zones: "España y Portugal"   },
  { name: "Standard",         time: "3–5 días",    price: "Gratis +$50 / $2.99",   zones: "España y Portugal"   },
  { name: "UPS International",time: "5–7 días",    price: "Desde $9.99",           zones: "Unión Europea"       },
  { name: "FedEx Global",     time: "7–14 días",   price: "Desde $14.99",          zones: "LATAM y resto mundo" },
];

const steps = [
  { n: "01", title: "Confirmación",   desc: "Recibes email + factura en cuanto confirmas el pago." },
  { n: "02", title: "Preparación",    desc: "El equipo de almacén prepara y empaqueta tu pedido (1–2 días)." },
  { n: "03", title: "Despacho",       desc: "El paquete sale con el transportista y recibes número de tracking." },
  { n: "04", title: "En camino",      desc: "Puedes seguir tu paquete en tiempo real desde el email o tu cuenta." },
  { n: "05", title: "Entrega",        desc: "El mensajero entrega en la dirección indicada o punto de recogida." },
];

const policies = [
  { icon: RefreshCcw, title: "Devoluciones gratuitas",  desc: "30 días, sin preguntas, en España y México." },
  { icon: Shield,     title: "Envío asegurado",         desc: "Todos los paquetes van asegurados por su valor íntegro." },
  { icon: Package,    title: "Embalaje sostenible",     desc: "100 % reciclado y libre de plásticos innecesarios." },
  { icon: MapPin,     title: "Puntos de recogida",      desc: "Más de 2000 lockers y tiendas colaboradoras." },
];

export function ShippingPage() {
  return (
    <div className="min-h-screen bg-white">

      {/* Hero */}
      <section className="border-b border-gray-100 py-14 px-4 text-center">
        <p className="text-xs text-gray-400 uppercase tracking-widest mb-3">Información de envíos</p>
        <h1 className="text-4xl text-gray-900 tracking-tight mb-3">Envíos rápidos y seguros</h1>
        <p className="text-sm text-gray-500 max-w-md mx-auto">
          Trabajamos con los mejores transportistas para que tu pedido llegue en perfectas condiciones y a tiempo.
        </p>
      </section>

      {/* Carriers */}
      <section className="py-14 px-4">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-6">Métodos de envío disponibles</p>
          <div className="border border-gray-100 rounded-2xl overflow-hidden">
            <div className="grid grid-cols-4 px-5 py-3 bg-gray-50 border-b border-gray-100">
              {["Transportista", "Plazo estimado", "Tarifa", "Zona de cobertura"].map(h => (
                <p key={h} className="text-[10px] text-gray-400 uppercase tracking-wider">{h}</p>
              ))}
            </div>
            {carriers.map((c, i) => (
              <div key={c.name} className={`grid grid-cols-4 px-5 py-4 items-center ${i !== carriers.length - 1 ? "border-b border-gray-50" : ""}`}>
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <Truck className="w-3.5 h-3.5 text-gray-600" strokeWidth={1.5} />
                  </div>
                  <p className="text-sm text-gray-900">{c.name}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-gray-400" strokeWidth={1.5} />
                  <p className="text-sm text-gray-600">{c.time}</p>
                </div>
                <p className="text-sm text-gray-600">{c.price}</p>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-gray-400" strokeWidth={1.5} />
                  <p className="text-sm text-gray-600">{c.zones}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-3">* Los plazos son estimados y no incluyen festivos. El envío express debe confirmarse antes de las 13:00 h.</p>
        </div>
      </section>

      {/* Steps */}
      <section className="py-14 px-4 bg-gray-50/40 border-t border-gray-100">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-8 text-center">¿Cómo funciona?</p>
          <div className="grid sm:grid-cols-5 gap-4">
            {steps.map(s => (
              <div key={s.n} className="bg-white border border-gray-100 rounded-2xl p-4 text-center">
                <p className="text-xl text-gray-200 tracking-tight mb-2">{s.n}</p>
                <p className="text-sm text-gray-900 mb-1.5">{s.title}</p>
                <p className="text-xs text-gray-400 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Policies */}
      <section className="py-14 px-4 border-t border-gray-100">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-8 text-center">Nuestro compromiso</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {policies.map(p => (
              <div key={p.title} className="border border-gray-100 rounded-2xl p-5">
                <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center mb-3">
                  <p.icon className="w-4 h-4 text-gray-700" strokeWidth={1.5} />
                </div>
                <p className="text-sm text-gray-900 mb-1.5">{p.title}</p>
                <p className="text-xs text-gray-500 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Free shipping banner */}
      <section className="py-10 px-4 bg-gray-700 text-center">
        <p className="text-white text-sm">Envío gratuito en pedidos superiores a <span className="text-gray-300">$50</span> en España · <span className="text-gray-300">$100</span> en resto de Europa</p>
      </section>
    </div>
  );
}