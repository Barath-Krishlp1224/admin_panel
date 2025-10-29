import mongoose, { Schema, Document, Model } from "mongoose";

// Interface must reflect the exact string values used in the enum
export interface IEmployee extends Document {
  empId: string;
  name: string;
  fatherName: string;
  dateOfBirth: string;
  joiningDate: string;
  // Updated type union to reflect the final, corrected enum values
  team: "Tech" | "Accounts" | "HR" | "Admin & Operations"; 
  department: string;
  photo?: string;
  phoneNumber: string;
  mailId: string;
  accountNumber: string;
  ifscCode: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const EmployeeSchema = new Schema<IEmployee>(
  {
    empId: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true },
    fatherName: { type: String, required: true },
    dateOfBirth: { type: String, required: true },
    joiningDate: { type: String, required: true },
    team: {
      type: String,
      required: true,
      // Verified enum values: ["Tech", "Accounts", "HR", "Admin & Operations"]
      enum: ["Tech", "Accounts", "HR", "Admin & Operations"], 
    },
    department: { type: String, required: true },
    photo: { type: String, default: "" },
    phoneNumber: { type: String, required: true },
    mailId: { type: String, required: true, unique: true },
    accountNumber: { type: String, required: true },
    ifscCode: { type: String, required: true },
  },
  { timestamps: true }
);

/**
 * Ensures the Mongoose model is correctly exported, preventing redefinition errors
 * during Next.js hot module replacement (HMR).
 */
const Employee: Model<IEmployee> = (mongoose.models.Employee as Model<IEmployee>) || 
  mongoose.model<IEmployee>("Employee", EmployeeSchema);

export default Employee;