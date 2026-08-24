import { Schema, model, Document } from "mongoose";

export interface IComment {
  id: string;
  userId: string;
  userEmail: string;
  username?: string;
  text: string;
  createdAt?: Date;
}

export interface ITask extends Document<number> {
  _id: number;
  userId: string;
  authorEmail?: string;
  authorUsername?: string;
  title: string;
  done: boolean;
  priority: "low" | "medium" | "high";
  dueDate?: Date;
  likes: string[];
  comments: IComment[];
}

const commentSchema = new Schema<IComment>(
  {
    id: { type: String, required: true },
    userId: { type: String, required: true },
    userEmail: { type: String, required: true },
    username: { type: String, required: false },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const taskSchema = new Schema<ITask>(
  {
    _id: {
      type: Number,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    authorEmail: {
      type: String,
      required: false,
    },
    authorUsername: {
      type: String,
      required: false,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    done: {
      type: Boolean,
      default: false,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    dueDate: {
      type: Date,
      required: false,
    },
    likes: {
      type: [String],
      default: [],
    },
    comments: {
      type: [commentSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, any>) {
        ret.id = ret._id !== undefined && ret._id !== null ? ret._id.toString() : ret.id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

taskSchema.pre("save", async function () {
  if (this.isNew && (this._id === undefined || this._id === null)) {
    const maxTask = await TaskModel.findOne().sort({ _id: -1 }).exec();
    this._id = maxTask && typeof maxTask._id === "number" ? maxTask._id + 1 : 1;
  }
});

export const TaskModel = model<ITask>("Task", taskSchema);
