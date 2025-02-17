import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { ProductController } from '../controllers/product.controller';

const router = Router();
const sellerController = new SellerController();

router.post('/:id/products', authMiddleware, validateProduct, ProductController.ad);
router.put('/:id/products/:productId', authMiddleware, validateProduct, sellerController.updateProduct);
router.delete('/:id/products/:productId', authMiddleware, sellerController.deleteProduct);

export default router;