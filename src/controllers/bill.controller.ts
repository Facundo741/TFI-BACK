import { Request, Response } from 'express';
import {
  generarFactura,
  getFacturasByUsuario,
  getFacturaById,
  getFacturaByPedido,
  getAllFacturas,
  updateEstadoFactura,
  deleteFactura,
  getFacturasByEstado,
  getEstadisticasFacturacion
} from '../services/bill.service';

export const generarFacturaController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id_pedido } = req.body;
    
    if (!id_pedido) {
      res.status(400).json({ error: 'ID de pedido es requerido' });
      return;
    }

    const factura = await generarFactura({ id_pedido });
    res.status(201).json(factura);
  } catch (error: any) {
    console.error('Error generating invoice:', error);
    res.status(400).json({ error: error.message });
  }
};

export const getFacturasUsuarioController = async (req: Request, res: Response): Promise<void> => {
  try {
    const idUsuario = parseInt(req.params.idUsuario);
    
    if (isNaN(idUsuario)) {
      res.status(400).json({ error: 'ID de usuario inválido' });
      return;
    }

    const facturas = await getFacturasByUsuario(idUsuario);
    res.json(facturas);
  } catch (error: any) {
    console.error('Error getting user invoices:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const getFacturaByIdController = async (req: Request, res: Response): Promise<void> => {
  try {
    const idFactura = parseInt(req.params.idFactura);
    
    if (isNaN(idFactura)) {
      res.status(400).json({ error: 'ID de factura inválido' });
      return;
    }

    const factura = await getFacturaById(idFactura);
    
    if (!factura) {
      res.status(404).json({ error: 'Factura no encontrada' });
      return;
    }

    res.json(factura);
  } catch (error: any) {
    console.error('Error getting invoice:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const getFacturaByPedidoController = async (req: Request, res: Response): Promise<void> => {
  try {
    const idPedido = parseInt(req.params.idPedido);
    
    if (isNaN(idPedido)) {
      res.status(400).json({ error: 'ID de pedido inválido' });
      return;
    }

    const factura = await getFacturaByPedido(idPedido);
    res.json(factura);
  } catch (error: any) {
    console.error('Error getting invoice by order:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const getAllFacturasController = async (req: Request, res: Response): Promise<void> => {
  try {
    const facturas = await getAllFacturas();
    res.json(facturas);
  } catch (error: any) {
    console.error('Error getting all invoices:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const updateEstadoFacturaController = async (req: Request, res: Response): Promise<void> => {
  try {
    const idFactura = parseInt(req.params.idFactura);
    const { estado } = req.body;
    
    if (isNaN(idFactura)) {
      res.status(400).json({ error: 'ID de factura inválido' });
      return;
    }

    const facturaActualizada = await updateEstadoFactura(idFactura, estado);
    
    if (!facturaActualizada) {
      res.status(404).json({ error: 'Factura no encontrada' });
      return;
    }

    res.json(facturaActualizada);
  } catch (error: any) {
    console.error('Error updating invoice status:', error);
    res.status(400).json({ error: error.message });
  }
};

export const deleteFacturaController = async (req: Request, res: Response): Promise<void> => {
  try {
    const idFactura = parseInt(req.params.idFactura);
    
    if (isNaN(idFactura)) {
      res.status(400).json({ error: 'ID de factura inválido' });
      return;
    }

    const facturaEliminada = await deleteFactura(idFactura);
    
    if (!facturaEliminada) {
      res.status(404).json({ error: 'Factura no encontrada' });
      return;
    }

    res.json({ message: 'Factura eliminada correctamente', factura: facturaEliminada });
  } catch (error: any) {
    console.error('Error deleting invoice:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const getFacturasByEstadoController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { estado } = req.params;
    
    const facturas = await getFacturasByEstado(estado);
    res.json(facturas);
  } catch (error: any) {
    console.error('Error getting invoices by status:', error);
    res.status(400).json({ error: error.message });
  }
};

export const getEstadisticasFacturacionController = async (req: Request, res: Response): Promise<void> => {
  try {
    const estadisticas = await getEstadisticasFacturacion();
    res.json(estadisticas);
  } catch (error: any) {
    console.error('Error getting billing statistics:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};