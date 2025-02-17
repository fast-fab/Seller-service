import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class ProductController {
  async createProduct(req, res) {
    try {
      const { id: sellerId } = req.params;
      
      const seller = await prisma.seller.findUnique({
        where: { id: sellerId }
      });

      if (!seller) {
        return res.status(404).json({ error: 'Seller not found' });
      }

      if (!seller.isActive) {
        return res.status(400).json({ error: 'Seller is not active' });
      }

      const product = await prisma.product.create({
        data: {
          ...req.body,
          sellerId,
          images: Array.isArray(req.body.images) ? req.body.images : []
        }
      });
      res.status(201).json(product);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

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

  async updateProduct(req, res) {
    try {
      const { id: sellerId, productId } = req.params;

      const product = await prisma.product.update({
        where: {
          id: productId,
          sellerId
        },
        data: {
          ...req.body,
          images: Array.isArray(req.body.images) ? req.body.images : undefined
        }
      });


      res.status(200).json(product);
    } catch (error) {
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Product not found' });
      }
      res.status(500).json({ error: error.message });
    }
  }

  async deleteProduct(req, res) {
    try {
      const { id: sellerId, productId } = req.params;

      await prisma.product.delete({
        where: {
          id: productId,
          sellerId
        }
      });

      res.status(204).send();
    } catch (error) {
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Product not found' });
      }
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

      res.status(200).json(product);
    } catch (error) {
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Product not found' });
      }
      res.status(500).json({ error: error.message });
    }
  }
}