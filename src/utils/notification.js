import axios from 'axios';
import { calculateDistance } from './geolocation.js';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient()

export class NotificationService {
  constructor() {
    this.fcmEndpoint = process.env.FCM_ENDPOINT;
    this.fcmServerKey = process.env.FCM_SERVER_KEY;
  }

  async sendPushNotification(sellerId, notification) {
    try {
      const seller = await prisma.seller.findUnique({
        where: { id: sellerId }
      });

      if (!seller || !seller.fcmToken) {
        throw new Error('Seller FCM token not found');
      }

      const message = {
        to: seller.fcmToken,
        notification: {
          title: notification.title,
          body: notification.body,
        },
        data: notification.data
      };

      await axios.post(this.fcmEndpoint, message, {
        headers: {
          'Authorization': `key=${this.fcmServerKey}`,
          'Content-Type': 'application/json'
        }
      });

      return true;
    } catch (error) {
      console.error('Push notification failed:', error);
      return false;
    }
  }

  async notifyNearbySellerForOrder(orderData) {
    try {
      const sellers = await prisma.seller.findMany({
        where: {
          isActive: true,
          isVerified: true
        },
        include: {
          products: {
            where: {
              id: orderData.productId
            }
          }
        }
      });

      const nearbySellers = sellers.filter(seller => {
        const hasProduct = seller.products.some(product => 
          product.id === orderData.productId && product.stock > 0
        );

        if (!hasProduct) return false;
        const distance = calculateDistance(
          seller.latitude,
          seller.longitude,
          orderData.deliveryLatitude,
          orderData.deliveryLongitude
        );

        return distance <= 5;
      });

      const notificationPromises = nearbySellers.map(seller => {
        const notification = {
          title: 'New Order Request',
          body: `New order for ${orderData.productName}. Are you available to fulfill?`,
          data: {
            orderId: orderData.orderId,
            productId: orderData.productId,
            quantity: orderData.quantity,
            type: 'ORDER_REQUEST'
          }
        };

        return this.sendPushNotification(seller.id, notification);
      });

      await Promise.all(notificationPromises);

      return nearbySellers.length;
    } catch (error) {
      console.error('Error notifying nearby sellers:', error);
      throw error;
    }
  }
}