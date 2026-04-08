import { useState } from "react";
import { ChevronDown, Search, HelpCircle } from "lucide-react";
import { Link } from "react-router";

const FAQS = [
  {
    category: "Pedidos y envíos",
    items: [
      { q: "¿Cuánto tarda en llegar mi pedido?", a: "Los pedidos estándar se entregan en 3–5 días hábiles. Con envío express (disponible al hacer checkout) recibes tu paquete en 24 h. Pedidos internacionales: 7–14 días hábiles." },
      { q: "¿Cómo puedo rastrear mi pedido?", a: "Una vez despachado recibirás un email con el número de seguimiento. También puedes consultarlo en Cuenta → Mis Pedidos, o directamente en la página de Seguimiento de Pedido." },
      { q: "¿Realizan envíos internacionales?", a: "Sí, enviamos a 28 países en Europa y LATAM. Los costos y tiempos varían según el destino y se calculan automáticamente al hacer checkout." },
      { q: "¿Qué pasa si no estoy en casa al momento de la entrega?", a: "El mensajero dejará un aviso. Puedes reprogramar la entrega desde el enlace del email de seguimiento o recoger el paquete en el punto de recogida más cercano." },
    ],
  },
  {
    category: "Devoluciones y garantía",
    items: [
      { q: "¿Cuál es la política de devoluciones?", a: "Tienes 30 días desde la recepción para devolver cualquier producto en perfecto estado y embalaje original. Las devoluciones son gratuitas para pedidos en España y México." },
      { q: "¿Cómo inicio una devolución?", a: "Ve a Cuenta → Mis Pedidos → Solicitar devolución. Una vez aprobada recibirás la etiqueta de envío prepago por email. El reembolso se procesa en 3–5 días hábiles tras recibir el producto." },
      { q: "¿El producto tiene garantía?", a: "Todos los productos incluyen la garantía oficial del fabricante (mínimo 2 años en la UE). Adicionalmente, NX036 ofrece garantía extendida de 1 año adicional en productos electrónicos." },
      { q: "¿Qué hago si recibo un producto dañado o incorrecto?", a: "Contacta con nosotros en las primeras 48 h adjuntando fotos. Te enviaremos un reemplazo sin coste o gestionaremos el reembolso completo de forma prioritaria." },
    ],
  },
  {
    category: "Pagos y facturas",
    items: [
      { q: "¿Qué métodos de pago aceptan?", a: "Aceptamos tarjetas Visa y Mastercard, PayPal, transferencia bancaria y criptomonedas (USDT y Bitcoin). Todos los pagos están cifrados con SSL." },
      { q: "¿Puedo pagar a plazos?", a: "Sí, ofrecemos financiación sin intereses a 3, 6 y 12 meses en compras superiores a $200 mediante Stripe Installments. La opción aparece en el checkout." },
      { q: "¿Cómo obtengo mi factura?", a: "Tu factura se genera automáticamente al confirmar el pedido. La encontrarás en Cuenta → Mis Pedidos → Ver Factura, y se enviará también por email en PDF." },
      { q: "¿Puedo solicitar factura con datos de empresa (B2B)?", a: "Sí. Al hacer checkout encontrarás la opción 'Factura para empresa'. Introduce el NIF/CIF y los datos fiscales. La factura se emite en 24 h." },
    ],
  },
  {
    category: "Cuenta y fidelidad",
    items: [
      { q: "¿Cómo funciona el programa de puntos NX036?", a: "Ganas 1 punto por cada $1 gastado. Con 500 puntos obtienes un descuento de $5. Los puntos no caducan y pueden combinarse con cupones de descuento." },
      { q: "¿Puedo comprar sin crear una cuenta?", a: "Sí, puedes hacer checkout como invitado. Sin embargo, con cuenta podrás rastrear pedidos, guardar favoritos, acumular puntos y gestionar devoluciones fácilmente." },
      { q: "¿Cómo cambio mi contraseña?", a: "Ve a Cuenta → Configuración → Cambiar contraseña. Si no recuerdas tu contraseña, usa la opción 'Olvidé mi contraseña' en la pantalla de inicio de sesión." },
      { q: "¿Cómo elimino mi cuenta?", a: "Puedes solicitar la eliminación de tu cuenta y datos personales desde Cuenta → Configuración → Eliminar cuenta, de acuerdo con el RGPD." },
    ],
  },
];

export function FAQPage() {
  const [search, setSearch] = useState("");
  const [openKeys, setOpenKeys] = useState<Set<string>>(new Set());

  const toggle = (key: string) => {
    setOpenKeys(prev => {
      const s = new Set(prev);
      s.has(key) ? s.delete(key) : s.add(key);
      return s;
    });
  };

  const filtered = FAQS.map(cat => ({
    ...cat,
    items: cat.items.filter(
      item => !search || item.q.toLowerCase().includes(search.toLowerCase()) || item.a.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter(cat => cat.items.length > 0);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="border-b border-gray-100 py-14 px-4 text-center">
        <p className="text-xs text-gray-400 uppercase tracking-widest mb-3">Centro de ayuda</p>
        <h1 className="text-4xl text-gray-900 tracking-tight mb-6">Preguntas frecuentes</h1>
        <div className="relative max-w-md mx-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar en las preguntas…"
            className="w-full h-10 pl-10 pr-4 text-sm text-gray-900 border border-gray-200 rounded-xl focus:outline-none focus:border-gray-400 placeholder-gray-300"
          />
        </div>
      </section>

      {/* FAQ list */}
      <section className="py-12 px-4">
        <div className="max-w-3xl mx-auto space-y-10">
          {filtered.length === 0 && (
            <div className="text-center py-16">
              <HelpCircle className="w-10 h-10 text-gray-200 mx-auto mb-3" strokeWidth={1} />
              <p className="text-sm text-gray-400">No se encontraron resultados para "{search}"</p>
            </div>
          )}
          {filtered.map(cat => (
            <div key={cat.category}>
              <p className="text-xs text-gray-400 uppercase tracking-widest mb-4">{cat.category}</p>
              <div className="space-y-2">
                {cat.items.map((item, i) => {
                  const key = `${cat.category}-${i}`;
                  const open = openKeys.has(key);
                  return (
                    <div key={key} className="border border-gray-100 rounded-xl overflow-hidden">
                      <button
                        onClick={() => toggle(key)}
                        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
                      >
                        <span className="text-sm text-gray-900 pr-4">{item.q}</span>
                        <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`} strokeWidth={1.5} />
                      </button>
                      {open && (
                        <div className="px-5 pb-4 border-t border-gray-50">
                          <p className="text-sm text-gray-500 leading-relaxed pt-3">{item.a}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 px-4 bg-gray-50/50 border-t border-gray-100">
        <div className="max-w-xl mx-auto text-center">
          <p className="text-sm text-gray-900 mb-2">¿No encontraste lo que buscabas?</p>
          <p className="text-xs text-gray-400 mb-5">Nuestro equipo está disponible de lunes a viernes de 9:00 a 18:00 CET.</p>
          <Link to="/contact" className="inline-flex items-center gap-2 text-sm text-gray-700 bg-gray-200 px-6 py-3 rounded-xl hover:bg-gray-300 transition-colors">
            Contactar con soporte
          </Link>
        </div>
      </section>
    </div>
  );
}