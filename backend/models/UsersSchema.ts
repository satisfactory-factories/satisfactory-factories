import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    username: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    registered: { type: Date, default: Date.now },
  }
);
export const User = mongoose.model('User', UserSchema);
