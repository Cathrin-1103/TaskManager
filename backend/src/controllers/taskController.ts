import { Response } from "express";
import { AuthenticatedRequest } from "../types";
import { TaskModel } from "../models/Task";

export const getTasks = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { search } = req.query;
    let query = {};
    if (search && typeof search === "string" && search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      query = {
        $or: [
          { title: searchRegex },
          { authorUsername: searchRegex },
          { "comments.text": searchRegex },
        ],
      };
    }

    const tasks = await TaskModel.find(query).sort({ createdAt: -1 });
    const tasksMap: Record<string, any> = {};
    tasks.forEach((task) => {
      const jsonTask: Record<string, any> = task.toJSON();
      tasksMap[jsonTask.id] = jsonTask;
    });
    res.json(tasksMap);
  } catch (error) {
    res.status(500).json({ message: "Error fetching tasks" });
  }
};

export const createTask = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id || req.user?.email;
    const authorEmail = req.user?.email || "Anonymous";
    const authorUsername = req.user?.username || req.user?.email?.split('@')[0] || "Anonymous";

    if (!userId) {
      res.status(401).json({ message: "User identity missing from token" });
      return;
    }

    let { title, dueDate, priority } = req.body;
    if (!title || typeof title !== "string" || !title.trim()) {
      res.status(400).json({ message: "Title required" });
      return;
    }

    let parsedDueDate: Date;
    if (dueDate) {
      const d = new Date(dueDate);
      if (isNaN(d.getTime())) {
        res.status(400).json({ message: "Invalid dueDate format" });
        return;
      }
      parsedDueDate = d;
    } else {
      parsedDueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }

    const validPriority = priority && ["low", "medium", "high"].includes(priority) ? priority : "medium";

    const newTask = new TaskModel({
      title: title.trim(),
      done: false,
      priority: validPriority,
      userId,
      authorEmail,
      authorUsername,
      dueDate: parsedDueDate,
    });

    await newTask.save();
    res.status(201).json(newTask.toJSON());
  } catch (error) {
    res.status(500).json({ message: "Error creating task" });
  }
};

export const updateTask = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id || req.user?.email;
    if (!userId) {
      res.status(401).json({ message: "User identity missing from token" });
      return;
    }

    const taskId = Number(req.params.id);
    const { title, done, dueDate, priority } = req.body;
    const task = await TaskModel.findById(taskId);

    if (!task) {
      res.status(404).json({ message: "Task not found" });
      return;
    }

    if (task.userId !== userId) {
      res.status(403).json({ message: "You are not authorized to modify this task" });
      return;
    }

    if (title !== undefined) {
      if (typeof title !== "string" || !title.trim()) {
        res.status(400).json({ message: "Invalid title" });
        return;
      }
      task.title = title.trim();
    }

    if (done !== undefined) {
      task.done = Boolean(done);
    }

    if (priority !== undefined) {
      if (["low", "medium", "high"].includes(priority)) {
        task.priority = priority;
      }
    }

    if (dueDate !== undefined) {
      if (dueDate === null) {
        task.dueDate = undefined;
      } else {
        const d = new Date(dueDate);
        if (isNaN(d.getTime())) {
          res.status(400).json({ message: "Invalid dueDate format" });
          return;
        }
        task.dueDate = d;
      }
    }

    await task.save();
    res.json(task.toJSON());
  } catch (error) {
    res.status(404).json({ message: "Task not found" });
  }
};

export const deleteTask = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id || req.user?.email;
    if (!userId) {
      res.status(401).json({ message: "User identity missing from token" });
      return;
    }

    const taskId = Number(req.params.id);
    const task = await TaskModel.findById(taskId);

    if (!task) {
      res.status(404).json({ message: "Task not found" });
      return;
    }

    if (task.userId !== userId) {
      res.status(403).json({ message: "You are not authorized to modify this task" });
      return;
    }

    await TaskModel.findByIdAndDelete(taskId);

    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    res.status(404).json({ message: "Task not found" });
  }
};

export const likeTask = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id || req.user?.email;
    if (!userId) {
      res.status(401).json({ message: "User identity missing from token" });
      return;
    }

    const taskId = Number(req.params.id);
    const task = await TaskModel.findById(taskId);

    if (!task) {
      res.status(404).json({ message: "Task not found" });
      return;
    }

    if (!task.likes) task.likes = [];

    if (!task.likes.includes(userId)) {
      task.likes.push(userId);
      await task.save();
    }

    res.json(task.toJSON());
  } catch (error) {
    res.status(500).json({ message: "Error liking task" });
  }
};

export const unlikeTask = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id || req.user?.email;
    if (!userId) {
      res.status(401).json({ message: "User identity missing from token" });
      return;
    }

    const taskId = Number(req.params.id);
    const task = await TaskModel.findById(taskId);

    if (!task) {
      res.status(404).json({ message: "Task not found" });
      return;
    }

    if (!task.likes) task.likes = [];

    const index = task.likes.indexOf(userId);
    if (index > -1) {
      task.likes.splice(index, 1);
      await task.save();
    }

    res.json(task.toJSON());
  } catch (error) {
    res.status(500).json({ message: "Error unliking task" });
  }
};

export const addComment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id || req.user?.email;
    const userEmail = req.user?.email || "Anonymous";
    const username = req.user?.username || req.user?.email?.split('@')[0] || "Anonymous";
    if (!userId) {
      res.status(401).json({ message: "User identity missing from token" });
      return;
    }

    const { text } = req.body;
    if (!text || typeof text !== "string" || !text.trim()) {
      res.status(400).json({ message: "Comment text required" });
      return;
    }

    const taskId = Number(req.params.id);
    const task = await TaskModel.findById(taskId);

    if (!task) {
      res.status(404).json({ message: "Task not found" });
      return;
    }

    if (!task.comments) task.comments = [];

    const newComment = {
      id: Date.now().toString(),
      userId,
      userEmail,
      username,
      text: text.trim(),
      createdAt: new Date(),
    };

    task.comments.push(newComment);
    await task.save();

    res.json(task.toJSON());
  } catch (error) {
    res.status(500).json({ message: "Error adding comment" });
  }
};
