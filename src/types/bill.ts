export interface Factura {
  id_factura: number;
  id_pedido: number;
  numero_factura: string;
  fecha_emision: Date;
  estado_factura: 'pendiente' | 'pagada' | 'cancelada';
  subtotal: number;
  iva: number;
  total: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface FacturaConDetalles extends Factura {
  pedido: {
    id_usuario: number;
    usuario_nombre: string;
    usuario_apellido: string;
    usuario_dni: string;
    usuario_direccion: string;
    total_pedido: number;
  };
  detalles: Array<{
    nombre_producto: string;
    cantidad: number;
    precio_unitario: number;
    subtotal_linea: number;
  }>;
}

export interface GenerarFacturaDto {
  id_pedido: number;
}