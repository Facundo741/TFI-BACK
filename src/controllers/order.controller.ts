import { Request, Response } from 'express';
import {
  createPedido,
  getPedidosByUsuario,
  getAllPedidos,
  getPedidoById,
  updatePedidoEstado,
  deletePedido
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