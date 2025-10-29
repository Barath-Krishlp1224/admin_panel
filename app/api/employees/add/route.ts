import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Employee from "@/models/Employee";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";

export const config = {
  api: { bodyParser: false },
};

// 🔹 Initialize AWS S3 Client
const s3 = new S3Client({
  region: process.env.S3_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// 🔹 POST: Add Employee
export async function POST(req: Request) {
  try {
    const data = await req.formData();

    // Extract fields
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
        { success: false, message: "All fields are required." },
        { status: 400 }
      );
    }

    // 🔹 Upload photo to S3
    let photoUrl = "";
    const photoFile = data.get("photo") as File | null;

    if (photoFile && photoFile.size > 0) {
      const arrayBuffer = await photoFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const fileName = `${Date.now()}_${uuidv4()}_${photoFile.name.replace(/\s/g, "_")}`;

      const uploadParams = {
        Bucket: process.env.S3_BUCKET_NAME!,
        Key: fileName,
        Body: buffer,
        ContentType: photoFile.type,
      };

      await s3.send(new PutObjectCommand(uploadParams));

      // Public S3 URL
      photoUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.S3_REGION}.amazonaws.com/${fileName}`;
    }

    // 🔹 Connect to DB
    await connectDB();

    // Normalize for duplicate checks
    const normalizedEmpId = empId.toLowerCase();
    const normalizedMail = mailId.toLowerCase();
    const normalizedName = name.toLowerCase();

    // Duplicate checks
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

    // ✅ Create new employee document
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
      photo: photoUrl, // use S3 URL here
    });

    await newEmployee.save();

    return NextResponse.json({
      success: true,
      message: "Employee added successfully!",
      employeeId: newEmployee._id,
      photoUrl,
    });
  } catch (error: any) {
    console.error("Error adding employee:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}