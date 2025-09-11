import { Request, Response } from 'express';
import {
  getVentasPorPeriodo,
  getProductosMasVendidos,
  getIngresosTotales,
  getClientesTop,
  getStockCritico,
  getVentasPorCategoria,
  getMetricasGenerales
} from '../services/reports.service';

export const getVentasPorPeriodoController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;
    
    if (!fecha_inicio || !fecha_fin) {
      res.status(400).json({ error: 'fecha_inicio y fecha_fin son requeridos' });
      return;
    }

    const reporte = await getVentasPorPeriodo(fecha_inicio as string, fecha_fin as string);
    res.json(reporte);
  } catch (error) {
    console.error('Error getting sales report:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const getProductosMasVendidosController = async (req: Request, res: Response): Promise<void> => {
  try {
    const limite = parseInt(req.query.limite as string) || 10;
    const reporte = await getProductosMasVendidos(limite);
    res.json(reporte);
  } catch (error) {
    console.error('Error getting top products:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const getIngresosTotalesController = async (req: Request, res: Response): Promise<void> => {
  try {
    const reporte = await getIngresosTotales();
    res.json(reporte);
  } catch (error) {
    console.error('Error getting income report:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const getClientesTopController = async (req: Request, res: Response): Promise<void> => {
  try {
    const limite = parseInt(req.query.limite as string) || 10;
    const reporte = await getClientesTop(limite);
    res.json(reporte);
  } catch (error) {
    console.error('Error getting top clients:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const getStockCriticoController = async (req: Request, res: Response): Promise<void> => {
  try {
    const nivelMinimo = parseInt(req.query.nivel_minimo as string) || 5;
    const reporte = await getStockCritico(nivelMinimo);
    res.json(reporte);
  } catch (error) {
    console.error('Error getting critical stock:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const getVentasPorCategoriaController = async (req: Request, res: Response): Promise<void> => {
  try {
    const reporte = await getVentasPorCategoria();
    res.json(reporte);
  } catch (error) {
    console.error('Error getting sales by category:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const getMetricasGeneralesController = async (req: Request, res: Response): Promise<void> => {
  try {
    const metricas = await getMetricasGenerales();
    res.json(metricas);
  } catch (error) {
    console.error('Error getting general metrics:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};