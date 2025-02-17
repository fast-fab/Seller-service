import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import productRoutes from "../src/routes/product.routes.js"
import sellerRoutes from '../src/routes/seller.routes.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3005;

app.use(cors());
app.use(express.json());
app.use('/api/sellers', sellerRoutes);
app.use('/api/product', productRoutes);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

export default app;