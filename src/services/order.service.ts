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
        codigo_postal_entrega, telefono_contacto, nombre_completo, estado
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'confirmado')
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
      `SELECT pd.*, p.nombre as producto_nombre, p.imagen_url
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

export const getCarritoUsuario = async (idUsuario: number): Promise<PedidoConDetalles | null> => {
  const result = await pool.query(
    `SELECT p.* FROM pedidos p 
     WHERE p.id_usuario = $1 AND p.estado = 'pendiente' 
     ORDER BY p.fecha_creacion DESC LIMIT 1`,
    [idUsuario]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const pedido = result.rows[0];
  const detallesResult = await pool.query(
    `SELECT pd.*, pr.nombre as producto_nombre, pr.imagen_url, pr.precio
     FROM pedido_detalle pd
     JOIN productos pr ON pd.id_producto = pr.id_producto
     WHERE pd.id_pedido = $1`,
    [pedido.id_pedido]
  );

  pedido.detalles = detallesResult.rows;
  
  pedido.subtotal = pedido.detalles.reduce((sum: number, detalle: any) => sum + detalle.subtotal_linea, 0);
  pedido.costo_envio = Math.max(pedido.subtotal * 0.1, 500);
  pedido.total = pedido.subtotal + pedido.costo_envio;
  
  return pedido;
};

export const agregarAlCarrito = async (idUsuario: number, idProducto: number, cantidad: number): Promise<PedidoConDetalles> => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    let pedidoResult = await client.query(
      `SELECT * FROM pedidos 
       WHERE id_usuario = $1 AND estado = 'pendiente' 
       LIMIT 1`,
      [idUsuario]
    );

    let pedido;
    if (pedidoResult.rows.length === 0) {
      pedidoResult = await client.query(
        `INSERT INTO pedidos (id_usuario, subtotal, costo_envio, total, estado, metodo_entrega, metodo_pago, direccion_entrega, ciudad_entrega, codigo_postal_entrega, telefono_contacto, nombre_completo)
         VALUES ($1, 0, 0, 0, 'pendiente', '', 'efectivo', '', '', '', '', '')
         RETURNING *`,
        [idUsuario]
      );
      pedido = pedidoResult.rows[0];
    } else {
      pedido = pedidoResult.rows[0];
    }

    const productResult = await client.query(
      'SELECT precio, stock FROM productos WHERE id_producto = $1',
      [idProducto]
    );

    if (productResult.rows.length === 0) {
      throw new Error('Producto no encontrado');
    }

    const producto = productResult.rows[0];
    if (producto.stock < cantidad) {
      throw new Error('Stock insuficiente');
    }

    const detalleExistente = await client.query(
      'SELECT * FROM pedido_detalle WHERE id_pedido = $1 AND id_producto = $2',
      [pedido.id_pedido, idProducto]
    );

    if (detalleExistente.rows.length > 0) {
      await client.query(
        'UPDATE pedido_detalle SET cantidad = cantidad + $1, subtotal_linea = (cantidad + $1) * precio_unitario WHERE id_pedido = $2 AND id_producto = $3',
        [cantidad, pedido.id_pedido, idProducto]
      );
    } else {
      await client.query(
        `INSERT INTO pedido_detalle (id_pedido, id_producto, cantidad, precio_unitario, subtotal_linea)
         VALUES ($1, $2, $3, $4, $5)`,
        [pedido.id_pedido, idProducto, cantidad, producto.precio, producto.precio * cantidad]
      );
    }

    const detallesResult = await client.query(
      'SELECT SUM(subtotal_linea) as subtotal FROM pedido_detalle WHERE id_pedido = $1',
      [pedido.id_pedido]
    );
    
    const subtotal = parseFloat(detallesResult.rows[0].subtotal) || 0;
    const costoEnvio = Math.max(subtotal * 0.1, 500);
    const total = subtotal + costoEnvio;

    await client.query(
      'UPDATE pedidos SET subtotal = $1, costo_envio = $2, total = $3 WHERE id_pedido = $4',
      [subtotal, costoEnvio, total, pedido.id_pedido]
    );

    await client.query('COMMIT');

    const carrito = await getCarritoUsuario(idUsuario);
    if (!carrito) throw new Error('Carrito no encontrado después de agregar el producto');
    return carrito;

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const eliminarDelCarrito = async (idUsuario: number, idProducto: number): Promise<PedidoConDetalles | null> => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const pedidoResult = await client.query(
      `SELECT * FROM pedidos 
       WHERE id_usuario = $1 AND estado = 'pendiente' 
       LIMIT 1`,
      [idUsuario]
    );

    if (pedidoResult.rows.length === 0) {
      throw new Error('Carrito no encontrado');
    }

    const pedido = pedidoResult.rows[0];

    await client.query(
      'DELETE FROM pedido_detalle WHERE id_pedido = $1 AND id_producto = $2',
      [pedido.id_pedido, idProducto]
    );

    const detallesResult = await client.query(
      'SELECT SUM(subtotal_linea) as subtotal FROM pedido_detalle WHERE id_pedido = $1',
      [pedido.id_pedido]
    );
    
    const subtotal = parseFloat(detallesResult.rows[0].subtotal) || 0;
    const costoEnvio = Math.max(subtotal * 0.1, 500);
    const total = subtotal + costoEnvio;

    await client.query(
      'UPDATE pedidos SET subtotal = $1, costo_envio = $2, total = $3 WHERE id_pedido = $4',
      [subtotal, costoEnvio, total, pedido.id_pedido]
    );

    const countResult = await client.query(
      'SELECT COUNT(*) FROM pedido_detalle WHERE id_pedido = $1',
      [pedido.id_pedido]
    );

    if (parseInt(countResult.rows[0].count, 10) === 0) {
      await client.query(
        'DELETE FROM pedidos WHERE id_pedido = $1',
        [pedido.id_pedido]
      );
    }

    await client.query('COMMIT');
    return await getCarritoUsuario(idUsuario);

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const confirmarCarrito = async (idUsuario: number, pedidoData: any): Promise<PedidoConDetalles> => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const carrito = await getCarritoUsuario(idUsuario);
    if (!carrito) {
      throw new Error('Carrito no encontrado');
    }

    const detallesResult = await client.query(
      'SELECT * FROM pedido_detalle WHERE id_pedido = $1',
      [carrito.id_pedido]
    );

    for (const detalle of detallesResult.rows) {
      const productResult = await client.query(
        'SELECT stock FROM productos WHERE id_producto = $1',
        [detalle.id_producto]
      );
      
      if (productResult.rows[0].stock < detalle.cantidad) {
        throw new Error(`Stock insuficiente para el producto ID ${detalle.id_producto}`);
      }
    }

    await client.query(
      `UPDATE pedidos 
       SET estado = 'confirmado', metodo_entrega = $2, metodo_pago = $3,
           direccion_entrega = $4, ciudad_entrega = $5, codigo_postal_entrega = $6,
           telefono_contacto = $7, nombre_completo = $8, fecha_actualizacion = CURRENT_TIMESTAMP
       WHERE id_pedido = $1`,
      [
        carrito.id_pedido,
        pedidoData.metodo_entrega,
        pedidoData.metodo_pago,
        pedidoData.direccion_entrega,
        pedidoData.ciudad_entrega,
        pedidoData.codigo_postal_entrega,
        pedidoData.telefono_contacto,
        pedidoData.nombre_completo
      ]
    );

    for (const detalle of detallesResult.rows) {
      await client.query(
        'UPDATE productos SET stock = stock - $1 WHERE id_producto = $2',
        [detalle.cantidad, detalle.id_producto]
      );
    }

    await client.query('COMMIT');

    const pedidoConfirmado = await getPedidoById(carrito.id_pedido);
    if (!pedidoConfirmado) throw new Error('Pedido confirmado pero no se pudo recuperar');
    return pedidoConfirmado;

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
     WHERE p.id_usuario = $1 AND p.estado != 'pendiente'
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
     WHERE p.estado != 'pendiente'
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

    await client.query(
      'DELETE FROM pedido_detalle WHERE id_pedido = $1',
      [idPedido]
    );

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

export const vaciarCarrito = async (idUsuario: number): Promise<void> => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const pedidoResult = await client.query(
      'SELECT id_pedido FROM pedidos WHERE id_usuario = $1 AND estado = $2',
      [idUsuario, 'pendiente']
    );

    if (pedidoResult.rows.length > 0) {
      const idPedido = pedidoResult.rows[0].id_pedido;
      
      await client.query(
        'DELETE FROM pedido_detalle WHERE id_pedido = $1',
        [idPedido]
      );
      
      await client.query(
        'DELETE FROM pedidos WHERE id_pedido = $1',
        [idPedido]
      );
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const actualizarCantidadCarrito = async (idUsuario: number, idProducto: number, cantidad: number) => {
  await pool.query(
    `UPDATE pedido_detalle pd
     SET cantidad = $1::int,
         subtotal_linea = $1::numeric * precio_unitario
     FROM pedidos p
     WHERE pd.id_pedido = p.id_pedido
       AND p.id_usuario = $2
       AND p.estado = 'pendiente'
       AND pd.id_producto = $3`,
    [cantidad, idUsuario, idProducto]
  );
};

