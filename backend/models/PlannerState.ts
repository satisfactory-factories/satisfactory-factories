import mongoose from "mongoose";

const PlannerStateSchema = new mongoose.Schema(
  {
    user: { type: String, required: true },
    data: { type: mongoose.Schema.Types.Mixed, required: true },
    lastSaved: { type: Date, default: Date.now },
  },
  { minimize: false}
);
export const PlannerState = mongoose.model('PlannerState', PlannerStateSchema);
