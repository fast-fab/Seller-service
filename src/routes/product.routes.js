import express from 'express';
import { ProductController } from '../controllers/product.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = express.Router();
const productController = new ProductController();

router.get('/:id/products', authMiddleware, productController.getSellerProducts);

router.get('/:id/products/:productId', authMiddleware, productController.getProductById);

router.patch('/:id/products/:productId/stock', authMiddleware, productController.updateProductStock);

export default router;
