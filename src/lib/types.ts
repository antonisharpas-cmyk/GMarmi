export type Img = { id: number; lg: string; md: string; sm: string; alt_en?: string; alt_el?: string; w?: number; h?: number };

export type Entry = {
  id: number;
  type: string;
  slug: string;
  sort_order: number;
  published: boolean;
  featured: boolean;
  cover: Img | null;
  gallery: Img[];
  seo?: Record<string, string>;
  [k: string]: any;
};

export type SiteData = {
  site: Record<string, any>;
  home: Record<string, any>;
  about: Record<string, any>;
  seo: Record<string, any>;
  categories: Entry[];
  collections: Entry[];
  applications: Entry[];
  brands: Entry[];
};
