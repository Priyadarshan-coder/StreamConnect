import { Kafka } from 'kafkajs';
import { reassembleVideo } from './reassemble.js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
dotenv.config();
const kafka = new Kafka({
  clientId: 'video-transcode-service',
  brokers: [process.env.KAFKA_SECRET],
  ssl:{
    ca: [fs.readFileSync(path.resolve("./ca.pem"), "utf-8")]
  },
  sasl:{
    username: process.env.KAFKA_USER,
    password: process.env.KAFKA_PASS,
    mechanism: "plain",
  },
});

let producer=null;

export async function createProducer(){
    if(producer)return producer;
    const _producer=kafka.producer();
    await _producer.connect();
    producer=_producer;
    return producer;
}

export async function produceMessage(message) {
    const producer = await createProducer();
    await producer.send({
      topic: 'video-chunks-uploaded',
      messages: [{ key: message.uniqueId, value: JSON.stringify(message) }],
    });
    return true;
  }


  let consumer;

  // Initialize Kafka consumer and keep it running
  export async function initializeKafkaConsumer() {
    consumer = kafka.consumer({ groupId: 'video-transcode-group' });
    await consumer.connect();
    await consumer.subscribe({ topic: 'video-chunks-uploaded', fromBeginning: true });
  
    console.log('Kafka consumer connected and listening for messages...');
  
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const messageValue = message.value.toString();
        const parsedMessage = JSON.parse(messageValue);
  
        const { uniqueId, chunkPaths } = parsedMessage;
  
        // Call the video reassembly function here
        await reassembleVideo(uniqueId, chunkPaths);
       console.log(uniqueId,chunkPaths);
  
        console.log(`Processed message with uniqueId: ${uniqueId}`);
      },
    });
  }
  initializeKafkaConsumer().catch(console.error);
  
  
  