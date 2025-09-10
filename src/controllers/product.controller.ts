import { Request, Response } from 'express';
import {
  getAllProductos,
  getProductoById,
  createProducto,
  updateProducto,
  deleteProducto,
  updateStock,
  searchProductos,
  getProductosByCategoria
} from '../services/product.service';

export const getProductos = async (_req: Request, res: Response): Promise<void> => {
  try {
    const productos = await getAllProductos();
    res.json(productos);
  } catch (error) {
    console.error('Error getting productos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const getProducto = async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params.id);
  
  if (isNaN(id)) {
    res.status(400).json({ error: 'ID inválido' });
    return;
  }

  try {
    const producto = await getProductoById(id);
    
    if (!producto) {
      res.status(404).json({ error: 'Producto no encontrado' });
      return;
    }
    
    res.json(producto);
  } catch (error) {
    console.error('Error getting producto:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const addProducto = async (req: Request, res: Response): Promise<void> => {
  const { nombre, descripcion, precio, stock, categoria, imagen_url } = req.body;

  try {
    const nuevoProducto = await createProducto(
      nombre,
      descripcion,
      precio,
      stock,
      categoria,
      imagen_url
    );
    
    res.status(201).json(nuevoProducto);
  } catch (error) {
    console.error('Error creating producto:', error);
    res.status(500).json({ error: 'Error creando producto' });
  }
};

export const patchProducto = async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params.id);
  
  if (isNaN(id)) {
    res.status(400).json({ error: 'ID inválido' });
    return;
  }

  const { nombre, descripcion, precio, stock, categoria, imagen_url } = req.body;

  try {
    const productoActualizado = await updateProducto(
      id,
      nombre,
      descripcion,
      precio,
      stock,
      categoria,
      imagen_url
    );

    if (!productoActualizado) {
      res.status(404).json({ error: 'Producto no encontrado' });
      return;
    }

    res.json(productoActualizado);
  } catch (error) {
    console.error('Error updating producto:', error);
    res.status(500).json({ error: 'Error actualizando producto' });
  }
};

export const removeProducto = async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params.id);
  
  if (isNaN(id)) {
    res.status(400).json({ error: 'ID inválido' });
    return;
  }

  try {
    const productoEliminado = await deleteProducto(id);
    
    if (!productoEliminado) {
      res.status(404).json({ error: 'Producto no encontrado' });
      return;
    }
    
    res.json({ message: 'Producto eliminado', producto: productoEliminado });
  } catch (error) {
    console.error('Error deleting producto:', error);
    res.status(500).json({ error: 'Error eliminando producto' });
  }
};

export const searchProductosController = async (req: Request, res: Response): Promise<void> => {
  const { q, categoria } = req.query;

  if (!q || typeof q !== 'string') {
    res.status(400).json({ error: 'Query de búsqueda requerida' });
    return;
  }

  try {
    const productos = await searchProductos(q, categoria as string);
    res.json(productos);
  } catch (error) {
    console.error('Error searching productos:', error);
    res.status(500).json({ error: 'Error en la búsqueda' });
  }
};

export const getProductosByCategoriaController = async (req: Request, res: Response): Promise<void> => {
  const { categoria } = req.params;

  try {
    const productos = await getProductosByCategoria(categoria);
    res.json(productos);
  } catch (error) {
    console.error('Error getting productos by category:', error);
    res.status(500).json({ error: 'Error obteniendo productos por categoría' });
  }
};