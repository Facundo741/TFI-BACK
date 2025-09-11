import { Router } from 'express';
import {
  createPedidoController,
  getPedidosUsuarioController,
  getAllPedidosController,
  getPedidoByIdController,
  updatePedidoEstadoController,
  deletePedidoController,
  getCarritoUsuarioController,
  agregarAlCarritoController,
  eliminarDelCarritoController,
  confirmarCarritoController,
  vaciarCarritoController,
  actualizarCantidadCarritoController
} from '../controllers/order.controller';
import { verifyToken } from '../middleware/auth';
import { checkAdmin } from '../middleware/checkAdmin';
import { validatePedidoCreation } from '../validators/order.validator';
import { handleValidationErrors } from '../middleware/validate';

const router = Router();

router.post('/', verifyToken, validatePedidoCreation, handleValidationErrors, createPedidoController);

router.get('/usuario/:idUsuario', verifyToken, getPedidosUsuarioController);

router.get('/', verifyToken, checkAdmin, getAllPedidosController);

router.get('/:idPedido', verifyToken, getPedidoByIdController);

router.patch('/:idPedido/estado', verifyToken, checkAdmin, updatePedidoEstadoController);

router.delete('/:idPedido', verifyToken, checkAdmin, deletePedidoController);

router.get('/usuario/:idUsuario/carrito', verifyToken, getCarritoUsuarioController);

router.post('/usuario/:idUsuario/carrito', verifyToken, agregarAlCarritoController);

router.delete('/usuario/:idUsuario/carrito/producto/:idProducto', verifyToken, eliminarDelCarritoController);

router.post('/usuario/:idUsuario/carrito/confirmar', verifyToken, confirmarCarritoController);

router.delete('/usuario/:idUsuario/carrito', verifyToken, vaciarCarritoController);

router.patch('/usuario/:idUsuario/carrito/producto/:idProducto', verifyToken, actualizarCantidadCarritoController);

export default router;