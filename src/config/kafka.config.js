export const kafkaConfig = {
  clientId: 'seller-service',
  brokers: process.env.KAFKA_BROKERS?.split(',') || ['localhost:9092'],
  topics: {
    orderNotifications: 'order-notifications',
    sellerNotifications: 'seller-notifications',
    orderResponses: 'order-responses',
    orderStatus: 'order-status'
  }
}; 