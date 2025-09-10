import { body } from 'express-validator';

export const validateProductoCreation = [
  body('nombre')
    .notEmpty().withMessage('Nombre es requerido')
    .isLength({ min: 2, max: 100 }).withMessage('Nombre debe tener entre 2 y 100 caracteres'),

  body('descripcion')
    .notEmpty().withMessage('Descripción es requerida')
    .isLength({ min: 10, max: 500 }).withMessage('Descripción debe tener entre 10 y 500 caracteres'),

  body('precio')
    .isFloat({ min: 0 }).withMessage('Precio debe ser un número positivo'),

  body('stock')
    .isInt({ min: 0 }).withMessage('Stock debe ser un número entero positivo'),

  body('categoria')
    .notEmpty().withMessage('Categoría es requerida')
    .isLength({ min: 2, max: 50 }).withMessage('Categoría debe tener entre 2 y 50 caracteres'),

  body('imagen_url')
    .optional()
    .isURL().withMessage('Debe ser una URL válida')
    .custom((value) => {
      if (value) {
        const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
        const hasValidExtension = allowedExtensions.some(ext => 
          value.toLowerCase().endsWith(ext)
        );
        
        if (!hasValidExtension) {
          throw new Error('La imagen debe ser JPG, JPEG, PNG, GIF o WEBP');
        }
      }
      return true;
    })
];

export const validateProductoUpdate = [
  body('nombre')
    .optional()
    .isLength({ min: 2, max: 100 }).withMessage('Nombre debe tener entre 2 y 100 caracteres'),

  body('descripcion')
    .optional()
    .isLength({ min: 10, max: 500 }).withMessage('Descripción debe tener entre 10 y 500 caracteres'),

  body('precio')
    .optional()
    .isFloat({ min: 0 }).withMessage('Precio debe ser un número positivo'),

  body('stock')
    .optional()
    .isInt({ min: 0 }).withMessage('Stock debe ser un número entero positivo'),

  body('categoria')
    .optional()
    .isLength({ min: 2, max: 50 }).withMessage('Categoría debe tener entre 2 y 50 caracteres'),

  body('imagen_url')
    .optional()
    .isURL().withMessage('Debe ser una URL válida')
    .custom((value) => {
      if (value) {
        const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
        const hasValidExtension = allowedExtensions.some(ext => 
          value.toLowerCase().endsWith(ext)
        );
        
        if (!hasValidExtension) {
          throw new Error('La imagen debe ser JPG, JPEG, PNG, GIF o WEBP');
        }
      }
      return true;
    })
];