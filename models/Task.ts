import mongoose, { Schema, model, models } from "mongoose";

const SubtaskSchema = new Schema({
  title: { type: String, required: true },
  status: { type: String, default: "Pending" },
  completion: { type: Number, default: 0 },
  remarks: { type: String },
  startDate: { type: String },
  dueDate: { type: String },
  endDate: { type: String },
  timeSpent: { type: String },
  assignee: { type: String },
});

const TaskSchema = new Schema(
  {
    // ✅ NEW FIELD: projectId
    projectId: { type: String, required: true, unique: true }, // Added required and unique constraint
    // ✅ NEW FIELD: assigneeName
    assigneeName: { type: String, required: true },
    project: { type: String, required: true },
    // 💬 Changed 'description' to 'remarks' for consistency with frontend
    remarks: { type: String }, 
    startDate: { type: String },
    endDate: { type: String },
    dueDate: { type: String },
    status: { type: String, default: "In Progress" }, // Set default to 'In Progress' for consistency
    // ✅ NEW FIELD: completion
    completion: { type: Number, default: 0, min: 0, max: 100 }, 
    subtasks: [SubtaskSchema],
  },
  { timestamps: true }
);

const Task = models.Task || model("Task", TaskSchema);
export default Task;