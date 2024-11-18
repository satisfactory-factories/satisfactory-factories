import mongoose from "mongoose";

export interface ShareDataSchema {
  id: string;
  data: string;
  createdBy: string;
  created: Date;
  views: number;
  lastViewed: Date;
}

const ShareSchema = new mongoose.Schema(
  {
    id: { type: String, unique: true, required: true },
    data: { type: String, required: true },
    createdBy: { type: String, required: true },
    created: { type: Date, default: Date.now },
    views: { type: Number, default: 0 },
    lastViewed: { type: Date, default: Date.now }, // Used to purge old shares after a certain period of time so database doesn't grow indefinitely
  }
);
export const Share = mongoose.model('Share', ShareSchema);
