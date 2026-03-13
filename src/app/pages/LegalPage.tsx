import { useParams, Link } from "react-router";

const PAGES: Record<string, { title: string; sections: { heading: string; body: string }[] }> = {
  privacidad: {
    title: "Política de Privacidad",
    sections: [
      { heading: "1. Responsable del tratamiento", body: "NEXA Commerce S.L., con CIF B-12345678, con domicilio en Calle Principal 123, 28001 Madrid. Email de contacto: privacidad@nexa.com." },
      { heading: "2. Datos que recopilamos", body: "Nombre y apellidos, dirección de correo electrónico, dirección postal, número de teléfono, datos de pago (procesados por Stripe — no los almacenamos), historial de compras y preferencias de navegación." },
      { heading: "3. Finalidad del tratamiento", body: "Gestión de pedidos y envíos, facturación, atención al cliente, comunicaciones transaccionales, personalización de la experiencia de compra y, con tu consentimiento, envío de newsletters y ofertas." },
      { heading: "4. Base jurídica", body: "Ejecución de contrato para la gestión de pedidos; interés legítimo para prevención de fraude; consentimiento para comunicaciones de marketing." },
      { heading: "5. Conservación de datos", body: "Conservamos tus datos durante la relación comercial y hasta 5 años adicionales para cumplimiento de obligaciones fiscales y legales." },
      { heading: "6. Tus derechos (RGPD)", body: "Tienes derecho de acceso, rectificación, supresión ('derecho al olvido'), portabilidad, oposición y limitación del tratamiento. Puedes ejercerlos escribiendo a privacidad@nexa.com adjuntando copia de tu DNI." },
      { heading: "7. Transferencias internacionales", body: "Algunos proveedores (Stripe, AWS, Sendgrid) pueden estar en EEUU. Usamos Cláusulas Contractuales Tipo aprobadas por la Comisión Europea." },
      { heading: "8. Cookies", body: "Usamos cookies propias y de terceros. Más información en nuestra Política de Cookies." },
    ],
  },
  terminos: {
    title: "Términos y Condiciones",
    sections: [
      { heading: "1. Objeto", body: "Estos Términos y Condiciones regulan el acceso y uso de la plataforma NEXA (www.nexa.com) y la adquisición de productos a través de la misma." },
      { heading: "2. Usuarios", body: "El acceso está disponible para mayores de 18 años o menores con consentimiento paternal. Al registrarte aceptas estos términos en su totalidad." },
      { heading: "3. Proceso de compra", body: "El contrato de compraventa se perfecciona cuando recibes la confirmación de pedido por email. NEXA se reserva el derecho de cancelar pedidos por error de precio, falta de stock o sospecha de fraude." },
      { heading: "4. Precios e impuestos", body: "Los precios mostrados incluyen IVA (21 % en España). NEXA puede modificar precios sin previo aviso. El precio aplicable es el vigente en el momento de confirmar el pedido." },
      { heading: "5. Disponibilidad", body: "La disponibilidad del producto no está garantizada hasta la confirmación del pedido. En caso de rotura de stock te notificaremos con la mayor celeridad posible." },
      { heading: "6. Garantías", body: "Los productos tienen la garantía legal mínima de 2 años establecida en la Directiva Europea 1999/44/CE. NEXA ofrece adicionalmente 1 año de garantía propia en productos electrónicos." },
      { heading: "7. Limitación de responsabilidad", body: "NEXA no será responsable de daños indirectos, pérdidas de datos o lucro cesante. La responsabilidad máxima se limita al importe del pedido en cuestión." },
      { heading: "8. Ley aplicable", body: "Este contrato se rige por la legislación española. Para cualquier controversia, las partes se someten a los Juzgados y Tribunales de Madrid." },
    ],
  },
  cookies: {
    title: "Política de Cookies",
    sections: [
      { heading: "¿Qué son las cookies?", body: "Las cookies son pequeños archivos de texto que se almacenan en tu dispositivo cuando visitas un sitio web. Permiten recordar tus preferencias y mejorar tu experiencia." },
      { heading: "Cookies estrictamente necesarias", body: "Imprescindibles para que la tienda funcione: sesión de usuario, carrito de compra, selección de idioma. No se pueden desactivar." },
      { heading: "Cookies de rendimiento", body: "Usamos Google Analytics 4 para medir el tráfico y comportamiento de navegación de forma anónima. Ayudan a mejorar la plataforma." },
      { heading: "Cookies funcionales", body: "Recuerdan tus preferencias (moneda, país, tema visual) y permiten reproducir contenido multimedia." },
      { heading: "Cookies de marketing", body: "Con tu consentimiento, usamos Meta Pixel y Google Ads para mostrarte anuncios relevantes en otras plataformas. Puedes optar por no incluirlas." },
      { heading: "Gestión de cookies", body: "Puedes gestionar o eliminar las cookies desde los ajustes de tu navegador en cualquier momento. Ten en cuenta que desactivar algunas cookies puede afectar la funcionalidad del sitio." },
      { heading: "Actualizaciones", body: "Podemos actualizar esta política para reflejar cambios en nuestra práctica o en la legislación. Te notificaremos cambios significativos mediante un banner de consentimiento." },
    ],
  },
};

export function LegalPage() {
  const { slug } = useParams<{ slug: string }>();
  const page = slug ? PAGES[slug] : null;

  if (!page) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 text-sm mb-3">Página no encontrada</p>
          <Link to="/" className="text-xs text-gray-500 border border-gray-200 rounded-lg px-4 py-2 hover:bg-gray-50 transition-colors">
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <section className="border-b border-gray-100 py-14 px-4 text-center">
        <p className="text-xs text-gray-400 uppercase tracking-widest mb-3">Información legal</p>
        <h1 className="text-3xl text-gray-900 tracking-tight">{page.title}</h1>
        <p className="text-xs text-gray-400 mt-3">Última actualización: 1 de enero de 2026</p>
      </section>

      <section className="py-12 px-4">
        <div className="max-w-2xl mx-auto space-y-8">
          {page.sections.map(s => (
            <div key={s.heading}>
              <h2 className="text-sm text-gray-900 mb-3 pb-2 border-b border-gray-100">{s.heading}</h2>
              <p className="text-sm text-gray-500 leading-relaxed">{s.body}</p>
            </div>
          ))}

          {/* Nav to other legal pages */}
          <div className="pt-6 border-t border-gray-100">
            <p className="text-xs text-gray-400 mb-3">Otras políticas legales</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(PAGES)
                .filter(([k]) => k !== slug)
                .map(([k, v]) => (
                  <Link key={k} to={`/legal/${k}`}
                    className="text-xs text-gray-500 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors">
                    {v.title}
                  </Link>
                ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
