import { Kafka } from 'kafkajs';
import { kafkaConfig } from '../../config/kafka.config.js';
import { NotificationService } from '../../utils/notification.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class OrderNotificationConsumer {
  constructor() {
    this.kafka = new Kafka({
      clientId: kafkaConfig.clientId,
      brokers: kafkaConfig.brokers
    });

    this.consumer = this.kafka.consumer({ groupId: 'seller-service-group' });
    this.notificationService = new NotificationService();
  }

  async connect() {
    try {
      await this.consumer.connect();
      console.log('Consumer connected successfully');

      await this.consumer.subscribe({
        topics: [
          kafkaConfig.topics.orderNotifications,
          kafkaConfig.topics.orderResponses
        ],
        fromBeginning: true
      });
    } catch (error) {
      console.error('Consumer connection failed:', error);
      throw error;
    }
  }

  async startListening() {
    try {
      await this.consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          const messageType = message.headers['message-type']?.toString();
          const value = JSON.parse(message.value.toString());

          switch (topic) {
            case kafkaConfig.topics.orderNotifications:
              await this.handleOrderNotification(value, messageType);
              break;
            case kafkaConfig.topics.orderResponses:
              await this.handleOrderResponse(value, messageType);
              break;
          }
        }
      });
    } catch (error) {
      console.error('Error processing message:', error);
      throw error;
    }
  }

  async handleOrderNotification(orderData, messageType) {
    try {
      const notifiedSellers = await this.notificationService.notifyNearbySellerForOrder(orderData);
      
      // Store notification in database
      await prisma.notification.createMany({
        data: notifiedSellers.map(seller => ({
          sellerId: seller.id,
          title: 'New Order Request',
          message: `New order for ${orderData.productName}`,
          type: 'ORDER_REQUEST',
          metadata: orderData
        }))
      });

    } catch (error) {
      console.error('Error handling order notification:', error);
      throw error;
    }
  }

  async handleOrderResponse(responseData, messageType) {
    try {
      // Record seller's response
      await prisma.orderResponse.create({
        data: {
          orderId: responseData.orderId,
          sellerId: responseData.sellerId,
          response: responseData.accepted,
          responseTime: new Date()
        }
      });

    } catch (error) {
      console.error('Error handling order response:', error);
      throw error;
    }
  }

  async disconnect() {
    try {
      await this.consumer.disconnect();
      console.log('Consumer disconnected successfully');
    } catch (error) {
      console.error('Consumer disconnection failed:', error);
      throw error;
    }
  }
}