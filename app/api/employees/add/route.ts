import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Employee from "@/models/Employee";
import fs from "fs";
import path from "path";

export const config = { api: { bodyParser: false } };

export async function POST(req: Request) {
  try {
    const data = await req.formData();

    // Extract all fields
    const empId = data.get("empId")?.toString().trim() || "";
    const name = data.get("name")?.toString().trim() || "";
    const fatherName = data.get("fatherName")?.toString().trim() || "";
    const dateOfBirth = data.get("dateOfBirth")?.toString() || "";
    const joiningDate = data.get("joiningDate")?.toString() || "";
    const team = data.get("team")?.toString() || "";
    const department = data.get("department")?.toString() || "";
    const phoneNumber = data.get("phoneNumber")?.toString() || "";
    const mailId = data.get("mailId")?.toString().trim() || "";
    const accountNumber = data.get("accountNumber")?.toString() || "";
    const ifscCode = data.get("ifscCode")?.toString() || "";

    // Validate required fields
    if (
      !empId ||
      !name ||
      !fatherName ||
      !dateOfBirth ||
      !joiningDate ||
      !team ||
      !department ||
      !phoneNumber ||
      !mailId ||
      !accountNumber ||
      !ifscCode
    ) {
      return NextResponse.json(
        { success: false, message: "All fields are required" },
        { status: 400 }
      );
    }

    // Handle photo upload
    let photoPath = "";
    const photoFile = data.get("photo") as File | null;
    if (photoFile && photoFile.size > 0) {
      const uploadsDir = path.join(process.cwd(), "public", "uploads");
      if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
      const fileName = `${Date.now()}_${photoFile.name.replace(/\s/g, "_")}`;
      const filePath = path.join(uploadsDir, fileName);
      const buffer = Buffer.from(await photoFile.arrayBuffer());
      fs.writeFileSync(filePath, buffer);
      photoPath = `/uploads/${fileName}`;
    }

    await connectDB();

    // 🔍 Normalize for consistent comparison
    const normalizedEmpId = empId.toLowerCase();
    const normalizedMail = mailId.toLowerCase();
    const normalizedName = name.toLowerCase();

    // 🔎 Step-by-step duplicate checks (more reliable than a combined $or query)
    const existingEmpId = await Employee.findOne({
      empId: { $regex: new RegExp(`^${normalizedEmpId}$`, "i") },
    });
    if (existingEmpId) {
      return NextResponse.json(
        { success: false, message: "Employee ID is already registered." },
        { status: 409 }
      );
    }

    const existingEmail = await Employee.findOne({
      mailId: { $regex: new RegExp(`^${normalizedMail}$`, "i") },
    });
    if (existingEmail) {
      return NextResponse.json(
        { success: false, message: "Email ID is already registered." },
        { status: 409 }
      );
    }

    const existingNameEmp = await Employee.findOne({
      name: { $regex: new RegExp(`^${normalizedName}$`, "i") },
      empId: { $regex: new RegExp(`^${normalizedEmpId}$`, "i") },
    });
    if (existingNameEmp) {
      return NextResponse.json(
        { success: false, message: "This employee name with the same Employee ID already exists." },
        { status: 409 }
      );
    }

    // ✅ Save new employee
    const newEmployee = new Employee({
      empId,
      name,
      fatherName,
      dateOfBirth,
      joiningDate,
      team,
      department,
      phoneNumber,
      mailId,
      accountNumber,
      ifscCode,
      photo: photoPath,
    });

    await newEmployee.save();

    return NextResponse.json({
      success: true,
      message: "Employee added successfully",
      employeeId: newEmployee._id,
    });
  } catch (error: any) {
    console.error("Error adding employee:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}