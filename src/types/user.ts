export interface User {
  id_usuario: number;
  nombre: string;
  apellido: string;
  dni: string;
  email: string;
  username: string;
  password: string;
  telefono: string;
  direccion: string;
  ciudad: string;
  codigo_postal: string;
  role: 'user' | 'admin';
  created_at?: Date;
  updated_at?: Date;
}