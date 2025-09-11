import { pool } from '../config/db';
import { Pedido, PedidoDetalle, PedidoConDetalles, CreatePedidoDto } from '../types/order';

export const createPedido = async (pedidoData: CreatePedidoDto): Promise<PedidoConDetalles> => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    let subtotal = 0;
    const detalles: any[] = [];

    for (const item of pedidoData.productos) {
      const productResult = await client.query(
        'SELECT precio, stock FROM productos WHERE id_producto = $1',
        [item.id_producto]
      );

      if (productResult.rows.length === 0) {
        throw new Error(`Producto con ID ${item.id_producto} no encontrado`);
      }

      const producto = productResult.rows[0];
      
      if (producto.stock < item.cantidad) {
        throw new Error(`Stock insuficiente para el producto ID ${item.id_producto}`);
      }

      const precioUnitario = producto.precio;
      const subtotalLinea = precioUnitario * item.cantidad;
      subtotal += subtotalLinea;

      detalles.push({
        id_producto: item.id_producto,
        cantidad: item.cantidad,
        precio_unitario: precioUnitario,
        subtotal_linea: subtotalLinea
      });
    }

    const costoEnvio = Math.max(subtotal * 0.1, 500);
    const total = subtotal + costoEnvio;

    const pedidoResult = await client.query(
      `INSERT INTO pedidos (
        id_usuario, subtotal, costo_envio, total, metodo_entrega, 
        metodo_pago, direccion_entrega, ciudad_entrega, 
        codigo_postal_entrega, telefono_contacto, nombre_completo
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        pedidoData.id_usuario,
        subtotal,
        costoEnvio,
        total,
        pedidoData.metodo_entrega,
        pedidoData.metodo_pago,
        pedidoData.direccion_entrega,
        pedidoData.ciudad_entrega,
        pedidoData.codigo_postal_entrega,
        pedidoData.telefono_contacto,
        pedidoData.nombre_completo
      ]
    );

    const pedido = pedidoResult.rows[0];

    for (const detalle of detalles) {
      await client.query(
        `INSERT INTO pedido_detalle (
          id_pedido, id_producto, cantidad, precio_unitario, subtotal_linea
        ) VALUES ($1, $2, $3, $4, $5)`,
        [pedido.id_pedido, detalle.id_producto, detalle.cantidad, detalle.precio_unitario, detalle.subtotal_linea]
      );

      await client.query(
        'UPDATE productos SET stock = stock - $1 WHERE id_producto = $2',
        [detalle.cantidad, detalle.id_producto]
      );
    }

    const detallesResult = await client.query(
      `SELECT pd.*, p.nombre as producto_nombre 
       FROM pedido_detalle pd 
       JOIN productos p ON pd.id_producto = p.id_producto 
       WHERE pd.id_pedido = $1`,
      [pedido.id_pedido]
    );

    await client.query('COMMIT');

    return {
      ...pedido,
      detalles: detallesResult.rows
    };

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const getPedidosByUsuario = async (idUsuario: number): Promise<PedidoConDetalles[]> => {
  const pedidosResult = await pool.query(
    `SELECT p.*, u.nombre, u.apellido, u.email
     FROM pedidos p
     JOIN users u ON p.id_usuario = u.id_usuario
     WHERE p.id_usuario = $1
     ORDER BY p.fecha_creacion DESC`,
    [idUsuario]
  );

  const pedidos = pedidosResult.rows;

  for (const pedido of pedidos) {
    const detallesResult = await pool.query(
      `SELECT pd.*, pr.nombre as producto_nombre, pr.imagen_url
       FROM pedido_detalle pd
       JOIN productos pr ON pd.id_producto = pr.id_producto
       WHERE pd.id_pedido = $1`,
      [pedido.id_pedido]
    );
    pedido.detalles = detallesResult.rows;
  }

  return pedidos;
};

export const getAllPedidos = async (): Promise<PedidoConDetalles[]> => {
  const pedidosResult = await pool.query(
    `SELECT p.*, u.nombre, u.apellido, u.email
     FROM pedidos p
     JOIN users u ON p.id_usuario = u.id_usuario
     ORDER BY p.fecha_creacion DESC`
  );

  const pedidos = pedidosResult.rows;

  for (const pedido of pedidos) {
    const detallesResult = await pool.query(
      `SELECT pd.*, pr.nombre as producto_nombre, pr.imagen_url
       FROM pedido_detalle pd
       JOIN productos pr ON pd.id_producto = pr.id_producto
       WHERE pd.id_pedido = $1`,
      [pedido.id_pedido]
    );
    pedido.detalles = detallesResult.rows;
  }

  return pedidos;
};

export const getPedidoById = async (idPedido: number): Promise<PedidoConDetalles | null> => {
  const pedidoResult = await pool.query(
    `SELECT p.*, u.nombre, u.apellido, u.email
     FROM pedidos p
     JOIN users u ON p.id_usuario = u.id_usuario
     WHERE p.id_pedido = $1`,
    [idPedido]
  );

  if (pedidoResult.rows.length === 0) {
    return null;
  }

  const pedido = pedidoResult.rows[0];

  const detallesResult = await pool.query(
    `SELECT pd.*, pr.nombre as producto_nombre, pr.imagen_url
     FROM pedido_detalle pd
     JOIN productos pr ON pd.id_producto = pr.id_producto
     WHERE pd.id_pedido = $1`,
    [idPedido]
  );

  pedido.detalles = detallesResult.rows;
  return pedido;
};

export const updatePedidoEstado = async (idPedido: number, estado: string): Promise<Pedido | null> => {
  const result = await pool.query(
    `UPDATE pedidos 
     SET estado = $2, fecha_actualizacion = CURRENT_TIMESTAMP
     WHERE id_pedido = $1
     RETURNING *`,
    [idPedido, estado]
  );
  return result.rows[0] || null;
};

export const deletePedido = async (idPedido: number): Promise<Pedido | null> => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const detallesResult = await client.query(
      'SELECT id_producto, cantidad FROM pedido_detalle WHERE id_pedido = $1',
      [idPedido]
    );

    for (const detalle of detallesResult.rows) {
      await client.query(
        'UPDATE productos SET stock = stock + $1 WHERE id_producto = $2',
        [detalle.cantidad, detalle.id_producto]
      );
    }

    const result = await client.query(
      'DELETE FROM pedidos WHERE id_pedido = $1 RETURNING *',
      [idPedido]
    );

    await client.query('COMMIT');
    return result.rows[0] || null;

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};