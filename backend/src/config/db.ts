import mongoose from "mongoose";
import { config } from "./index";

async function migrateCollectionToNumericIds(collectionName: string): Promise<void> {
  try {
    const db = mongoose.connection.db;
    if (!db) return;

    const collection = db.collection(collectionName);
    const docs = await collection.find().toArray();

    const nonNumericDocs = docs.filter((doc) => typeof doc._id !== "number");
    if (nonNumericDocs.length === 0) return;

    const numericDocs = docs.filter((doc) => typeof doc._id === "number");
    let nextId = numericDocs.reduce((max, d) => Math.max(max, d._id as unknown as number), 0) + 1;

    nonNumericDocs.sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return timeA - timeB;
    });

    for (const doc of nonNumericDocs) {
      const oldId = doc._id;
      await collection.deleteOne({ _id: oldId });
      (doc as Record<string, any>)._id = nextId++;
      await collection.insertOne(doc);
    }
  } catch (err) {
    console.error(`Error migrating collection ${collectionName}:`, err);
  }
}

export const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(config.mongoUri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    await migrateCollectionToNumericIds("users");
    await migrateCollectionToNumericIds("tasks");
  } catch (error) {
    console.error(`MongoDB connection error: ${error}`);
    process.exit(1);
  }
};
