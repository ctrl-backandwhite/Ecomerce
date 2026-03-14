import { useEffect, useCallback, useRef } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { HelpCircle } from "lucide-react";
import type { DriveStep } from "driver.js";

const TOUR_KEY = "nexa_admin_tour_v1";

// ── Tour steps ────────────────────────────────────────────────────────────────
const STEPS: DriveStep[] = [
  {
    popover: {
      title: "👋 Bienvenido a NEXA Admin",
      description:
        "Este panel te permite gestionar todos los aspectos de tu tienda online. Te haremos un recorrido rápido por las funciones principales.",
    },
  },
  {
    element: "#tour-sidebar",
    popover: {
      title: "🗂 Menú de navegación",
      description:
        "El menú lateral organiza el panel en 6 secciones. Puedes colapsarlo con el botón de menú para ganar espacio. En móvil se abre con el ícono de hamburguesa.",
      side: "right",
      align: "start",
    },
  },
  {
    element: "#tour-panel-group",
    popover: {
      title: "📊 Panel",
      description:
        "<b>Dashboard</b> — métricas en tiempo real: ingresos, órdenes, clientes y devoluciones del mes.<br/><b>Reportes</b> — gráficos avanzados de ventas, productos más vendidos y análisis de clientes.",
      side: "right",
    },
  },
  {
    element: "#tour-ventas-group",
    popover: {
      title: "🛒 Ventas",
      description:
        "<b>Órdenes</b> — gestiona y cambia el estado de los pedidos.<br/><b>Facturas</b> — visualiza, imprime y descarga facturas en PDF.<br/><b>Devoluciones</b> — procesa solicitudes con seguimiento de estado.",
      side: "right",
    },
  },
  {
    element: "#tour-clientes-group",
    popover: {
      title: "👤 Clientes",
      description:
        "<b>Clientes</b> — historial de compras y datos de contacto.<br/><b>Reseñas</b> — aprueba o rechaza reseñas de productos.<br/><b>Cupones</b> — crea descuentos de % o monto fijo.<br/><b>Fidelidad</b> — programa de puntos.<br/><b>Tarjetas regalo</b> — emite gift cards.",
      side: "right",
    },
  },
  {
    element: "#tour-catalogo-group",
    popover: {
      title: "📦 Catálogo",
      description:
        "<b>Productos</b> — CRUD completo con 8 pestañas: general, precios, stock, SEO, imágenes, atributos, variantes y garantía.<br/><b>Categorías</b> — árbol con drag & drop.<br/><b>Marcas · Atributos · Medios · Garantías</b>.",
      side: "right",
    },
  },
  {
    element: "#tour-marketing-group",
    popover: {
      title: "📣 Marketing",
      description:
        "<b>Campañas</b> — descuentos por fechas, productos o categorías.<br/><b>Newsletter</b> — gestiona suscriptores.<br/><b>SEO</b> — optimiza meta títulos y descripciones.<br/><b>Slides</b> — gestiona el carrusel del home.",
      side: "right",
    },
  },
  {
    element: "#tour-sistema-group",
    popover: {
      title: "⚙️ Sistema",
      description:
        "<b>Flujos</b> — procesos de entrega paso a paso.<br/><b>Envíos</b> — transportistas y tarifas por zona.<br/><b>Impuestos</b> — reglas fiscales por país.<br/><b>Emails</b> — plantillas de notificación.<br/><b>Configuración</b> — ajustes generales.",
      side: "right",
    },
  },
  {
    element: "#tour-topbar",
    popover: {
      title: "🔔 Barra superior",
      description:
        "Muestra el título de la sección activa · Notificaciones con alertas pendientes · Perfil del administrador. El botón <b>?</b> reabre este tour en cualquier momento.",
      side: "bottom",
      align: "end",
    },
  },
  {
    element: "#tour-stats",
    popover: {
      title: "📈 Tarjetas de métricas",
      description:
        "Cada sección muestra KPIs en la parte superior: totales, activos, estados y tendencias. Los datos se actualizan en tiempo real con las acciones que realices.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "#tour-table-area",
    popover: {
      title: "📋 Tablas de datos",
      description:
        "Todas las secciones tienen tablas con: <b>🔍 Búsqueda</b> en tiempo real · <b>Filtros</b> por estado/tipo · <b>↕ Ordenación</b> por columna. Los datos se paginan automáticamente.",
      side: "top",
      align: "start",
    },
  },
  {
    popover: {
      title: "➕ Botón crear nuevo",
      description:
        "En cada sección encontrarás el <b>círculo negro ⊕</b> en la esquina superior derecha. Al hacer clic abre el formulario de creación: nuevo producto, cupón, marca, categoría, etc.",
    },
  },
  {
    popover: {
      title: "⚡ Acciones por fila",
      description:
        "Cada fila tiene botones de acción al lado derecho:<br/>👁 <b>Ver</b> — detalle o vista previa<br/>✏️ <b>Editar</b> — abre el formulario de edición<br/>🗑 <b>Eliminar</b> — pide confirmación antes de borrar",
    },
  },
  {
    popover: {
      title: "✅ ¡Todo listo!",
      description:
        "Ya conoces el panel de NEXA. Puedes repetir este tour en cualquier momento con el botón <b>?</b> en la barra superior. ¡Éxito con tu tienda!",
    },
  },
];

// ── Component ─────────────────────────────────────────────────────────────────
export function AdminTour() {
  const runningRef = useRef(false);

  const startTour = useCallback(() => {
    if (runningRef.current) return;
    runningRef.current = true;

    const driverObj = driver({
      showProgress: true,
      progressText: "{{current}} de {{total}}",
      animate: true,
      smoothScroll: true,
      allowClose: true,
      overlayOpacity: 0.35,
      popoverClass: "nexa-tour-popover",
      doneBtnText: "Finalizar",
      nextBtnText: "Siguiente →",
      prevBtnText: "← Anterior",
      showButtons: ["next", "previous", "close"],
      steps: STEPS,
      onDestroyed: () => {
        localStorage.setItem(TOUR_KEY, "done");
        runningRef.current = false;
      },
    });

    setTimeout(() => driverObj.drive(), 300);
  }, []);

  // Auto-start only on first visit (single check, stable)
  useEffect(() => {
    if (!localStorage.getItem(TOUR_KEY)) {
      startTour();
    }
  }, [startTour]);

  return (
    <>
      {/* Help button — always visible in topbar */}
      <button
        id="tour-help-btn"
        onClick={startTour}
        title="Iniciar tour de ayuda"
        className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <HelpCircle className="w-4 h-4" strokeWidth={1.5} />
      </button>

      {/* Popover style overrides */}
      <style>{`
        .nexa-tour-popover {
          font-family: "Roboto", system-ui, sans-serif !important;
          border-radius: 16px !important;
          box-shadow: 0 20px 60px rgba(0,0,0,0.18) !important;
          border: 1px solid #e5e7eb !important;
          padding: 0 !important;
          min-width: 300px !important;
          max-width: 380px !important;
        }
        .nexa-tour-popover .driver-popover-title {
          font-size: 13px !important;
          font-weight: 400 !important;
          color: #111827 !important;
          padding: 16px 20px 8px !important;
          border-bottom: 1px solid #f3f4f6 !important;
          letter-spacing: 0 !important;
        }
        .nexa-tour-popover .driver-popover-description {
          font-size: 12px !important;
          color: #6b7280 !important;
          line-height: 1.65 !important;
          padding: 12px 20px !important;
        }
        .nexa-tour-popover .driver-popover-description b {
          color: #111827 !important;
          font-weight: 500 !important;
        }
        .nexa-tour-popover .driver-popover-footer {
          padding: 12px 20px 16px !important;
          border-top: 1px solid #f3f4f6 !important;
          gap: 6px !important;
        }
        .nexa-tour-popover .driver-popover-progress-text {
          font-size: 10px !important;
          color: #9ca3af !important;
          letter-spacing: 0.05em !important;
        }
        .nexa-tour-popover .driver-popover-next-btn,
        .nexa-tour-popover .driver-popover-prev-btn,
        .nexa-tour-popover .driver-popover-done-btn {
          font-size: 11px !important;
          padding: 5px 14px !important;
          border-radius: 8px !important;
          font-weight: 400 !important;
          letter-spacing: 0 !important;
          transition: all 0.15s !important;
        }
        .nexa-tour-popover .driver-popover-next-btn,
        .nexa-tour-popover .driver-popover-done-btn {
          background: #111827 !important;
          border: 1px solid #111827 !important;
          color: #fff !important;
        }
        .nexa-tour-popover .driver-popover-next-btn:hover,
        .nexa-tour-popover .driver-popover-done-btn:hover {
          background: #374151 !important;
        }
        .nexa-tour-popover .driver-popover-prev-btn {
          background: #fff !important;
          border: 1px solid #e5e7eb !important;
          color: #374151 !important;
        }
        .nexa-tour-popover .driver-popover-prev-btn:hover {
          background: #f9fafb !important;
        }
        .nexa-tour-popover .driver-popover-close-btn {
          color: #9ca3af !important;
          font-size: 16px !important;
          top: 12px !important;
          right: 14px !important;
        }
        .nexa-tour-popover .driver-popover-close-btn:hover {
          color: #111827 !important;
        }
        .driver-overlay {
          background: rgba(0, 0, 0, 0.35) !important;
        }
        .driver-active-element {
          border-radius: 8px !important;
        }
      `}</style>
    </>
  );
}
