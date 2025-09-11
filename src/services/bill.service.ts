import { pool } from '../config/db';
import { Factura, FacturaConDetalles, GenerarFacturaDto } from '../types/bill';

export const generarFactura = async (facturaData: GenerarFacturaDto): Promise<FacturaConDetalles> => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const pedidoResult = await client.query(
      `SELECT p.*, u.nombre, u.apellido, u.dni, u.direccion 
       FROM pedidos p
       JOIN users u ON p.id_usuario = u.id_usuario
       WHERE p.id_pedido = $1 AND p.estado = 'confirmado'`,
      [facturaData.id_pedido]
    );

    if (pedidoResult.rows.length === 0) {
      throw new Error('Pedido no encontrado o no confirmado');
    }

    const pedido = pedidoResult.rows[0];

    const facturaExistente = await client.query(
      'SELECT id_factura FROM facturas WHERE id_pedido = $1',
      [facturaData.id_pedido]
    );

    if (facturaExistente.rows.length > 0) {
      throw new Error('Ya existe una factura para este pedido');
    }

    const ultimaFactura = await client.query(
      'SELECT numero_factura FROM facturas ORDER BY id_factura DESC LIMIT 1'
    );

    let nextNumber = 1;
    if (ultimaFactura.rows.length > 0) {
      const lastNumber = parseInt(ultimaFactura.rows[0].numero_factura.split('-')[1]);
      nextNumber = lastNumber + 1;
    }

    const numeroFactura = `FACT-${nextNumber.toString().padStart(6, '0')}`;

    const subtotal = pedido.subtotal;
    const iva = subtotal * 0.21;
    const total = subtotal + iva;

    const facturaResult = await client.query(
      `INSERT INTO facturas (id_pedido, numero_factura, subtotal, iva, total)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [facturaData.id_pedido, numeroFactura, subtotal, iva, total]
    );

    const factura = facturaResult.rows[0];

    const detallesResult = await client.query(
      `SELECT pd.cantidad, pd.precio_unitario, pd.subtotal_linea, pr.nombre as producto_nombre
       FROM pedido_detalle pd
       JOIN productos pr ON pd.id_producto = pr.id_producto
       WHERE pd.id_pedido = $1`,
      [facturaData.id_pedido]
    );

    await client.query(
      `UPDATE pedidos 
       SET estado = 'facturado', fecha_actualizacion = CURRENT_TIMESTAMP
       WHERE id_pedido = $1`,
      [facturaData.id_pedido]
    );

    await client.query('COMMIT');

    return {
      ...factura,
      pedido: {
        id_usuario: pedido.id_usuario,
        usuario_nombre: pedido.nombre,
        usuario_apellido: pedido.apellido,
        usuario_dni: pedido.dni,
        usuario_direccion: pedido.direccion_entrega,
        total_pedido: pedido.total
      },
      detalles: detallesResult.rows
    };

  } catch (error) {
    await client.query('ROLLBACK');
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
  try {
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

    if (facturaResult.rows.length === 0) {
      return null;
    }

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

  } catch (error) {
    console.error('Error getting factura by ID:', error);
    throw error;
  }
};

export const getFacturaByPedido = async (idPedido: number): Promise<Factura | null> => {
  const result = await pool.query(
    'SELECT * FROM facturas WHERE id_pedido = $1',
    [idPedido]
  );
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
  
  if (!estadosValidos.includes(estado)) {
    throw new Error('Estado de factura inválido');
  }

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

    const facturaResult = await client.query(
      'SELECT id_pedido FROM facturas WHERE id_factura = $1',
      [idFactura]
    );

    if (facturaResult.rows.length === 0) {
      return null;
    }

    const idPedido = facturaResult.rows[0].id_pedido;

    await client.query(
      `UPDATE pedidos 
       SET estado = 'confirmado', fecha_actualizacion = CURRENT_TIMESTAMP
       WHERE id_pedido = $1`,
      [idPedido]
    );

    const deleteResult = await client.query(
      'DELETE FROM facturas WHERE id_factura = $1 RETURNING *',
      [idFactura]
    );

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
  
  if (!estadosValidos.includes(estado)) {
    throw new Error('Estado de factura inválido');
  }

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

export const getEstadisticasFacturacion = async (): Promise<any> => {
  const result = await pool.query(
    `SELECT 
       COUNT(*) as total_facturas,
       SUM(total) as ingresos_totales,
       AVG(total) as promedio_por_factura,
       estado_factura,
       COUNT(*) FILTER (WHERE fecha_emision >= CURRENT_DATE - INTERVAL '30 days') as facturas_ultimo_mes
     FROM facturas
     GROUP BY estado_factura`
  );
  
  return result.rows;
};