import { Request, Response } from 'express';
import {
  createPedido,
  getPedidosByUsuario,
  getAllPedidos,
  getPedidoById,
  updatePedidoEstado,
  deletePedido,
  getCarritoUsuario,
  agregarAlCarrito,
  eliminarDelCarrito,
  confirmarCarrito,
  vaciarCarrito,
  actualizarCantidadCarrito
} from '../services/order.service';

export const createPedidoController = async (req: Request, res: Response): Promise<void> => {
  try {
    const pedidoData = req.body;
    const nuevoPedido = await createPedido(pedidoData);
    res.status(201).json(nuevoPedido);
  } catch (error: any) {
    console.error('Error creating pedido:', error);
    res.status(400).json({ error: error.message });
  }
};

export const getPedidosUsuarioController = async (req: Request, res: Response): Promise<void> => {
  try {
    const idUsuario = parseInt(req.params.idUsuario);
    
    if (isNaN(idUsuario)) {
      res.status(400).json({ error: 'ID de usuario inválido' });
      return;
    }

    const pedidos = await getPedidosByUsuario(idUsuario);
    res.json(pedidos);
  } catch (error) {
    console.error('Error getting user pedidos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const getAllPedidosController = async (req: Request, res: Response): Promise<void> => {
  try {
    const pedidos = await getAllPedidos();
    res.json(pedidos);
  } catch (error) {
    console.error('Error getting all pedidos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const getPedidoByIdController = async (req: Request, res: Response): Promise<void> => {
  try {
    const idPedido = parseInt(req.params.idPedido);
    
    if (isNaN(idPedido)) {
      res.status(400).json({ error: 'ID de pedido inválido' });
      return;
    }

    const pedido = await getPedidoById(idPedido);
    
    if (!pedido) {
      res.status(404).json({ error: 'Pedido no encontrado' });
      return;
    }

    res.json(pedido);
  } catch (error) {
    console.error('Error getting pedido:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const updatePedidoEstadoController = async (req: Request, res: Response): Promise<void> => {
  try {
    const idPedido = parseInt(req.params.idPedido);
    const { estado } = req.body;

    if (isNaN(idPedido)) {
      res.status(400).json({ error: 'ID de pedido inválido' });
      return;
    }

    const estadosValidos = ['pendiente', 'confirmado', 'preparando', 'enviado', 'entregado', 'cancelado'];
    if (!estadosValidos.includes(estado)) {
      res.status(400).json({ error: 'Estado de pedido inválido' });
      return;
    }

    const pedidoActualizado = await updatePedidoEstado(idPedido, estado);
    
    if (!pedidoActualizado) {
      res.status(404).json({ error: 'Pedido no encontrado' });
      return;
    }

    res.json(pedidoActualizado);
  } catch (error) {
    console.error('Error updating pedido estado:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const deletePedidoController = async (req: Request, res: Response): Promise<void> => {
  try {
    const idPedido = parseInt(req.params.idPedido);
    
    if (isNaN(idPedido)) {
      res.status(400).json({ error: 'ID de pedido inválido' });
      return;
    }

    const pedidoEliminado = await deletePedido(idPedido);
    
    if (!pedidoEliminado) {
      res.status(404).json({ error: 'Pedido no encontrado' });
      return;
    }

    res.json({ message: 'Pedido eliminado correctamente', pedido: pedidoEliminado });
  } catch (error) {
    console.error('Error deleting pedido:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const getCarritoUsuarioController = async (req: Request, res: Response): Promise<void> => {
  try {
    const idUsuario = parseInt(req.params.idUsuario);
    
    if (isNaN(idUsuario)) {
      res.status(400).json({ error: 'ID de usuario inválido' });
      return;
    }

    const carrito = await getCarritoUsuario(idUsuario);
    res.json(carrito);
  } catch (error) {
    console.error('Error getting carrito:', error);
    res.status(500).json({ error: 'Error obteniendo carrito' });
  }
};

export const agregarAlCarritoController = async (req: Request, res: Response): Promise<void> => {
  try {
    const idUsuario = parseInt(req.params.idUsuario);
    const { id_producto, cantidad } = req.body;

    if (isNaN(idUsuario)) {
      res.status(400).json({ error: 'ID de usuario inválido' });
      return;
    }

    if (!id_producto || !cantidad) {
      res.status(400).json({ error: 'ID de producto y cantidad son requeridos' });
      return;
    }

    const carrito = await agregarAlCarrito(idUsuario, id_producto, cantidad);
    res.json(carrito);
  } catch (error: any) {
    console.error('Error adding to cart:', error);
    res.status(400).json({ error: error.message });
  }
};

export const eliminarDelCarritoController = async (req: Request, res: Response): Promise<void> => {
  try {
    const idUsuario = parseInt(req.params.idUsuario);
    const idProducto = parseInt(req.params.idProducto);

    if (isNaN(idUsuario) || isNaN(idProducto)) {
      res.status(400).json({ error: 'IDs inválidos' });
      return;
    }

    const carrito = await eliminarDelCarrito(idUsuario, idProducto);
    res.json(carrito);
  } catch (error: any) {
    console.error('Error removing from cart:', error);
    res.status(400).json({ error: error.message });
  }
};

export const confirmarCarritoController = async (req: Request, res: Response): Promise<void> => {
  try {
    const idUsuario = parseInt(req.params.idUsuario);
    const pedidoData = req.body;

    if (isNaN(idUsuario)) {
      res.status(400).json({ error: 'ID de usuario inválido' });
      return;
    }

    const pedidoConfirmado = await confirmarCarrito(idUsuario, pedidoData);
    res.json(pedidoConfirmado);
  } catch (error: any) {
    console.error('Error confirming cart:', error);
    res.status(400).json({ error: error.message });
  }
};

export const vaciarCarritoController = async (req: Request, res: Response): Promise<void> => {
  try {
    const idUsuario = parseInt(req.params.idUsuario);

    if (isNaN(idUsuario)) {
      res.status(400).json({ error: 'ID de usuario inválido' });
      return;
    }

    await vaciarCarrito(idUsuario);
    res.json({ message: 'Carrito vaciado correctamente' });
  } catch (error: any) {
    console.error('Error emptying cart:', error);
    res.status(400).json({ error: error.message });
  }
};

export const actualizarCantidadCarritoController = async (req: Request, res: Response): Promise<void> => {
  try {
    const idUsuario = parseInt(req.params.idUsuario);
    const idProducto = parseInt(req.params.idProducto);
    const { cantidad } = req.body;

    if (isNaN(idUsuario) || isNaN(idProducto)) {
      res.status(400).json({ error: 'IDs inválidos' });
      return;
    }

    const carrito = await actualizarCantidadCarrito(idUsuario, idProducto, cantidad);
    res.json(carrito);
  } catch (error: any) {
    console.error('Error updating cart quantity:', error);
    res.status(400).json({ error: error.message });
  }
};
