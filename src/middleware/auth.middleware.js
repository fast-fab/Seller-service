import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { AuthError } from '../../utils/errors';

const prisma = new PrismaClient();

export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthError('No token provided');
    }

    const token = authHeader.split(' ')[1];
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      const seller = await prisma.seller.findUnique({
        where: { id: decoded.sellerId }
      });

      if (!seller) {
        throw new AuthError('Seller not found');
      }
      req.seller = seller;
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new AuthError('Token expired');
      }
      if (error.name === 'JsonWebTokenError') {
        throw new AuthError('Invalid token');
      }
      throw error;
    }
  } catch (error) {
    if (error instanceof AuthError) {
      return res.status(401).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Authentication error' });
  }
};
