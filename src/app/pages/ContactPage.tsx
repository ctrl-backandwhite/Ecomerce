import { useState } from "react";
import { Mail, Phone, MapPin, Clock, Send, CheckCircle2, MessageSquare, Headphones, FileText } from "lucide-react";
import { toast } from "sonner";

const channels = [
  { icon: MessageSquare, title: "Chat en vivo",    desc: "Respuesta en menos de 2 min",  action: "Iniciar chat",  color: "text-blue-600",   bg: "bg-blue-50"   },
  { icon: Mail,          title: "Email",            desc: "Respuesta en menos de 24 h",   action: "Enviar email",  color: "text-violet-600", bg: "bg-violet-50" },
  { icon: Headphones,    title: "Teléfono",         desc: "Lun–Vie 9:00–18:00 CET",       action: "Llamar ahora", color: "text-emerald-600",bg: "bg-emerald-50"},
  { icon: FileText,      title: "Centro de ayuda",  desc: "Más de 200 artículos",          action: "Ver artículos", color: "text-amber-600",  bg: "bg-amber-50"  },
];

export function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "", type: "consulta" });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error("Por favor completa todos los campos obligatorios");
      return;
    }
    setSent(true);
    toast.success("Mensaje enviado correctamente");
  };

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <div className="min-h-screen bg-white">

      {/* Hero */}
      <section className="border-b border-gray-100 py-14 px-4 text-center">
        <p className="text-xs text-gray-400 uppercase tracking-widest mb-3">Contacto</p>
        <h1 className="text-4xl text-gray-900 tracking-tight mb-3">¿En qué podemos ayudarte?</h1>
        <p className="text-sm text-gray-500 max-w-md mx-auto">Estamos aquí para resolver cualquier duda sobre tus pedidos, productos o devoluciones.</p>
      </section>

      {/* Channels */}
      <section className="py-12 px-4 bg-gray-50/40 border-b border-gray-100">
        <div className="max-w-4xl mx-auto grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {channels.map(c => (
            <div key={c.title} className="bg-white border border-gray-100 rounded-2xl p-5 text-center hover:shadow-sm transition-shadow">
              <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center mx-auto mb-3`}>
                <c.icon className={`w-5 h-5 ${c.color}`} strokeWidth={1.5} />
              </div>
              <p className="text-sm text-gray-900 mb-1">{c.title}</p>
              <p className="text-xs text-gray-400 mb-3">{c.desc}</p>
              <button className="text-xs text-gray-600 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors">
                {c.action}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Form + info */}
      <section className="py-14 px-4">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-12">

          {/* Form */}
          <div>
            <h2 className="text-lg text-gray-900 tracking-tight mb-6">Envíanos un mensaje</h2>
            {sent ? (
              <div className="flex flex-col items-center py-16 text-center">
                <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-7 h-7 text-green-500" strokeWidth={1.5} />
                </div>
                <p className="text-sm text-gray-900 mb-2">¡Mensaje enviado!</p>
                <p className="text-xs text-gray-400 mb-5">Te respondemos en menos de 24 horas.</p>
                <button onClick={() => setSent(false)} className="text-xs text-gray-500 border border-gray-200 rounded-lg px-4 py-2 hover:bg-gray-50 transition-colors">
                  Nuevo mensaje
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">Nombre *</label>
                    <input value={form.name} onChange={set("name")} placeholder="Tu nombre"
                      className="w-full h-9 px-3 text-xs text-gray-900 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 placeholder-gray-300" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">Email *</label>
                    <input type="email" value={form.email} onChange={set("email")} placeholder="tu@email.com"
                      className="w-full h-9 px-3 text-xs text-gray-900 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 placeholder-gray-300" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Tipo de consulta</label>
                  <select value={form.type} onChange={set("type")}
                    className="w-full h-9 px-3 text-xs text-gray-900 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 bg-white">
                    <option value="consulta">Consulta general</option>
                    <option value="pedido">Sobre mi pedido</option>
                    <option value="devolucion">Devolución / garantía</option>
                    <option value="factura">Facturación</option>
                    <option value="tecnico">Soporte técnico</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Asunto</label>
                  <input value={form.subject} onChange={set("subject")} placeholder="Breve descripción del tema"
                    className="w-full h-9 px-3 text-xs text-gray-900 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 placeholder-gray-300" />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Mensaje *</label>
                  <textarea value={form.message} onChange={set("message")} rows={5} placeholder="Cuéntanos en qué podemos ayudarte…"
                    className="w-full px-3 py-2.5 text-xs text-gray-900 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 placeholder-gray-300 resize-none" />
                </div>
                <button type="submit"
                  className="flex items-center gap-2 h-9 px-6 text-xs text-white bg-gray-900 rounded-xl hover:bg-gray-700 transition-colors">
                  <Send className="w-3.5 h-3.5" /> Enviar mensaje
                </button>
              </form>
            )}
          </div>

          {/* Info */}
          <div className="space-y-6">
            <div>
              <h2 className="text-lg text-gray-900 tracking-tight mb-5">Información de contacto</h2>
              <div className="space-y-4">
                {[
                  { icon: MapPin, title: "Dirección",     value: "Calle Principal 123, Madrid 28001, España" },
                  { icon: Phone,  title: "Teléfono",      value: "+34 91 234 56 78" },
                  { icon: Mail,   title: "Email",         value: "info@nexa.com" },
                  { icon: Clock,  title: "Horario",       value: "Lun–Vie 9:00–18:00 CET · Sab 10:00–14:00" },
                ].map(i => (
                  <div key={i.title} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <i.icon className="w-3.5 h-3.5 text-gray-600" strokeWidth={1.5} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">{i.title}</p>
                      <p className="text-sm text-gray-700">{i.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Map placeholder */}
            <div className="rounded-2xl bg-gray-100 border border-gray-100 h-44 flex items-center justify-center">
              <div className="text-center">
                <MapPin className="w-6 h-6 text-gray-300 mx-auto mb-2" strokeWidth={1} />
                <p className="text-xs text-gray-400">Mapa — Madrid, España</p>
              </div>
            </div>

            {/* Social */}
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-widest mb-3">Síguenos</p>
              <div className="flex gap-2">
                {["Instagram", "Twitter/X", "LinkedIn", "YouTube"].map(s => (
                  <button key={s} className="h-8 px-3 text-xs text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
