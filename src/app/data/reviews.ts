export interface Review {
  id: string;
  productId: string;
  author: string;
  avatar: string; // initials
  avatarColor: string;
  rating: number;
  title: string;
  body: string;
  date: string;
  verified: boolean;
  helpful: number;
  images?: string[];
}

export const reviews: Review[] = [
  // ── iPhone 15 Pro Max ─────────────────────────────────────────
  {
    id: "r001", productId: "iphone-15-pro-max",
    author: "Carlos M.", avatar: "CM", avatarColor: "bg-indigo-100 text-indigo-700",
    rating: 5,
    title: "El mejor teléfono que he tenido",
    body: "Llevo 3 semanas usando el iPhone 15 Pro Max y simplemente es increíble. El chip A17 Pro hace que todo vuele, las apps abren al instante y los juegos corren perfectamente. La cámara con el zoom 5x es una revolución absoluta, puedo capturar detalles a distancias que antes eran imposibles. El diseño en titanio se siente premium y pesa menos de lo que esperaba.",
    date: "2026-02-28", verified: true, helpful: 47,
  },
  {
    id: "r002", productId: "iphone-15-pro-max",
    author: "Ana R.", avatar: "AR", avatarColor: "bg-rose-100 text-rose-700",
    rating: 5,
    title: "Cámara de nivel profesional",
    body: "Soy fotógrafa y estaba dudando en comprarlo pensando que no reemplazaría mi cámara, pero la calidad de imagen es impresionante. El modo de retrato, el macro y especialmente las fotos nocturnas superaron mis expectativas. El modo Action Camera para videos es espectacular. La pantalla ProMotion a 120Hz hace que todo se vea suavísimo.",
    date: "2026-03-01", verified: true, helpful: 39,
  },
  {
    id: "r003", productId: "iphone-15-pro-max",
    author: "Luis T.", avatar: "LT", avatarColor: "bg-emerald-100 text-emerald-700",
    rating: 4,
    title: "Excelente pero el precio es alto",
    body: "No hay duda de que es un teléfono de primera. Rendimiento impecable, pantalla espectacular y cámara de otro nivel. El puerto USB-C fue un cambio bienvenido. Solo le doy 4 estrellas porque el precio es muy elevado y la batería, aunque dura un día completo, podría ser mejor dado el tamaño del dispositivo.",
    date: "2026-02-20", verified: true, helpful: 28,
  },
  {
    id: "r004", productId: "iphone-15-pro-max",
    author: "Sofia V.", avatar: "SV", avatarColor: "bg-purple-100 text-purple-700",
    rating: 5,
    title: "Vale cada centavo",
    body: "Vengo de un iPhone 12 y el salto es enorme. La pantalla es más grande y brillante, el rendimiento es otro nivel. El titanio se siente como joya, muy ligero para el tamaño que tiene. El USB-C finalmente llega y es rapidísimo para transferir fotos. Lo mejor: la cámara de 48MP y el zoom 5x. Las fotos en modo noche parecen tomadas con flash.",
    date: "2026-03-05", verified: true, helpful: 55,
  },
  {
    id: "r005", productId: "iphone-15-pro-max",
    author: "Miguel F.", avatar: "MF", avatarColor: "bg-sky-100 text-sky-700",
    rating: 4,
    title: "Gran teléfono, calor en juegos intensos",
    body: "El rendimiento es sobresaliente en el día a día. Sin embargo, en sesiones largas de gaming el teléfono se calienta más de lo que me gustaría. La cámara es fantástica, el dynamic island es útil y se ve muy bien. El titanio es resistente y elegante. En general, muy recomendable si tienes presupuesto.",
    date: "2026-02-15", verified: false, helpful: 21,
  },
  {
    id: "r006", productId: "iphone-15-pro-max",
    author: "Elena B.", avatar: "EB", avatarColor: "bg-orange-100 text-orange-700",
    rating: 5,
    title: "Perfecto para trabajo y ocio",
    body: "Lo uso tanto para trabajo como para fotos de viaje. La integración con Mac y iPad es perfecta gracias al ecosistema Apple. La batería me dura todo el día con uso intenso. El tamaño de 6.7 pulgadas al principio me pareció grande pero ya no podría volver a algo más pequeño. La pantalla es simplemente la mejor que he visto en un móvil.",
    date: "2026-03-08", verified: true, helpful: 33,
  },

  // ── Smartphone Pro Max ────────────────────────────────────────
  {
    id: "r010", productId: "1",
    author: "Pedro G.", avatar: "PG", avatarColor: "bg-blue-100 text-blue-700",
    rating: 5,
    title: "La cámara de 108MP no defrauda",
    body: "Increíble calidad fotográfica para su precio. La cámara de 108MP captura detalles impresionantes incluso en condiciones de poca luz. El rendimiento es fluido en el día a día y la pantalla OLED es vibrante. Muy satisfecho con la compra.",
    date: "2026-02-10", verified: true, helpful: 31,
  },
  {
    id: "r011", productId: "1",
    author: "María C.", avatar: "MC", avatarColor: "bg-pink-100 text-pink-700",
    rating: 4,
    title: "Buen teléfono, relación calidad-precio notable",
    body: "Llevo dos meses usándolo y no tengo grandes quejas. La batería dura bien todo el día, la pantalla se ve genial bajo el sol y el rendimiento no falla. Le bajo una estrella porque el software podría tener menos bloatware.",
    date: "2026-01-25", verified: true, helpful: 18,
  },
  {
    id: "r012", productId: "1",
    author: "Javier L.", avatar: "JL", avatarColor: "bg-teal-100 text-teal-700",
    rating: 5,
    title: "5G marca la diferencia",
    body: "Finalmente un gama alta con 5G a un precio razonable. La velocidad de descarga es brutal comparado con mi antiguo teléfono 4G. La cámara principal es excelente y el modo video sorprende por la estabilización.",
    date: "2026-02-05", verified: true, helpful: 24,
  },
  {
    id: "r013", productId: "1",
    author: "Rosa P.", avatar: "RP", avatarColor: "bg-fuchsia-100 text-fuchsia-700",
    rating: 4,
    title: "Sólido en todos los aspectos",
    body: "No destaca en nada concreto pero tampoco falla en nada. El OLED tiene buenos negros, el procesador va sobrado para cualquier tarea y la cámara saca fotos con mucho detalle. La carga rápida es muy conveniente.",
    date: "2026-01-18", verified: false, helpful: 12,
  },

  // ── Laptop Ultra Slim ─────────────────────────────────────────
  {
    id: "r020", productId: "2",
    author: "David H.", avatar: "DH", avatarColor: "bg-cyan-100 text-cyan-700",
    rating: 5,
    title: "Perfecta para programadores",
    body: "Llevo 6 meses usándola como laptop de trabajo principal. El Intel i7 con 16GB de RAM maneja sin problemas entornos de desarrollo, Docker y múltiples apps abiertas a la vez. El SSD de 512GB es rapidísimo. La pantalla es nítida y la autonomía supera las 8 horas de trabajo real.",
    date: "2026-01-30", verified: true, helpful: 43,
  },
  {
    id: "r021", productId: "2",
    author: "Laura S.", avatar: "LS", avatarColor: "bg-lime-100 text-lime-700",
    rating: 5,
    title: "Ultra slim de verdad",
    body: "Es asombrosamente delgada y ligera para lo potente que es. La llevo a todas partes y apenas la siento en la mochila. La construcción es sólida, el teclado cómodo para escribir largas horas y la pantalla tiene colores muy fieles. Ideal para diseño gráfico.",
    date: "2026-02-12", verified: true, helpful: 29,
  },
  {
    id: "r022", productId: "2",
    author: "Pablo N.", avatar: "PN", avatarColor: "bg-yellow-100 text-yellow-700",
    rating: 4,
    title: "Muy buena, pero el ventilador se oye",
    body: "En general es una laptop excelente: rápida, ligera y con buena pantalla. Mi único inconveniente es que bajo carga intensa el ventilador se hace bastante audible. Para uso de oficina y trabajo normal es perfectamente silenciosa. Recomendable sin duda.",
    date: "2026-01-20", verified: true, helpful: 16,
  },
  {
    id: "r023", productId: "2",
    author: "Carmen R.", avatar: "CR", avatarColor: "bg-red-100 text-red-700",
    rating: 5,
    title: "Mejor compra del año",
    body: "Venía de una laptop de hace 7 años y el salto es tremendo. Todo carga al instante, los programas de edición van fluidos y la batería me dura perfectamente para un día de clases en la universidad. Muy satisfecha.",
    date: "2026-02-22", verified: true, helpful: 37,
  },

  // ── Auriculares Bluetooth Premium ─────────────────────────────
  {
    id: "r030", productId: "3",
    author: "Alex M.", avatar: "AM", avatarColor: "bg-violet-100 text-violet-700",
    rating: 5,
    title: "La cancelación de ruido es mágica",
    body: "Trabajo en una oficina ruidosa y estos auriculares cambiaron mi vida. Con ANC activo el silencio es casi total. El sonido es equilibrado con buenos graves y agudos detallados. Las 30 horas de batería son reales, los uso intensivamente y me duran 3 días fácil.",
    date: "2026-02-08", verified: true, helpful: 52,
  },
  {
    id: "r031", productId: "3",
    author: "Isabel C.", avatar: "IC", avatarColor: "bg-amber-100 text-amber-700",
    rating: 5,
    title: "Comodidad excepcional",
    body: "Me los pongo al llegar al trabajo y me los quito al salir, 8 horas sin ningún tipo de molestia. La almohadilla es suave y no aprieta. El sonido para escuchar música es fantástico y las llamadas se escuchan con mucha claridad gracias al micrófono con reducción de ruido.",
    date: "2026-01-28", verified: true, helpful: 41,
  },
  {
    id: "r032", productId: "3",
    author: "Roberto A.", avatar: "RA", avatarColor: "bg-stone-100 text-stone-700",
    rating: 4,
    title: "Excelentes, con algún pequeño fallo",
    body: "La calidad de sonido es top y la cancelación de ruido funciona muy bien. Le quito una estrella porque el control táctil en la orejera a veces falla con manos frías. La conectividad Bluetooth es estable y la carga rápida (15 min = 3h de uso) es muy útil.",
    date: "2026-02-18", verified: true, helpful: 22,
  },
  {
    id: "r033", productId: "3",
    author: "Lucía V.", avatar: "LV", avatarColor: "bg-emerald-100 text-emerald-700",
    rating: 5,
    title: "Para audiófilos exigentes",
    body: "Vengo de auriculares de gama alta con cable y me sorprendió gratamente la calidad de audio inalámbrico. Los graves son profundos sin ser exagerados, los medios son limpios y los agudos son detallados sin picar. El diseño plegable es muy práctico para viajes.",
    date: "2026-03-02", verified: false, helpful: 35,
  },

  // ── Smartwatch Elite ──────────────────────────────────────────
  {
    id: "r040", productId: "4",
    author: "Marcos D.", avatar: "MD", avatarColor: "bg-blue-100 text-blue-700",
    rating: 5,
    title: "Perfecto para runners",
    body: "Corro 5 días a la semana y este smartwatch me da todo lo que necesito. El GPS es preciso, el monitor de ritmo cardíaco es fiable comparado con una banda pectoral, y las rutas quedan registradas con mucho detalle. Las notificaciones del móvil son cómodas y la batería aguanta perfectamente una semana.",
    date: "2026-02-14", verified: true, helpful: 38,
  },
  {
    id: "r041", productId: "4",
    author: "Natalia G.", avatar: "NG", avatarColor: "bg-pink-100 text-pink-700",
    rating: 5,
    title: "Monitor de salud increíble",
    body: "Lo compré principalmente por el seguimiento de sueño y monitorización de salud. Los datos son muy detallados: fases del sueño, variabilidad cardíaca, niveles de estrés... Llevaba meses con insomnio y gracias a los informes pude identificar patrones y mejorar. La resistencia al agua 5ATM me permite llevarlo en la piscina.",
    date: "2026-01-22", verified: true, helpful: 45,
  },
  {
    id: "r042", productId: "4",
    author: "Sergio T.", avatar: "ST", avatarColor: "bg-orange-100 text-orange-700",
    rating: 4,
    title: "Gran smartwatch con pequeños matices",
    body: "La pantalla es brillante y siempre visible incluso bajo el sol. La compatibilidad con iOS y Android es total. El único punto negativo es que la app compañera podría ser más intuitiva. Las mediciones de actividad física son precisas y el diseño es elegante, no parece un trasto tecnológico en la muñeca.",
    date: "2026-02-02", verified: true, helpful: 19,
  },
  {
    id: "r043", productId: "4",
    author: "Patricia L.", avatar: "PL", avatarColor: "bg-teal-100 text-teal-700",
    rating: 5,
    title: "Lo mejor que me he comprado para el gym",
    body: "Tiene más de 100 modos deportivos, desde yoga hasta natación. El feedback en tiempo real durante el entrenamiento es muy útil. La batería dura toda la semana incluso con GPS activado. El diseño es minimalista y elegante, lo llevo también a la oficina sin desentonar.",
    date: "2026-03-04", verified: true, helpful: 31,
  },

  // ── Zapatillas Running Pro ─────────────────────────────────────
  {
    id: "r050", productId: "5",
    author: "Fernando M.", avatar: "FM", avatarColor: "bg-green-100 text-green-700",
    rating: 5,
    title: "Mis rodillas te lo agradecen",
    body: "Corro con problemas de rodilla y estas zapatillas han sido un alivio. La amortiguación es excelente, absorbe muy bien los impactos tanto en asfalto como en tierra. Son ligeras pero no sientes que sacrificas soporte. Llevo 400km con ellas y siguen como el primer día.",
    date: "2026-02-06", verified: true, helpful: 48,
  },
  {
    id: "r051", productId: "5",
    author: "Beatriz F.", avatar: "BF", avatarColor: "bg-purple-100 text-purple-700",
    rating: 5,
    title: "Muy cómodas desde el primer uso",
    body: "Normalmente las zapatillas nuevas necesitan rodaje pero estas son cómodas desde el primer momento. El material transpirable es clave para los meses de verano. Las uso tanto para correr como para el día a día y se ven muy bien. La suela antideslizante da mucha confianza en superficies mojadas.",
    date: "2026-01-15", verified: true, helpful: 27,
  },
  {
    id: "r052", productId: "5",
    author: "Adrián S.", avatar: "AS", avatarColor: "bg-indigo-100 text-indigo-700",
    rating: 4,
    title: "Buenas para media distancia",
    body: "Para 10km son perfectas. Para maratón quizás buscaría algo con más amortiguación en talón. El ajuste con el sistema de cordones es muy preciso y no se aflojan durante la carrera. El diseño es moderno sin ser llamativo. Buena relación calidad-precio.",
    date: "2026-02-25", verified: true, helpful: 14,
  },
  {
    id: "r053", productId: "5",
    author: "Teresa M.", avatar: "TM", avatarColor: "bg-rose-100 text-rose-700",
    rating: 5,
    title: "El mejor regalo que me he hecho",
    body: "Empecé a correr hace 3 meses y elegir un buen calzado fue clave. Estas zapatillas me ayudaron a correr sin lesiones desde el principio. Son ligeras, bien ventiladas y la amortiguación protege bien las articulaciones. Muy recomendables para principiantes y runners intermedios.",
    date: "2026-03-07", verified: false, helpful: 22,
  },
];
