import { Kafka } from 'kafkajs';
import { reassembleVideo } from './reassemble.js';
import fs from 'fs';
import path from 'path';
const kafka = new Kafka({
  clientId: 'video-transcode-service',
  brokers: ["kafka-145be56e-youtube-clone1.b.aivencloud.com:14896"],
  ssl:{
    ca: [fs.readFileSync(path.resolve("./ca.pem"), "utf-8")]
  },
  sasl:{
    username: "avnadmin",
    password: "AVNS_2362MCvfJOOA2aXLFyI",
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
  
  
  