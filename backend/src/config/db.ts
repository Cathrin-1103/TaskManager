import mongoose from "mongoose";
import dns from "dns";
import bcrypt from "bcryptjs";
import { User } from "../models/User";
import { config } from "./index";

try {
  dns.setServers(["8.8.8.8", "8.8.4.4"]);
} catch (_e) {}

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

async function ensureDefaultUsers(): Promise<void> {
  try {
    const alex = await User.findOne({ email: "alex@taskmanager.com" });
    if (!alex) {
      const passwordHash = await bcrypt.hash("Password123!", 10);
      await new User({
        _id: 1,
        username: "alex",
        email: "alex@taskmanager.com",
        passwordHash,
        role: "admin",
      }).save().catch(() => {});
    }

    const sarah = await User.findOne({ email: "sarah@taskmanager.com" });
    if (!sarah) {
      const passwordHash = await bcrypt.hash("Password123!", 10);
      await new User({
        _id: 2,
        username: "sarah",
        email: "sarah@taskmanager.com",
        passwordHash,
        role: "user",
      }).save().catch(() => {});
    }
  } catch (err) {
    console.error("Error ensuring default demo users:", err);
  }
}

export const connectDB = async (): Promise<void> => {
  try {
    if (mongoose.connection.readyState === 1) {
      return;
    }
    const conn = await mongoose.connect(config.mongoUri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    await migrateCollectionToNumericIds("users");
    await migrateCollectionToNumericIds("tasks");
    await ensureDefaultUsers();
  } catch (error) {
    console.error(`MongoDB connection error: ${error}`);
    if (process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "test") {
      process.exit(1);
    }
  }
};
