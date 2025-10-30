import mongoose, { Schema, model, models, Document, Model } from "mongoose";

// --- Subtask Definitions ---

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
  completion: { type: Number, default: 0, min: 0, max: 100 }, // Added min/max constraint
  remarks: { type: String, default: "" },
  startDate: { type: String },
  dueDate: { type: String },
  endDate: { type: String },
  timeSpent: { type: String },
}, { _id: true }); // Ensure subtasks have their own IDs

// --- Task Document Definition ---

export interface ITask extends Document {
  empId: string; // The only required field
  project?: string;
  completion?: number;
  status?: "Pending" | "In Progress" | "Completed" | string; // Use enum or allow string
  remarks?: string;
  subtasks?: ISubtask[];
  createdAt: Date;
  updatedAt: Date;

  startDate?: string;
  dueDate?: string;
  endDate?: string;
  timeSpent?: string;
}

// --- Main Task Schema ---
const TaskSchema = new Schema<ITask>(
  {
    // ✅ ONLY empId is required
    empId: { type: String, required: true, index: true }, 

    // ✅ ALL OTHER FIELDS ARE NOW OPTIONAL
    project: { type: String },
    
    startDate: { type: String }, 
    dueDate: { type: String },
    endDate: { type: String },

    completion: { type: Number, min: 0, max: 100 },
    // Use the enum here for better type enforcement, matching the Subtask status
    status: { 
        type: String, 
        enum: ["Pending", "In Progress", "Completed"], 
        default: "Pending" 
    }, 
    remarks: { type: String },
    
    subtasks: [SubtaskSchema],
    timeSpent: { type: String },
  },
  { 
    timestamps: true, // Ensures 'createdAt' and 'updatedAt' fields are automatically managed
    collection: 'employeetasks' // Explicitly setting a collection name
  }
);

// Check if model already exists before defining it (Standard Next.js practice)
const Task: Model<ITask> = models.EmployeeTask || model<ITask>("EmployeeTask", TaskSchema);

export default Task;