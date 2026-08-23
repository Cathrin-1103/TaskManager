import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dns from "dns";
import { User } from "./models/User";
import { TaskModel } from "./models/Task";
import { config } from "./config";

try {
  dns.setServers(["8.8.8.8", "8.8.4.4"]);
} catch (_e) {}

export async function seedDatabase() {
  try {
    console.log("Connecting to MongoDB for seeding...");
    await mongoose.connect(config.mongoUri);

    console.log("Cleaning existing database data...");
    await User.collection.dropIndexes().catch(() => {});
    await User.deleteMany({});
    await TaskModel.deleteMany({});

    console.log("Creating seed users with email, username & password...");
    const passwordHash = await bcrypt.hash("Password123!", 10);

    const alex = new User({
      _id: 1,
      username: "alex",
      email: "alex@taskmanager.com",
      passwordHash,
    });
    await alex.save();

    const sarah = new User({
      _id: 2,
      username: "sarah",
      email: "sarah@taskmanager.com",
      passwordHash,
    });
    await sarah.save();

    console.log("Creating technical project tasks...");

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    const task1 = new TaskModel({
      _id: 1,
      userId: alex._id.toString(),
      authorEmail: alex.email,
      authorUsername: alex.username,
      title: "Fix broken login button",
      done: true,
      dueDate: tomorrow,
      likes: [alex._id.toString(), sarah._id.toString()],
      comments: [
        {
          id: "101",
          userId: sarah._id.toString(),
          userEmail: sarah.email,
          username: sarah.username,
          text: "Tested login works smoothly now!",
          createdAt: new Date(Date.now() - 3600000 * 2),
        },
      ],
    });
    await task1.save();

    const task2 = new TaskModel({
      _id: 2,
      userId: alex._id.toString(),
      authorEmail: alex.email,
      authorUsername: alex.username,
      title: "Update API endpoints",
      done: false,
      dueDate: nextWeek,
      likes: [sarah._id.toString()],
      comments: [
        {
          id: "102",
          userId: alex._id.toString(),
          userEmail: alex.email,
          username: alex.username,
          text: "Integrate middleware.",
          createdAt: new Date(Date.now() - 1800000),
        },
      ],
    });
    await task2.save();

    const task3 = new TaskModel({
      _id: 3,
      userId: sarah._id.toString(),
      authorEmail: sarah.email,
      authorUsername: sarah.username,
      title: "Set up CI/CD pipeline",
      done: false,
      dueDate: nextWeek,
      likes: [alex._id.toString()],
      comments: [],
    });
    await task3.save();

    console.log("✅ Database seeded successfully!");
    console.log("-----------------------------------------");
    console.log("Sample User Accounts (Email & Password):");
    console.log("1. Username: alex | Email: alex@taskmanager.com | Password: Password123!");
    console.log("2. Username: sarah | Email: sarah@taskmanager.com | Password: Password123!");
    console.log("-----------------------------------------");
  } catch (error) {
    console.error("Error seeding database:", error);
  } finally {
    await mongoose.connection.close();
  }
}

if (require.main === module) {
  seedDatabase();
}
