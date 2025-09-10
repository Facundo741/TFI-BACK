export interface Producto {
  id_producto: number;
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
  categoria: string;
  imagen_url?: string;
  created_at?: Date;
  updated_at?: Date;
}