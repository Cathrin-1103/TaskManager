import mongoose from 'mongoose';
import { config } from '../src/config';
import { User } from '../src/models/User';

export async function connectTestDB() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(config.mongoUri);
    await User.collection.dropIndexes().catch(() => {});
  }
}

export async function disconnectTestDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
}
