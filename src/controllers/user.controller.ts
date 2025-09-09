import { Request, Response } from 'express';
import { getAllUsers, createUser, deleteUser, updateUser } from '../services/user.service';

export const getUsers = async (_req: Request, res: Response): Promise<void> => {
  try {
    const users = await getAllUsers();
    res.json(users);
  } catch (error) {
    console.error('Error getting users: ', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const addUser = async (req: Request, res: Response): Promise<void> => {
  const { nombre, apellido, dni, email, username, password, 
          telefono, direccion, ciudad, codigo_postal } = req.body;
  
  try {
    const newUser = await createUser(
      nombre, apellido, dni, email, username, password,
      telefono, direccion, ciudad, codigo_postal
    );
    res.status(201).json(newUser);
  } catch (error) {
    console.error('Error creating user: ', error);
    res.status(500).json({ message: 'Error creating user' });
  }
};

export const removeUser = async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params.id);
  
  if (isNaN(id)) {
    res.status(400).json({ error: 'Invalid ID' });
    return;
  }

  try {
    const deletedUser = await deleteUser(id);
    
    if (!deletedUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    
    res.json({ message: 'User deleted', id: deletedUser.id_usuario });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const patchUser = async (req: Request, res: Response): Promise<void> => {
  const id = Number(req.params.id);
  
  if (isNaN(id)) {
    res.status(400).json({ error: 'Invalid ID' });
    return;
  }

  const { nombre, apellido, dni, email, username, password, 
          telefono, direccion, ciudad, codigo_postal } = req.body;

  const hasFieldsToUpdate = Object.values({
    nombre, apellido, dni, email, username, password,
    telefono, direccion, ciudad, codigo_postal
  }).some(field => field !== undefined);

  if (!hasFieldsToUpdate) {
    res.status(400).json({ error: 'No data to update' });
    return;
  }

  try {
    const updated = await updateUser(
      id, nombre, apellido, dni, email, username, password,
      telefono, direccion, ciudad, codigo_postal
    );

    if (!updated) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ message: 'User updated', user: updated });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};