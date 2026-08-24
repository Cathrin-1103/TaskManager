import { Response } from "express";
import { User } from "../models/User";
import { TaskModel } from "../models/Task";
import { AuthenticatedRequest } from "../types";

export const getAdminStats = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const totalUsers = await User.countDocuments();
    const totalTasks = await TaskModel.countDocuments();
    const completedTasks = await TaskModel.countDocuments({ done: true });
    const activeTasks = totalTasks - completedTasks;

    res.json({
      totalUsers,
      totalTasks,
      completedTasks,
      activeTasks,
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching admin stats" });
  }
};

export const getAllUsers = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    const usersWithStats = await Promise.all(
      users.map(async (u) => {
        const jsonUser = u.toJSON();
        const taskCount = await TaskModel.countDocuments({
          $or: [
            { userId: u._id.toString() },
            { userId: u.email },
            { authorEmail: u.email },
          ],
        });
        return {
          ...jsonUser,
          taskCount,
        };
      })
    );

    res.json(usersWithStats);
  } catch (error) {
    res.status(500).json({ message: "Error fetching users" });
  }
};

export const updateUserRole = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.params.id;
    const { role } = req.body;

    if (!role || !["user", "admin"].includes(role)) {
      res.status(400).json({ message: "Role must be 'user' or 'admin'" });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    user.role = role;
    await user.save();

    res.json({ message: `User role updated to ${role}`, user: user.toJSON() });
  } catch (error) {
    res.status(500).json({ message: "Error updating user role" });
  }
};

export const deleteUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.params.id;
    if (req.user?.id === userId) {
      res.status(400).json({ message: "Cannot delete your own admin account" });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    await TaskModel.deleteMany({
      $or: [
        { userId: user._id.toString() },
        { userId: user.email },
        { authorEmail: user.email },
      ],
    });

    await User.findByIdAndDelete(userId);

    res.json({ message: "User and associated tasks deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting user" });
  }
};
