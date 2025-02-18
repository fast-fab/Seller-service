import { Kafka } from 'kafkajs';
import { kafkaConfig } from '../../config/kafka.config.js';

export class KafkaProducer {
  constructor() {
    this.kafka = new Kafka({
      clientId: kafkaConfig.clientId,
      brokers: kafkaConfig.brokers
    });
    
    this.producer = this.kafka.producer();
    this.isConnected = false;
  }

  async connect() {
    try {
      if (!this.isConnected) {
        await this.producer.connect();
        this.isConnected = true;
        console.log('Producer connected successfully');
      }
    } catch (error) {
      console.error('Producer connection failed:', error);
      throw error;
    }
  }

  async sendOrderNotification(sellerId, orderData) {
    try {
      await this.producer.send({
        topic: kafkaConfig.topics.orderNotifications,
        messages: [
          {
            key: sellerId,
            value: JSON.stringify(orderData),
            headers: {
              'message-type': 'NEW_ORDER'
            }
          }
        ]
      });
    } catch (error) {
      console.error('Error sending order notification:', error);
      throw error;
    }
  }

  async sendSellerResponse(responseData) {
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      await this.producer.send({
        topic: kafkaConfig.topics.orderResponses,
        messages: [
          {
            key: responseData.orderId,
            value: JSON.stringify(responseData),
            headers: {
              'message-type': 'SELLER_RESPONSE'
            }
          }
        ]
      });
    } catch (error) {
      console.error('Error sending seller response:', error);
      throw error;
    }
  }

  async sendOrderStatusUpdate(orderId, status) {
    try {
      await this.producer.send({
        topic: kafkaConfig.topics.orderStatus,
        messages: [
          {
            key: orderId,
            value: JSON.stringify({
              orderId,
              status,
              timestamp: new Date().toISOString()
            }),
            headers: {
              'message-type': 'STATUS_UPDATE'
            }
          }
        ]
      });
    } catch (error) {
      console.error('Error sending status update:', error);
      throw error;
    }
  }

  async disconnect() {
    try {
      await this.producer.disconnect();
      console.log('Producer disconnected successfully');
    } catch (error) {
      console.error('Producer disconnection failed:', error);
      throw error;
    }
  }
}