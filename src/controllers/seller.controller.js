import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export class SellerController {
  async createSeller(req, res) {
    try {
      const seller = await prisma.seller.create({
        data: {
          ...req.body,
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

      res.status(200).json(seller);
    } catch (error) {
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Seller not found' });
      }
      res.status(500).json({ error: error.message });
    }
  }
}