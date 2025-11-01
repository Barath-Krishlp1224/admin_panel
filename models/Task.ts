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
    project: { type: String, required: true },
    description: { type: String },
    startDate: { type: String },
    endDate: { type: String },
    dueDate: { type: String },
    status: { type: String, default: "Pending" },
    subtasks: [SubtaskSchema],
  },
  { timestamps: true }
);

const Task = models.Task || model("Task", TaskSchema);
export default Task;