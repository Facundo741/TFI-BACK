import { pool } from '../config/db';
import { Factura, FacturaConDetalles, GenerarFacturaDto } from '../types/bill';

export const generarFactura = async (dto: GenerarFacturaDto): Promise<Factura> => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const pedidoQuery = await client.query(
      `SELECT p.id_pedido, p.id_usuario, p.estado_pedido
       FROM pedidos p
       WHERE p.id_pedido = $1`,
      [dto.id_pedido]
    );

    if (pedidoQuery.rowCount === 0) throw new Error("Pedido no encontrado");

    const detallesQuery = await client.query(
      `SELECT dp.id_producto, dp.cantidad, pr.precio_unitario, pr.nombre_producto
       FROM detalle_pedidos dp
       INNER JOIN productos pr ON pr.id_producto = dp.id_producto
       WHERE dp.id_pedido = $1`,
      [dto.id_pedido]
    );

    if (detallesQuery.rowCount === 0) throw new Error("El pedido no tiene productos");

    const detalles = detallesQuery.rows;
    const subtotal = detalles.reduce((acc, item) => acc + item.cantidad * item.precio_unitario, 0);
    const iva = subtotal * 0.21; 
    const total = subtotal + iva;

    const facturaInsert = await client.query(
      `INSERT INTO facturas (id_pedido, numero_factura, fecha_emision, estado_factura, subtotal, iva, total)
      VALUES ($1, CONCAT('FAC-', EXTRACT(YEAR FROM NOW()), '-', LPAD(nextval('factura_seq')::text, 6, '0')), NOW(), 'pendiente', $2, $3, $4)
      RETURNING *;`,
      [dto.id_pedido, subtotal, iva, total]
    );


    await client.query("COMMIT");
    return facturaInsert.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error generando factura:", error);
    throw error;
  } finally {
    client.release();
  }
};

export const getFacturasByUsuario = async (idUsuario: number): Promise<Factura[]> => {
  const result = await pool.query(
    `SELECT f.* 
     FROM facturas f
     JOIN pedidos p ON f.id_pedido = p.id_pedido
     WHERE p.id_usuario = $1
     ORDER BY f.fecha_emision DESC`,
    [idUsuario]
  );
  return result.rows;
};

export const getFacturaById = async (idFactura: number): Promise<FacturaConDetalles | null> => {
  const facturaResult = await pool.query(
    `SELECT f.*, p.id_usuario, p.total as total_pedido,
            u.nombre as usuario_nombre, u.apellido as usuario_apellido, 
            u.dni as usuario_dni, u.direccion as usuario_direccion
     FROM facturas f
     JOIN pedidos p ON f.id_pedido = p.id_pedido
     JOIN users u ON p.id_usuario = u.id_usuario
     WHERE f.id_factura = $1`,
    [idFactura]
  );

  if (facturaResult.rows.length === 0) return null;
  const factura = facturaResult.rows[0];

  const detallesResult = await pool.query(
    `SELECT pd.cantidad, pd.precio_unitario, pd.subtotal_linea, pr.nombre as producto_nombre
     FROM pedido_detalle pd
     JOIN productos pr ON pd.id_producto = pr.id_producto
     WHERE pd.id_pedido = $1`,
    [factura.id_pedido]
  );

  return {
    ...factura,
    pedido: {
      id_usuario: factura.id_usuario,
      usuario_nombre: factura.usuario_nombre,
      usuario_apellido: factura.usuario_apellido,
      usuario_dni: factura.usuario_dni,
      usuario_direccion: factura.usuario_direccion,
      total_pedido: factura.total_pedido
    },
    detalles: detallesResult.rows
  };
};

export const getFacturaByPedido = async (idPedido: number): Promise<Factura | null> => {
  const result = await pool.query('SELECT * FROM facturas WHERE id_pedido = $1', [idPedido]);
  return result.rows[0] || null;
};

export const getAllFacturas = async (): Promise<Factura[]> => {
  const result = await pool.query(
    `SELECT f.*, u.nombre as usuario_nombre, u.apellido as usuario_apellido
     FROM facturas f
     JOIN pedidos p ON f.id_pedido = p.id_pedido
     JOIN users u ON p.id_usuario = u.id_usuario
     ORDER BY f.fecha_emision DESC`
  );
  return result.rows;
};

export const updateEstadoFactura = async (idFactura: number, estado: string): Promise<Factura | null> => {
  const estadosValidos = ['pendiente', 'pagada', 'cancelada'];
  if (!estadosValidos.includes(estado)) throw new Error('Estado de factura inválido');

  const result = await pool.query(
    `UPDATE facturas 
     SET estado_factura = $2, updated_at = CURRENT_TIMESTAMP
     WHERE id_factura = $1
     RETURNING *`,
    [idFactura, estado]
  );
  
  return result.rows[0] || null;
};

export const deleteFactura = async (idFactura: number): Promise<Factura | null> => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const facturaResult = await client.query('SELECT id_pedido FROM facturas WHERE id_factura = $1', [idFactura]);
    if (facturaResult.rows.length === 0) return null;

    const idPedido = facturaResult.rows[0].id_pedido;
    await client.query(`UPDATE pedidos SET estado = 'confirmado', fecha_actualizacion = CURRENT_TIMESTAMP WHERE id_pedido = $1`, [idPedido]);

    const deleteResult = await client.query('DELETE FROM facturas WHERE id_factura = $1 RETURNING *', [idFactura]);
    await client.query('COMMIT');

    return deleteResult.rows[0] || null;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const getFacturasByEstado = async (estado: string): Promise<Factura[]> => {
  const estadosValidos = ['pendiente', 'pagada', 'cancelada'];
  if (!estadosValidos.includes(estado)) throw new Error('Estado de factura inválido');

  const result = await pool.query(
    `SELECT f.*, u.nombre as usuario_nombre, u.apellido as usuario_apellido
     FROM facturas f
     JOIN pedidos p ON f.id_pedido = p.id_pedido
     JOIN users u ON p.id_usuario = u.id_usuario
     WHERE f.estado_factura = $1
     ORDER BY f.fecha_emision DESC`,
    [estado]
  );
  
  return result.rows;
};

export const getEstadisticasFacturacion = async () => {
  const result = await pool.query(`
    SELECT 
      COUNT(*)::int as total_facturas,
      COALESCE(SUM(total), 0)::numeric as ingresos_totales,
      COALESCE(AVG(total), 0)::numeric as promedio_por_factura
    FROM facturas
    WHERE estado_factura IN ('pendiente', 'pagada');
  `);

  return result.rows[0];
};
