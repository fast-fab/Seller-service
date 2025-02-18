import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { KafkaProducer } from './kafka/producers/OrderNotification.producer.js';
import { OrderNotificationConsumer } from './kafka/consumers/OrderNotification.consumer.js';
import productRoutes from "../src/routes/product.routes.js"
import sellerRoutes from '../src/routes/seller.routes.js';
import authRoutes from '../src/routes/auth.routes.js';
import { errorHandler } from './utils/errors.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3005;

const kafkaProducer = new KafkaProducer();
const kafkaConsumer = new OrderNotificationConsumer();

const initializeKafka = async () => {
  try {
    await kafkaProducer.connect();
    await kafkaConsumer.connect();
    await kafkaConsumer.startListening();
    console.log('Kafka initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Kafka:', error);
    process.exit(1);
  }
};

const shutdown = async () => {
  try {
    await kafkaProducer.disconnect();
    await kafkaConsumer.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

app.use(cors());
app.use(express.json());
app.use('/api/sellers', sellerRoutes);
app.use('/api/product', productRoutes);
app.use('/api/auth', authRoutes);

app.use(errorHandler);

app.listen(port, async () => {
  await initializeKafka();
  console.log(`Server running on port ${port}`);
});

export default app;