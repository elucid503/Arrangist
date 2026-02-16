import mongoose from 'mongoose';

let isConnected = false;
let eventListenersAttached = false;

export async function ConnectDatabase(): Promise<void> {

  if (isConnected) {
    console.log('MongoDB already connected');
    return;
  }

  const MongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
  
  // Connection pool configuration to prevent connection leaks
  const options = {
    maxPoolSize: 10,           // Maximum connections in the pool
    minPoolSize: 2,            // Minimum connections to maintain
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  };

  // Attach event listeners only once to prevent memory leaks from duplicate handlers
  if (!eventListenersAttached) {
    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
      isConnected = false;
    });

    mongoose.connection.on('error', (error) => {
      console.error('MongoDB error:', error);
    });

    eventListenersAttached = true;
  }
  
  return await mongoose.connect(MongoUri, options).then(() => {
    console.log('MongoDB connected successfully');
    isConnected = true;
  }).catch((error) => {
    console.error('MongoDB connection error:', error);
    isConnected = false;
    throw error;
  });

}

export async function DisconnectDatabase(): Promise<void> {
  if (!isConnected) return;
  
  await mongoose.connection.close();
  isConnected = false;
  console.log('MongoDB connection closed');
}

export default mongoose;