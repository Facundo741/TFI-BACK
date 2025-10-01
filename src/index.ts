import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import productRoutes from './routes/product.routes';
import orderRoutes from './routes/order.routes';
import billRoutes from './routes/bill.routes';
import reportsRoutes from './routes/reports.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors({
  origin: process.env.URL_HOST,
  credentials: true
}));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products',productRoutes)
app.use('/api/order', orderRoutes);
app.use('/api/bill', billRoutes);
app.use('/api/reports', reportsRoutes);


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
});
