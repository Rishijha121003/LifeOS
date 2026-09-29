export interface Resource {
  id: number;
  title: string;
  description?: string | null;
  url: string;
  category?: string;
  order_index?: number;
}
