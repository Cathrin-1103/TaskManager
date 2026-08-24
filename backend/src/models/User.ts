import { Schema, model, Document } from "mongoose";

export interface IUser extends Document<number> {
  _id: number;
  username: string;
  email: string;
  passwordHash: string;
  role: "user" | "admin";
  refreshTokens: string[];
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
}

const userSchema = new Schema<IUser>(
  {
    _id: {
      type: Number,
    },
    username: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    refreshTokens: {
      type: [String],
      default: [],
    },
    resetPasswordToken: {
      type: String,
    },
    resetPasswordExpires: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, any>) {
        ret.id = ret._id !== undefined && ret._id !== null ? ret._id.toString() : ret.id;
        delete ret._id;
        delete ret.__v;
        delete ret.passwordHash;
        delete ret.resetPasswordToken;
        delete ret.resetPasswordExpires;
        return ret;
      },
    },
  }
);

userSchema.pre("save", async function () {
  if (this.isNew && (this._id === undefined || this._id === null)) {
    const maxUser = await User.findOne().sort({ _id: -1 }).exec();
    this._id = maxUser && typeof maxUser._id === "number" ? maxUser._id + 1 : 1;
  }
});

export const User = model<IUser>("User", userSchema);
