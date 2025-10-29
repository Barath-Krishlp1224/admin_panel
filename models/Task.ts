import mongoose, { Schema, model, models, Document } from "mongoose";

export interface ISubtask {
  title: string;
  status: "Pending" | "In Progress" | "Completed";
  completion: number;
  remarks?: string;
  // 🆕 NEW SUBTASK FIELDS
  startDate?: string;
  dueDate?: string;
  endDate?: string;
  timeSpent?: string;
}

export interface ITask extends Document {
  date: string;
  empId: string;
  project: string;
  name: string;
  plan: string;
  done: string;
  completion: number;
  status: string;
  remarks?: string;
  subtasks?: ISubtask[];
  createdAt?: Date;
  updatedAt?: Date;
  // TASK FIELDS (already present)
  startDate?: string;
  dueDate?: string;
  endDate?: string;
  timeSpent?: string;
}

// ✅ Subtask schema (UPDATED)
const SubtaskSchema = new Schema<ISubtask>({
  title: { type: String, required: true },
  status: {
    type: String,
    enum: ["Pending", "In Progress", "Completed"],
    default: "Pending",
  },
  completion: { type: Number, default: 0 },
  remarks: { type: String, default: "" },
  // 🆕 NEW SCHEMA FIELDS FOR SUBTASK
  startDate: { type: String },
  dueDate: { type: String },
  endDate: { type: String },
  timeSpent: { type: String },
});

// ✅ Main Task schema (Unchanged, as task fields were added previously)
const TaskSchema = new Schema<ITask>(
  {
    date: { type: String, required: true },
    empId: { type: String, required: true },
    project: { type: String, required: true },
    name: { type: String, required: true },
    plan: { type: String, required: true },
    done: { type: String, required: true },
    completion: { type: Number, required: true },
    status: { type: String, required: true },
    remarks: { type: String },
    subtasks: [SubtaskSchema],
    startDate: { type: String },
    dueDate: { type: String },
    endDate: { type: String },
    timeSpent: { type: String },
  },
  { timestamps: true }
);

const Task = models.EmployeeTask || model<ITask>("EmployeeTask", TaskSchema);

export default Task;