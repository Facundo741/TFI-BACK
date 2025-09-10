import { Router } from 'express';
import {
  getProductos,
  getProducto,
  addProducto,
  patchProducto,
  removeProducto,
  searchProductosController,
  getProductosByCategoriaController
} from '../controllers/product.controller';
import { verifyToken } from '../middleware/auth';
import { checkAdmin } from '../middleware/checkAdmin';
import { validateProductoCreation, validateProductoUpdate } from '../validators/product.validator';
import { handleValidationErrors } from '../middleware/validate';

const router = Router();

router.get('/', getProductos);
router.get('/search', searchProductosController);
router.get('/categoria/:categoria', getProductosByCategoriaController);
router.get('/:id', getProducto);
router.post('/create', verifyToken, checkAdmin, validateProductoCreation, handleValidationErrors, addProducto);
router.patch('/:id', verifyToken, checkAdmin, validateProductoUpdate, handleValidationErrors, patchProducto);
router.delete('/:id', verifyToken, checkAdmin, removeProducto);

export default router;