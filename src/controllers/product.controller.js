import { PrismaClient } from '@prisma/client';
import { KafkaProducer } from '../kafka/producers/OrderNotification.producer.js';

const prisma = new PrismaClient();
const kafkaProducer = new KafkaProducer();

export class ProductController {
  async getSellerProducts(req, res) {
    try {
      const { id: sellerId } = req.params;
      const { category, inStock } = req.query;

      const filters = {
        where: {
          sellerId,
          ...(category && { category }),
          ...(inStock === 'true' && { stock: { gt: 0 } })
        }
      };

      const products = await prisma.product.findMany(filters);
      res.status(200).json(products);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getProductById(req, res) {
    try {
      const { id: sellerId, productId } = req.params;

      const product = await prisma.product.findFirst({
        where: {
          id: productId,
          sellerId
        }
      });

      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      res.status(200).json(product);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async updateProductStock(req, res) {
    try {
      const { id: sellerId, productId } = req.params;
      const { stock } = req.body;

      if (typeof stock !== 'number' || stock < 0) {
        return res.status(400).json({ error: 'Stock must be a non-negative number' });
      }

      const product = await prisma.product.update({
        where: {
          id: productId,
          sellerId
        },
        data: { stock }
      });

      // Notify about stock update
      await kafkaProducer.sendOrderStatusUpdate(productId, {
        type: 'PRODUCT_STOCK_UPDATE',
        productId,
        sellerId,
        newStock: stock,
        timestamp: new Date().toISOString()
      });

      res.status(200).json(product);
    } catch (error) {
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Product not found' });
      }
      res.status(500).json({ error: error.message });
    }
  }
}