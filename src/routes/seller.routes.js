import { Router } from 'express';
import { SellerController } from '../controllers/seller.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();
const sellerController = new SellerController();

router.post('/register', sellerController.createSeller);
router.get('/', authMiddleware, sellerController.getAllSellers);
router.get('/:id', authMiddleware, sellerController.getSellerById);
router.put('/:id', authMiddleware, sellerController.updateSeller);
router.delete('/:id', authMiddleware, sellerController.deleteSeller);

router.post('/:id/products', authMiddleware, sellerController.addProduct);
router.put('/:id/products/:productId', authMiddleware, sellerController.updateProduct);
router.delete('/:id/products/:productId', authMiddleware, sellerController.deleteProduct);

router.patch('/:id/verify', authMiddleware, sellerController.verifySeller);
router.patch('/:id/status', authMiddleware, sellerController.updateSellerStatus);

router.post('/:id/order-response', authMiddleware, sellerController.respondToOrder);

export default router;