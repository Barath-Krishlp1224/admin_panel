// models/Task.ts

import mongoose, { Schema, model, models, Document } from "mongoose";

// ... ISubtask interface and SubtaskSchema remain the same ...
export interface ISubtask {
  title: string;
  status: "Pending" | "In Progress" | "Completed";
  completion: number;
  remarks?: string;
  startDate?: string;
  dueDate?: string;
  endDate?: string;
  timeSpent?: string;
}

const SubtaskSchema = new Schema<ISubtask>({
  title: { type: String, required: true },
  status: {
    type: String,
    enum: ["Pending", "In Progress", "Completed"],
    default: "Pending",
  },
  completion: { type: Number, default: 0 },
  remarks: { type: String, default: "" },
  startDate: { type: String },
  dueDate: { type: String },
  endDate: { type: String },
  timeSpent: { type: String },
});
// ... end of ISubtask and SubtaskSchema ...

export interface ITask extends Document {
  empId: string; // The only required field
  project?: string;
  // ❌ Removed 'name'
  completion?: number;
  status?: string;
  remarks?: string;
  subtasks?: ISubtask[];
  createdAt?: Date;
  updatedAt?: Date;

  startDate?: string; // Made optional
  dueDate?: string;
  endDate?: string;
  timeSpent?: string;
}

// ✅ Main Task schema (UPDATED)
const TaskSchema = new Schema<ITask>(
  {
    // ✅ ONLY empId is required
    empId: { type: String, required: true }, 

    // ✅ ALL OTHER FIELDS ARE NOW OPTIONAL (no 'required: true')
    project: { type: String },
    // ❌ REMOVED 'name' field
    
    startDate: { type: String }, 
    dueDate: { type: String },
    endDate: { type: String },

    completion: { type: Number },
    status: { type: String, default: "In Progress" }, // Keeping default for status
    remarks: { type: String },
    
    subtasks: [SubtaskSchema],
    timeSpent: { type: String },
  },
  { timestamps: true }
);

const Task = models.EmployeeTask || model<ITask>("EmployeeTask", TaskSchema);

export default Task;