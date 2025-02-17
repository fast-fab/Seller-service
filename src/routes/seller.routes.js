import { Router } from 'express';
import { SellerController } from '../controllers/seller.controller';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();
const sellerController = new SellerController();

router.post('/', authMiddleware, sellerController.createSeller);
router.get('/', authMiddleware, sellerController.getAllSellers);
router.get('/:id', authMiddleware, sellerController.getSellerById);
router.put('/:id', authMiddleware, validateSeller, sellerController.updateSeller);
router.delete('/:id', authMiddleware, sellerController.deleteSeller);

router.post('/:id/products', authMiddleware, validateProduct, sellerController.addProduct);
router.put('/:id/products/:productId', authMiddleware, validateProduct, sellerController.updateProduct);
router.delete('/:id/products/:productId', authMiddleware, sellerController.deleteProduct);

router.patch('/:id/verify', authMiddleware, sellerController.verifySeller);
router.patch('/:id/status', authMiddleware, sellerController.updateSellerStatus);

export default router;