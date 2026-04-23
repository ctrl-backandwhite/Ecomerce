import { useState } from "react";
import { Mail, Phone, MapPin, Clock, Send, CheckCircle2, MessageSquare, Headphones, FileText } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "../context/LanguageContext";

export function ContactPage() {
  const { t } = useLanguage();

  const channels = [
    { icon: MessageSquare, title: t("contact.channel.chat"), desc: t("contact.channel.chat.desc"), action: t("contact.channel.chat.action"), color: "text-blue-600", bg: "bg-blue-50" },
    { icon: Mail, title: t("contact.channel.email"), desc: t("contact.channel.email.desc"), action: t("contact.channel.email.action"), color: "text-violet-600", bg: "bg-violet-50" },
    { icon: Headphones, title: t("contact.channel.phone"), desc: t("contact.channel.phone.desc"), action: t("contact.channel.phone.action"), color: "text-emerald-600", bg: "bg-emerald-50" },
    { icon: FileText, title: t("contact.channel.help"), desc: t("contact.channel.help.desc"), action: t("contact.channel.help.action"), color: "text-amber-600", bg: "bg-amber-50" },
  ];

  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "", type: "consulta" });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error(t("contact.form.required"));
      return;
    }
    setSent(true);
    toast.success(t("contact.success"));
  };

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <div className="min-h-screen bg-white">

      {/* Hero */}
      <section className="border-b border-gray-100 py-14 px-4 text-center">
        <p className="text-xs text-gray-400 uppercase tracking-widest mb-3">{t("contact.eyebrow")}</p>
        <h1 className="text-4xl text-gray-900 tracking-tight mb-3">{t("contact.hero.title")}</h1>
        <p className="text-sm text-gray-500 max-w-md mx-auto">{t("contact.hero.subtitle")}</p>
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
            <h2 className="text-lg text-gray-900 tracking-tight mb-6">{t("contact.form.title")}</h2>
            {sent ? (
              <div className="flex flex-col items-center py-16 text-center">
                <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-7 h-7 text-green-500" strokeWidth={1.5} />
                </div>
                <p className="text-sm text-gray-900 mb-2">{t("contact.form.sent.title")}</p>
                <p className="text-xs text-gray-400 mb-5">{t("contact.form.sent.subtitle")}</p>
                <button onClick={() => setSent(false)} className="text-xs text-gray-500 border border-gray-200 rounded-lg px-4 py-2 hover:bg-gray-50 transition-colors">
                  {t("contact.form.sent.new")}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">{t("contact.form.name")}</label>
                    <input value={form.name} onChange={set("name")} placeholder={t("contact.placeholder.name")}
                      className="w-full h-9 px-3 text-xs text-gray-900 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 placeholder-gray-300" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">{t("contact.form.email")}</label>
                    <input type="email" value={form.email} onChange={set("email")} placeholder={t("contact.placeholder.email")}
                      className="w-full h-9 px-3 text-xs text-gray-900 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 placeholder-gray-300" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">{t("contact.form.type")}</label>
                  <select value={form.type} onChange={set("type")}
                    className="w-full h-9 px-3 text-xs text-gray-900 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 bg-white">
                    <option value="consulta">{t("contact.form.type.general")}</option>
                    <option value="pedido">{t("contact.form.type.order")}</option>
                    <option value="devolucion">{t("contact.form.type.return")}</option>
                    <option value="factura">{t("contact.form.type.billing")}</option>
                    <option value="tecnico">{t("contact.form.type.technical")}</option>
                    <option value="otro">{t("contact.form.type.other")}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">{t("contact.form.subject")}</label>
                  <input value={form.subject} onChange={set("subject")} placeholder={t("contact.form.subjectPlaceholder")}
                    className="w-full h-9 px-3 text-xs text-gray-900 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 placeholder-gray-300" />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">{t("contact.form.message")}</label>
                  <textarea value={form.message} onChange={set("message")} rows={5} placeholder={t("contact.form.messagePlaceholder")}
                    className="w-full px-3 py-2.5 text-xs text-gray-900 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 placeholder-gray-300 resize-none" />
                </div>
                <button type="submit"
                  className="flex items-center gap-2 h-9 px-6 text-xs text-gray-700 bg-gray-200 rounded-xl hover:bg-gray-300 transition-colors">
                  <Send className="w-3.5 h-3.5" /> {t("contact.send")}
                </button>
              </form>
            )}
          </div>

          {/* Info */}
          <div className="space-y-6">
            <div>
              <h2 className="text-lg text-gray-900 tracking-tight mb-5">{t("contact.info.title")}</h2>
              <div className="space-y-4">
                {[
                  { icon: MapPin, title: t("contact.info.address"), value: t("contact.info.addressValue") },
                  { icon: Phone, title: t("contact.info.phone"), value: "+1 (212) 555-0199" },
                  { icon: Mail, title: t("contact.info.email"), value: "info@nx036.com" },
                  { icon: Clock, title: t("contact.info.hours"), value: t("contact.info.hoursValue") },
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
                <p className="text-xs text-gray-400">{t("contact.map.label")}</p>
              </div>
            </div>

            {/* Social */}
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-widest mb-3">{t("contact.followUs")}</p>
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
