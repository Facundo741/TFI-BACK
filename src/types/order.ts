export interface Pedido {
  id_pedido: number;
  id_usuario: number;
  fecha_creacion: Date;
  fecha_actualizacion: Date;
  subtotal: number;
  costo_envio: number;
  total: number;
  estado: 'pendiente' | 'confirmado' | 'preparando' | 'enviado' | 'entregado' | 'cancelado';
  metodo_entrega: string;
  metodo_pago: 'tarjeta' | 'transferencia' | 'efectivo';
  direccion_entrega: string;
  ciudad_entrega: string;
  codigo_postal_entrega: string;
  telefono_contacto: string;
  nombre_completo: string;
}

export interface PedidoDetalle {
  id_pedido_detalle: number;
  id_pedido: number;
  id_producto: number;
  cantidad: number;
  precio_unitario: number;
  subtotal_linea: number;
}

export interface PedidoConDetalles extends Pedido {
  detalles: PedidoDetalle[];
  usuario?: {
    nombre: string;
    apellido: string;
    email: string;
  };
}

export interface CreatePedidoDto {
  id_usuario: number;
  metodo_entrega: string;
  metodo_pago: 'tarjeta' | 'transferencia' | 'efectivo';
  direccion_entrega: string;
  ciudad_entrega: string;
  codigo_postal_entrega: string;
  telefono_contacto: string;
  nombre_completo: string;
  productos: Array<{
    id_producto: number;
    cantidad: number;
  }>;
}