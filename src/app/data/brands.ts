export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  website?: string;
  description: string;
  productCount: number;
  status: "active" | "inactive";
}

export const brands: Brand[] = [
  { id: "1", name: "Apple",        slug: "apple",        logo: "", website: "https://apple.com",        description: "Tecnología premium de Apple Inc.",            productCount: 24, status: "active" },
  { id: "2", name: "Samsung",      slug: "samsung",      logo: "", website: "https://samsung.com",      description: "Electrónica y smartphones Samsung.",          productCount: 18, status: "active" },
  { id: "3", name: "Sony",         slug: "sony",         logo: "", website: "https://sony.com",         description: "Electrónica, audio y fotografía.",            productCount: 12, status: "active" },
  { id: "4", name: "Nike",         slug: "nike",         logo: "", website: "https://nike.com",         description: "Ropa y calzado deportivo.",                   productCount: 31, status: "active" },
  { id: "5", name: "Adidas",       slug: "adidas",       logo: "", website: "https://adidas.com",       description: "Moda deportiva y lifestyle.",                 productCount: 27, status: "active" },
  { id: "6", name: "Bose",         slug: "bose",         logo: "", website: "https://bose.com",         description: "Audio y sistemas de sonido premium.",         productCount: 9,  status: "active" },
  { id: "7", name: "Logitech",     slug: "logitech",     logo: "", website: "https://logitech.com",     description: "Periféricos y accesorios informáticos.",      productCount: 15, status: "active" },
  { id: "8", name: "LG",           slug: "lg",           logo: "", website: "https://lg.com",           description: "Electrónica del hogar y pantallas.",          productCount: 11, status: "active" },
  { id: "9", name: "Canon",        slug: "canon",        logo: "", website: "https://canon.com",        description: "Cámaras y equipos de fotografía.",            productCount: 8,  status: "inactive" },
  { id: "10", name: "Xiaomi",      slug: "xiaomi",       logo: "", website: "https://xiaomi.com",       description: "Tecnología accesible y wearables.",           productCount: 20, status: "active" },
];
