import { pool } from '../config/db';
import { Producto } from '../types/product';

export const getAllProductos = async (): Promise<Producto[]> => {
  const result = await pool.query(
    'SELECT * FROM productos ORDER BY nombre'
  );
  return result.rows;
};

export const getProductoById = async (id: number): Promise<Producto | null> => {
  const result = await pool.query(
    'SELECT * FROM productos WHERE id_producto = $1',
    [id]
  );
  return result.rows[0] || null;
};

export const createProducto = async (
  nombre: string,
  descripcion: string,
  precio: number,
  stock: number,
  categoria: string,
  imagen_url?: string
): Promise<Producto> => {
  
  if (imagen_url) {
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const hasValidExtension = allowedExtensions.some(ext => 
      imagen_url.toLowerCase().endsWith(ext)
    );
    
    if (!hasValidExtension) {
      throw new Error('Formato de imagen no permitido');
    }
  }

  const result = await pool.query(
    `INSERT INTO productos (nombre, descripcion, precio, stock, categoria, imagen_url)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [nombre, descripcion, precio, stock, categoria, imagen_url]
  );
  return result.rows[0];
};

export const updateProducto = async (
  id: number,
  nombre?: string,
  descripcion?: string,
  precio?: number,
  stock?: number,
  categoria?: string,
  imagen_url?: string
): Promise<Producto | null> => {
  
  if (imagen_url) {
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const hasValidExtension = allowedExtensions.some(ext => 
      imagen_url.toLowerCase().endsWith(ext)
    );
    
    if (!hasValidExtension) {
      throw new Error('Formato de imagen no permitido');
    }
  }

  const result = await pool.query(
    `UPDATE productos 
     SET nombre = COALESCE($2, nombre),
         descripcion = COALESCE($3, descripcion),
         precio = COALESCE($4, precio),
         stock = COALESCE($5, stock),
         categoria = COALESCE($6, categoria),
         imagen_url = COALESCE($7, imagen_url),
         updated_at = CURRENT_TIMESTAMP
     WHERE id_producto = $1
     RETURNING *`,
    [id, nombre, descripcion, precio, stock, categoria, imagen_url]
  );
  return result.rows[0] || null;
};

export const deleteProducto = async (id: number): Promise<Producto | null> => {
  const result = await pool.query(
    'DELETE FROM productos WHERE id_producto = $1 RETURNING *',
    [id]
  );
  return result.rows[0] || null;
};

export const updateStock = async (id: number, cantidad: number): Promise<Producto | null> => {
  const result = await pool.query(
    'UPDATE productos SET stock = stock - $2 WHERE id_producto = $1 RETURNING *',
    [id, cantidad]
  );
  return result.rows[0] || null;
};

export const searchProductos = async (query: string, categoria?: string): Promise<Producto[]> => {
  let sql = `
    SELECT * FROM productos 
    WHERE nombre ILIKE $1 OR descripcion ILIKE $1
  `;
  let params = [`%${query}%`];

  if (categoria && categoria !== 'todos') {
    sql += ' AND categoria = $2';
    params.push(categoria);
  }

  sql += ' ORDER BY nombre';
  
  const result = await pool.query(sql, params);
  return result.rows;
};

export const getProductosByCategoria = async (categoria: string): Promise<Producto[]> => {
  const result = await pool.query(
    'SELECT * FROM productos WHERE categoria = $1 ORDER BY nombre',
    [categoria]
  );
  return result.rows;
};

export const increaseStock = async (id: number, cantidad: number) => {
  const result = await pool.query(
    'UPDATE productos SET stock = stock + $2 WHERE id_producto = $1 RETURNING *',
    [id, cantidad]
  );
  return result.rows[0] || null;
};
