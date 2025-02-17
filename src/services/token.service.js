import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { AuthError } from '../../utils/errors';

const prisma = new PrismaClient();

export async function generateRefreshToken(sellerId) {
  const token = crypto.randomBytes(40).toString('hex');
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await prisma.refreshToken.create({
    data: {
      token,
      sellerId,
      expiresAt
    }
  });

  return token;
}

export async function verifyRefreshToken(token) {
  const refreshToken = await prisma.refreshToken.findUnique({
    where: { token }
  });

  if (!refreshToken) {
    throw new AuthError('Invalid refresh token');
  }

  if (refreshToken.expiresAt < new Date()) {
    await prisma.refreshToken.delete({
      where: { token }
    });
    throw new AuthError('Refresh token expired');
  }

  return refreshToken.sellerId;
}