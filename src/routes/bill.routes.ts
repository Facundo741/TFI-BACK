import { Router } from 'express';
import { verifyToken } from '../middleware/auth';
import { checkAdmin } from '../middleware/checkAdmin';
import {
  generarFacturaController,
  getFacturasUsuarioController,
  getFacturaByIdController,
  getFacturaByPedidoController,
  getAllFacturasController,
  updateEstadoFacturaController,
  deleteFacturaController,
  getFacturasByEstadoController,
  getEstadisticasFacturacionController
} from '../controllers/bill.controller';

const router = Router();

router.post('/generar', verifyToken, generarFacturaController);

router.get('/usuario/:idUsuario', verifyToken, getFacturasUsuarioController);

router.get('/:idFactura', verifyToken, getFacturaByIdController);

router.get('/pedido/:idPedido', verifyToken, getFacturaByPedidoController);

router.get('/', verifyToken, checkAdmin, getAllFacturasController);

router.patch('/:idFactura/estado', verifyToken, checkAdmin, updateEstadoFacturaController);

router.delete('/:idFactura', verifyToken, checkAdmin, deleteFacturaController);

router.get('/estado/:estado', verifyToken, checkAdmin, getFacturasByEstadoController);

router.get('/admin/estadisticas', verifyToken, checkAdmin, getEstadisticasFacturacionController);

export default router;