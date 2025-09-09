import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { pool } from '../config/db';
import dotenv from 'dotenv';

dotenv.config();

export const loginUser = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      res.status(401).json({ error: 'Credenciales inválidas' });
      return;
    }

    const user = result.rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      res.status(401).json({ error: 'Credenciales inválidas' });
      return;
    }

    const token = jwt.sign(
      { 
        id: user.id_usuario, 
        email: user.email, 
        username: user.username,
        role: user.role,
        nombre: user.nombre,
        apellido: user.apellido,
        dni: user.dni
      },
      process.env.TOKEN_SECRET as string,
      { expiresIn: '1h' }
    );

    res.json({ 
      message: 'Login exitoso', 
      token,
      user: {
        id: user.id_usuario,
        nombre: user.nombre,
        apellido: user.apellido,
        dni: user.dni,
        email: user.email,
        username: user.username,
        telefono: user.telefono,
        direccion: user.direccion,
        ciudad: user.ciudad,
        codigo_postal: user.codigo_postal,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const logoutUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token) {
      (req as any).tokenBlacklist.add(token);
    }
    
    res.json({ 
      message: 'Logout exitoso - Elimina el token del frontend' 
    });
  } catch (error) {
    console.error('Error en logout:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};