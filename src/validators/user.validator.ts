import { body } from 'express-validator';
import { pool } from '../config/db'; 

export const validateUserCreation = [
  body('nombre')
    .notEmpty().withMessage('Nombre es requerido')
    .isLength({ min: 2, max: 50 }).withMessage('Nombre debe tener entre 2 y 50 caracteres'),

  body('apellido')
    .notEmpty().withMessage('Apellido es requerido')
    .isLength({ min: 2, max: 30 }).withMessage('Apellido debe tener entre 2 y 30 caracteres'),

  body('dni')
    .notEmpty().withMessage('DNI es requerido')
    .isLength({ min: 7, max: 20 }).withMessage('DNI debe tener entre 7 y 20 caracteres'),

  body('email')
    .isEmail().withMessage('Email invalido')
    .custom(async (email) => {
      const result = await pool.query('SELECT id_usuario FROM users WHERE email = $1', [email]);
      if (result.rows.length > 0) {
        throw new Error('Email ya está en uso');
      }
    }),

  body('username')
    .notEmpty().withMessage('Username es requerido')
    .isLength({ min: 3, max: 50 }).withMessage('Username debe tener entre 3 y 50 caracteres')
    .custom(async (username) => {
      const result = await pool.query('SELECT id_usuario FROM users WHERE username = $1', [username]);
      if (result.rows.length > 0) {
        throw new Error('Username ya esta en uso');
      }
    }),

  body('password')
    .isLength({ min: 6 }).withMessage('Password debe tener al menos 6 caracteres')
    .matches(/[A-Z]/).withMessage('Password debe contener al menos una mayuscula')
    .matches(/\d/).withMessage('Password debe contener al menos un número')
    .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('Password debe contener al menos un caracter especial'),

  body('telefono')
    .notEmpty().withMessage('Teléfono es requerido')
    .isLength({ min: 8, max: 20 }).withMessage('Telefono debe tener entre 8 y 20 caracteres'),

  body('direccion')
    .notEmpty().withMessage('Dirección es requerida')
    .isLength({ min: 5, max: 150 }).withMessage('Direccion debe tener entre 5 y 150 caracteres'),

  body('ciudad')
    .notEmpty().withMessage('Ciudad es requerida')
    .isLength({ min: 2, max: 50 }).withMessage('Ciudad debe tener entre 2 y 50 caracteres'),

  body('codigo_postal')
    .notEmpty().withMessage('Codigo postal es requerido')
    .isLength({ min: 4, max: 10 }).withMessage('Codigo postal debe tener entre 4 y 10 caracteres')
];

export const validateUserUpdate = [
  body().custom((value, { req }) => {
    const { nombre, apellido, dni, email, username, password, 
            telefono, direccion, ciudad, codigo_postal } = req.body;
    
    const hasFieldsToUpdate = Object.values({
      nombre, apellido, dni, email, username, password,
      telefono, direccion, ciudad, codigo_postal
    }).some(field => field !== undefined);

    if (!hasFieldsToUpdate) {
      throw new Error('Al menos un campo debe ser proporcionado para actualizar');
    }
    return true;
  }),

  body('nombre')
    .optional()
    .isLength({ min: 2, max: 50 }).withMessage('Nombre debe tener entre 2 y 50 caracteres'),

  body('apellido')
    .optional()
    .isLength({ min: 2, max: 30 }).withMessage('Apellido debe tener entre 2 y 30 caracteres'),

  body('dni')
    .optional()
    .isLength({ min: 7, max: 20 }).withMessage('DNI debe tener entre 7 y 20 caracteres'),

  body('email')
    .optional()
    .isEmail().withMessage('Email invalido'),

  body('username')
    .optional()
    .isLength({ min: 3, max: 50 }).withMessage('Username debe tener entre 3 y 50 caracteres'),

  body('password')
    .optional()
    .isLength({ min: 6 }).withMessage('Password debe tener al menos 6 caracteres')
    .matches(/[A-Z]/).withMessage('Password debe contener al menos una mayuscula')
    .matches(/\d/).withMessage('Password debe contener al menos un número')
    .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('Password debe contener al menos un caracter especial'),

  body('telefono')
    .optional()
    .isLength({ min: 8, max: 20 }).withMessage('Telefono debe tener entre 8 y 20 caracteres'),

  body('direccion')
    .optional()
    .isLength({ min: 5, max: 150 }).withMessage('Direccion debe tener entre 5 y 150 caracteres'),

  body('ciudad')
    .optional()
    .isLength({ min: 2, max: 50 }).withMessage('Ciudad debe tener entre 2 y 50 caracteres'),

  body('codigo_postal')
    .optional()
    .isLength({ min: 4, max: 10 }).withMessage('Codigo postal debe tener entre 4 y 10 caracteres')
];