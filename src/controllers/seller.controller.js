import { PrismaClient } from '@prisma/client';
import { KafkaProducer } from '../kafka/producers/OrderNotification.producer.js';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const kafkaProducer = new KafkaProducer();

export class SellerController {
  async createSeller(req, res) {
    try {
      const seller = await prisma.seller.create({
        data: {
          ...req.body,
          password: await bcrypt.hash(req.body.password, 10),
          categories: Array.isArray(req.body.categories) ? req.body.categories : []
        }
      });

      res.status(201).json(seller);
    } catch (error) {
      if (error.code === 'P2002') {
        return res.status(400).json({ error: 'Email already exists' });
      }
      res.status(500).json({ error: error.message });
    }
  }

  async getAllSellers(req, res) {
    try {
      const { city, category, isVerified, isActive } = req.query;
      
      const filters = {
        where: {
          ...(city && { city }),
          ...(category && { categories: { has: category } }),
          ...(isVerified !== undefined && { isVerified: isVerified === 'true' }),
          ...(isActive !== undefined && { isActive: isActive === 'true' })
        }
      };

      const sellers = await prisma.seller.findMany({
        ...filters,
        include: {
          _count: {
            select: { products: true }
          }
        }
      });

      res.status(200).json(sellers);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getSellerById(req, res) {
    try {
      const seller = await prisma.seller.findUnique({
        where: { id: req.params.id },
        include: {
          products: true,
          _count: {
            select: { products: true }
          }
        }
      });

      if (!seller) {
        return res.status(404).json({ error: 'Seller not found' });
      }

      res.status(200).json(seller);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async updateSeller(req, res) {
    try {
      const { id } = req.params;
      const seller = await prisma.seller.update({
        where: { id },
        data: {
          ...req.body,
          categories: Array.isArray(req.body.categories) ? req.body.categories : undefined
        }
      });

      res.status(200).json(seller);
    } catch (error) {
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Seller not found' });
      }
      res.status(500).json({ error: error.message });
    }
  }

  async deleteSeller(req, res) {
    try {
      const { id } = req.params;
      
      await prisma.product.deleteMany({
        where: { sellerId: id }
      });

      await prisma.seller.delete({
        where: { id }
      });
      res.status(204).send();
    } catch (error) {
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Seller not found' });
      }
      res.status(500).json({ error: error.message });
    }
  }

  async addProduct(req, res) {
    try {
      const { id } = req.params;
      
      const seller = await prisma.seller.findUnique({
        where: { id }
      });

      if (!seller) {
        return res.status(404).json({ error: 'Seller not found' });
      }

      const product = await prisma.product.create({
        data: {
          ...req.body,
          sellerId: id,
          images: Array.isArray(req.body.images) ? req.body.images : []
        }
      });

      res.status(201).json(product);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async updateProduct(req, res) {
    try {
      const { id, productId } = req.params;

      // const existingProduct = await prisma.product.findFirst({
      //   where: {
      //     id: productId,
      //     sellerId: id
      //   }
      // });

      // if (!existingProduct) {
      //   return res.status(404).json({ error: 'Product not found' });
      // }

      const product = await prisma.product.update({
        where: { id: productId },
        data: {
          ...req.body,
          images: Array.isArray(req.body.images) ? req.body.images : undefined
        }
      });
      if (req.body.stock !== undefined) {
        await kafkaProducer.sendOrderStatusUpdate(productId, {
          type: 'PRODUCT_STOCK_UPDATE',
          productId,
          sellerId: id,
          newStock: req.body.stock,
          timestamp: new Date().toISOString()
        });
      }

      res.status(200).json(product);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async deleteProduct(req, res) {
    try {
      const { id, productId } = req.params;

      const existingProduct = await prisma.product.findFirst({
        where: {
          id: productId,
          sellerId: id
        }
      });

      if (!existingProduct) {
        return res.status(404).json({ error: 'Product not found or does not belong to this seller' });
      }

      await prisma.product.delete({
        where: { id: productId }
      });

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async verifySeller(req, res) {
    try {
      const { id } = req.params;
      const seller = await prisma.seller.update({
        where: { id },
        data: { isVerified: true }
      });

      res.status(200).json(seller);
    } catch (error) {
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Seller not found' });
      }
      res.status(500).json({ error: error.message });
    }
  }

  async updateSellerStatus(req, res) {
    try {
      const { id } = req.params;
      const { isActive } = req.body;

      if (typeof isActive !== 'boolean') {
        return res.status(400).json({ error: 'isActive must be a boolean' });
      }

      const seller = await prisma.seller.update({
        where: { id },
        data: { isActive }
      });

      // Notify about seller status change
      await kafkaProducer.sendOrderStatusUpdate(id, {
        type: 'SELLER_STATUS_UPDATE',
        sellerId: id,
        isActive,
        timestamp: new Date().toISOString()
      });

      res.status(200).json(seller);
    } catch (error) {
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Seller not found' });
      }
      res.status(500).json({ error: error.message });
    }
  }

  async respondToOrder(req, res) {
    try {
      const { id: sellerId } = req.params;
      const { orderId, accepted, reason } = req.body;

      if (typeof accepted !== 'boolean') {
        return res.status(400).json({ error: 'accepted must be a boolean' });
      }

      // Record the response
      const response = await prisma.orderResponse.create({
        data: {
          orderId,
          sellerId,
          response: accepted,
          responseTime: new Date()
        }
      });

      // Send response to Kafka
      await kafkaProducer.sendSellerResponse({
        orderId,
        sellerId,
        accepted,
        reason,
        timestamp: new Date().toISOString()
      });

      res.status(200).json(response);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}