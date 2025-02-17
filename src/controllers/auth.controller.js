import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { AuthError } from '../utils/errors.js';
import { generateRefreshToken, verifyRefreshToken } from '../services/token.service.js';

const prisma = new PrismaClient();

export class AuthController {
  async login(req, res) {
    try {
      const { email, password } = req.body;

      const seller = await prisma.seller.findUnique({
        where: { email }
      });

      if (!seller) {
        throw new AuthError('Invalid credentials');
      }

      const isValidPassword = await bcrypt.compare(password, seller.password);
      if (!isValidPassword) {
        throw new AuthError('Invalid credentials');
      }

      const accessToken = jwt.sign(
        { sellerId: seller.id },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      const refreshToken = await generateRefreshToken(seller.id);

      res.status(200).json({
        accessToken,
        refreshToken,
        seller: {
          id: seller.id,
          email: seller.email,
          shopName: seller.shopName,
          isVerified: seller.isVerified
        }
      });
    } catch (error) {
      if (error instanceof AuthError) {
        return res.status(401).json({ error: error.message });
      }
      res.status(500).json({ error: 'Login failed' });
    }
  }

  async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        throw new AuthError('Refresh token required');
      }

      const sellerId = await verifyRefreshToken(refreshToken);
      
      const seller = await prisma.seller.findUnique({
        where: { id: sellerId }
      });

      const accessToken = jwt.sign(
        { sellerId: seller.id },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      res.status(200).json({ accessToken });
    } catch (error) {
      if (error instanceof AuthError) {
        return res.status(401).json({ error: error.message });
      }
      res.status(500).json({ error: 'Token refresh failed' });
    }
  }

  async logout(req, res) {
    try {
      const { refreshToken } = req.body;
      
      await prisma.refreshToken.deleteMany({
        where: { token: refreshToken }
      });

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Logout failed' });
    }
  }
}