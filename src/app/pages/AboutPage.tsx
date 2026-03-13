import { Shield, Zap, Award, Users, Globe, Leaf, ArrowRight } from "lucide-react";
import { Link } from "react-router";

const values = [
  { icon: Shield,  title: "Confianza",     desc: "Más de 50 000 clientes satisfechos avalan nuestra reputación." },
  { icon: Zap,     title: "Rapidez",       desc: "Envíos express en 24 h a toda Europa y LATAM." },
  { icon: Award,   title: "Calidad",       desc: "Solo trabajamos con marcas certificadas y de primera línea." },
  { icon: Globe,   title: "Global",        desc: "Operamos en 28 países con soporte multiidioma 24/7." },
  { icon: Leaf,    title: "Sostenibilidad",desc: "Embalajes 100 % reciclados y compensación de huella de carbono." },
  { icon: Users,   title: "Comunidad",     desc: "Foro activo, reseñas verificadas y programa de fidelidad." },
];

const team = [
  { name: "Elena Morales",  role: "CEO & Fundadora",        img: "https://api.dicebear.com/8.x/notionists/svg?seed=elena" },
  { name: "Marco Rivera",   role: "CTO",                    img: "https://api.dicebear.com/8.x/notionists/svg?seed=marco" },
  { name: "Sara Kim",       role: "Directora de Producto",  img: "https://api.dicebear.com/8.x/notionists/svg?seed=sara" },
  { name: "Luis Herrera",   role: "Head of Operations",     img: "https://api.dicebear.com/8.x/notionists/svg?seed=luis" },
];

const stats = [
  { value: "50K+",  label: "Clientes activos"  },
  { value: "16K+",  label: "Productos en catálogo" },
  { value: "28",    label: "Países de envío"   },
  { value: "99.2%", label: "Satisfacción"      },
];

export function AboutPage() {
  return (
    <div className="min-h-screen bg-white">

      {/* Hero */}
      <section className="border-b border-gray-100 py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-4">Quiénes somos</p>
          <h1 className="text-4xl sm:text-5xl text-gray-900 tracking-tight mb-6">
            Redefiniendo el comercio<br className="hidden sm:block" /> electrónico premium
          </h1>
          <p className="text-base text-gray-500 leading-relaxed mb-8 max-w-xl mx-auto">
            NEXA nació en 2019 con una misión clara: ofrecer tecnología, moda y estilo de vida
            de primera categoría con la experiencia de compra más fluida posible.
          </p>
          <Link
            to="/contacto"
            className="inline-flex items-center gap-2 text-sm text-white bg-gray-900 px-6 py-3 rounded-xl hover:bg-gray-700 transition-colors"
          >
            Contáctanos <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="py-14 px-4 border-b border-gray-100">
        <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
          {stats.map(s => (
            <div key={s.label}>
              <p className="text-3xl text-gray-900 tracking-tight">{s.value}</p>
              <p className="text-xs text-gray-400 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Values */}
      <section className="py-16 px-4 bg-gray-50/50">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs text-gray-400 uppercase tracking-widest text-center mb-10">Nuestros valores</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {values.map(v => (
              <div key={v.title} className="bg-white border border-gray-100 rounded-2xl p-6">
                <div className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center mb-4">
                  <v.icon className="w-4 h-4 text-gray-700" strokeWidth={1.5} />
                </div>
                <p className="text-sm text-gray-900 mb-2">{v.title}</p>
                <p className="text-xs text-gray-500 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-4">Nuestra historia</p>
            <h2 className="text-2xl text-gray-900 tracking-tight mb-4">De startup a referente europeo</h2>
            <div className="space-y-3 text-sm text-gray-500 leading-relaxed">
              <p>Todo comenzó en un pequeño coworking de Madrid en 2019. Elena y Marco decidieron que la industria del retail online merecía un modelo más honesto y transparente.</p>
              <p>En solo 5 años, NEXA ha pasado de vender 12 productos a un catálogo de más de 16 000 referencias, con almacenes en España, México y Estados Unidos.</p>
              <p>Hoy somos el marketplace de confianza para quienes buscan calidad garantizada, envíos puntuales y un servicio al cliente que de verdad resuelve problemas.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {["2019", "2021", "2023", "2026"].map((year, i) => (
              <div key={year} className={`rounded-2xl p-5 border ${i % 2 === 0 ? "bg-gray-900 border-gray-900 text-white" : "bg-white border-gray-100 text-gray-900"}`}>
                <p className="text-xl tracking-tight">{year}</p>
                <p className={`text-xs mt-1 ${i % 2 === 0 ? "text-gray-400" : "text-gray-500"}`}>
                  {["Fundación", "Primera ronda", "Expansión LATAM", "50K clientes"][i]}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-16 px-4 bg-gray-50/50 border-t border-gray-100">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs text-gray-400 uppercase tracking-widest text-center mb-10">El equipo</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {team.map(m => (
              <div key={m.name} className="bg-white border border-gray-100 rounded-2xl p-5 text-center">
                <img src={m.img} alt={m.name} className="w-16 h-16 rounded-full mx-auto mb-3 bg-gray-100" />
                <p className="text-sm text-gray-900">{m.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{m.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
