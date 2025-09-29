import { pool } from '../config/db';

export const getVentasPorPeriodo = async (fechaInicio: string, fechaFin: string): Promise<any> => {
  const result = await pool.query(
    `SELECT 
       DATE(f.fecha_emision) as fecha,
       COUNT(*) as total_ventas,
       SUM(f.total) as ingresos_totales,
       AVG(f.total) as promedio_venta
     FROM facturas f
     WHERE f.fecha_emision BETWEEN $1 AND $2
       AND f.estado_factura IN ('pendiente', 'pagada')  
     GROUP BY DATE(f.fecha_emision)
     ORDER BY fecha`,
    [fechaInicio, fechaFin]
  );
  return result.rows;
};

export const getProductosMasVendidos = async (limite: number = 10): Promise<any> => {
  const result = await pool.query(
    `SELECT 
       p.id_producto,
       p.nombre,
       p.categoria,
       SUM(pd.cantidad) as total_vendido,
       SUM(pd.subtotal_linea) as ingresos_totales
     FROM pedido_detalle pd
     JOIN productos p ON pd.id_producto = p.id_producto
     JOIN pedidos pe ON pd.id_pedido = pe.id_pedido
     WHERE pe.estado IN ('confirmado', 'facturado', 'entregado')
     GROUP BY p.id_producto, p.nombre, p.categoria
     ORDER BY total_vendido DESC
     LIMIT $1`,
    [limite]
  );
  return result.rows;
};

export const getIngresosTotales = async (): Promise<any> => {
  const result = await pool.query(
    `SELECT 
       EXTRACT(YEAR FROM f.fecha_emision) as año,
       EXTRACT(MONTH FROM f.fecha_emision) as mes,
       TO_CHAR(f.fecha_emision, 'YYYY-MM') as mes_formateado,
       COUNT(*) as total_facturas,
       SUM(f.total) as ingresos_totales,
       SUM(f.subtotal) as subtotal,
       SUM(f.iva) as iva
     FROM facturas f
     WHERE f.estado_factura IN ('pendiente', 'pagada') 
     GROUP BY año, mes, mes_formateado
     ORDER BY año DESC, mes DESC`
  );
  return result.rows;
};

export const getClientesTop = async (limite: number = 10): Promise<any> => {
  const result = await pool.query(
    `SELECT 
       u.id_usuario,
       u.nombre,
       u.apellido,
       u.email,
       COUNT(p.id_pedido) as total_pedidos,
       SUM(p.total) as total_gastado
     FROM pedidos p
     JOIN users u ON p.id_usuario = u.id_usuario
     WHERE p.estado IN ('confirmado', 'facturado', 'entregado')
     GROUP BY u.id_usuario, u.nombre, u.apellido, u.email
     ORDER BY total_gastado DESC
     LIMIT $1`,
    [limite]
  );
  return result.rows;
};

export const getStockCritico = async (nivelMinimo: number = 5): Promise<any> => {
  const result = await pool.query(
    `SELECT 
       id_producto,
       nombre,
       categoria,
       stock,
       precio
     FROM productos
     WHERE stock <= $1
     ORDER BY stock ASC`,
    [nivelMinimo]
  );
  return result.rows;
};

export const getVentasPorCategoria = async (): Promise<any> => {
  const result = await pool.query(
    `SELECT 
       p.categoria,
       COUNT(pd.id_pedido_detalle) as total_ventas,
       SUM(pd.cantidad) as total_unidades,
       SUM(pd.subtotal_linea) as ingresos_totales
     FROM pedido_detalle pd
     JOIN productos p ON pd.id_producto = p.id_producto
     JOIN pedidos pe ON pd.id_pedido = pe.id_pedido
     WHERE pe.estado IN ('confirmado', 'facturado', 'entregado')
     GROUP BY p.categoria
     ORDER BY ingresos_totales DESC`
  );
  return result.rows;
};

export const getMetricasGenerales = async (): Promise<any> => {
  const result = await pool.query(
    `SELECT 
       (SELECT COUNT(*) FROM users WHERE role = 'user') as total_clientes,
       (SELECT COUNT(*) FROM pedidos WHERE estado != 'pendiente') as total_pedidos,
       (SELECT COUNT(*) FROM facturas WHERE estado_factura IN ('pendiente', 'pagada')) as facturas_totales,  
       (SELECT COUNT(*) FROM facturas WHERE estado_factura = 'pagada') as facturas_pagadas,
       (SELECT SUM(total) FROM facturas WHERE estado_factura IN ('pendiente', 'pagada')) as ingresos_totales,  
       (SELECT AVG(total) FROM facturas WHERE estado_factura IN ('pendiente', 'pagada')) as promedio_venta,  
       (SELECT COUNT(*) FROM productos WHERE stock <= 5) as productos_stock_critico`
  );
  return result.rows[0];
};