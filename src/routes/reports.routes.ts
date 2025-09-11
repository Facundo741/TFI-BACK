import { Router } from 'express';
import { verifyToken } from '../middleware/auth';
import { checkAdmin } from '../middleware/checkAdmin';
import {
  getVentasPorPeriodoController,
  getProductosMasVendidosController,
  getIngresosTotalesController,
  getClientesTopController,
  getStockCriticoController,
  getVentasPorCategoriaController,
  getMetricasGeneralesController
} from '../controllers/reports.controller';

const router = Router();

router.get('/ventas-periodo', verifyToken, checkAdmin, getVentasPorPeriodoController);
router.get('/productos-mas-vendidos', verifyToken, checkAdmin, getProductosMasVendidosController);
router.get('/ingresos-totales', verifyToken, checkAdmin, getIngresosTotalesController);
router.get('/clientes-top', verifyToken, checkAdmin, getClientesTopController);
router.get('/stock-critico', verifyToken, checkAdmin, getStockCriticoController);
router.get('/ventas-categoria', verifyToken, checkAdmin, getVentasPorCategoriaController);
router.get('/metricas-generales', verifyToken, checkAdmin, getMetricasGeneralesController);

export default router;