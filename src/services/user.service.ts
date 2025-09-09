import { pool } from '../config/db';
import { User } from '../types/user';
import bcrypt from 'bcryptjs';

export const getAllUsers = async (): Promise<User[]> => {
  const result = await pool.query(
    `SELECT id_usuario, nombre, apellido, dni, email, username, telefono, 
            direccion, ciudad, codigo_postal, role 
     FROM users 
     WHERE role != 'admin'`
  );
  return result.rows;
};

export const createUser = async (
  nombre: string, 
  apellido: string, 
  dni: string,
  email: string, 
  username: string,
  password: string,
  telefono: string,
  direccion: string,
  ciudad: string,
  codigo_postal: string
): Promise<User> => {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const result = await pool.query(
    `INSERT INTO users (nombre, apellido, dni, email, username, password, 
                       telefono, direccion, ciudad, codigo_postal, role)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'user')
     RETURNING id_usuario, nombre, apellido, dni, email, username, 
               telefono, direccion, ciudad, codigo_postal, role`,
    [nombre, apellido, dni, email, username, hashedPassword, 
     telefono, direccion, ciudad, codigo_postal]
  );
  
  return result.rows[0];
};

export const deleteUser = async (id: number): Promise<User | null> => {
  const result = await pool.query(
    `DELETE FROM users WHERE id_usuario = $1 
     RETURNING id_usuario, nombre, apellido, dni, email, username, 
               telefono, direccion, ciudad, codigo_postal, role`,
    [id]
  );
  
  return result.rows[0] || null;
};

export const updateUser = async (
  id: number,
  nombre?: string,
  apellido?: string,
  dni?: string,
  email?: string,
  username?: string,
  password?: string,
  telefono?: string,
  direccion?: string,
  ciudad?: string,
  codigo_postal?: string
): Promise<User | null> => {
  let hashedPassword = undefined;

  if (password) {
    const salt = await bcrypt.genSalt(10);
    hashedPassword = await bcrypt.hash(password, salt);
  }

  const result = await pool.query(
    `UPDATE users
     SET
        nombre = COALESCE($2, nombre),
        apellido = COALESCE($3, apellido),
        dni = COALESCE($4, dni),
        email = COALESCE($5, email),
        username = COALESCE($6, username),
        password = COALESCE($7, password),
        telefono = COALESCE($8, telefono),
        direccion = COALESCE($9, direccion),
        ciudad = COALESCE($10, ciudad),
        codigo_postal = COALESCE($11, codigo_postal),
        updated_at = CURRENT_TIMESTAMP
     WHERE id_usuario = $1
     RETURNING id_usuario, nombre, apellido, dni, email, username, 
               telefono, direccion, ciudad, codigo_postal, role`,
    [id, nombre || null, apellido || null, dni || null, email || null, 
     username || null, hashedPassword || null, telefono || null, 
     direccion || null, ciudad || null, codigo_postal || null]
  );

  return result.rows[0] || null;
};