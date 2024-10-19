import mongoose from "mongoose";

const FactoryDataSchema = new mongoose.Schema(
  {
    user: { type: String, required: true },
    data: { type: mongoose.Schema.Types.Mixed, required: true },
    lastSaved: { type: Date, default: Date.now },
  },
  { minimize: false}
);
export const FactoryData = mongoose.model('FactoryData', FactoryDataSchema);
