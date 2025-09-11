import { body } from 'express-validator';

export const validatePedidoCreation = [
  body('metodo_pago')
    .isIn(['tarjeta', 'transferencia', 'efectivo']).withMessage('Método de pago inválido'),

  body('metodo_entrega')
    .notEmpty().withMessage('Método de entrega es requerido')
    .isLength({ min: 2, max: 50 }).withMessage('Método de entrega debe tener entre 2 y 50 caracteres'),

  body('direccion_entrega')
    .notEmpty().withMessage('Dirección de entrega es requerida')
    .isLength({ min: 5, max: 200 }).withMessage('Dirección debe tener entre 5 y 200 caracteres'),

  body('ciudad_entrega')
    .notEmpty().withMessage('Ciudad de entrega es requerida')
    .isLength({ min: 2, max: 50 }).withMessage('Ciudad debe tener entre 2 y 50 caracteres'),

  body('codigo_postal_entrega')
    .notEmpty().withMessage('Código postal es requerido')
    .isLength({ min: 4, max: 10 }).withMessage('Código postal debe tener entre 4 y 10 caracteres'),

  body('telefono_contacto')
    .notEmpty().withMessage('Teléfono de contacto es requerido')
    .isLength({ min: 8, max: 20 }).withMessage('Teléfono debe tener entre 8 y 20 caracteres'),

  body('nombre_completo')
    .notEmpty().withMessage('Nombre completo es requerido')
    .isLength({ min: 2, max: 100 }).withMessage('Nombre debe tener entre 2 y 100 caracteres'),

  body('productos')
    .isArray({ min: 1 }).withMessage('Debe haber al menos un producto en el pedido'),

  body('productos.*.id_producto')
    .isInt({ min: 1 }).withMessage('ID de producto inválido'),

  body('productos.*.cantidad')
    .isInt({ min: 1 }).withMessage('Cantidad debe ser al menos 1')
];