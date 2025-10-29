import { NextRequest, NextResponse } from "next/server";
import { connectDB, mongoose } from "@/lib/mongodb";

interface DeleteBody {
  id: string;
}

// Define the Employee model
const Employee = mongoose.models.Employee || mongoose.model("Employee", new mongoose.Schema({
  name: String,
  email: String,
  role: String,
}));

export async function DELETE(req: NextRequest) {
  try {
    await connectDB(); // connect to MongoDB

    const body: DeleteBody = await req.json();
    const { id } = body;
    if (!id) return NextResponse.json({ message: "ID is required" }, { status: 400 });

    const result = await Employee.findByIdAndDelete(id);
    if (!result) return NextResponse.json({ message: "Employee not found" }, { status: 404 });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}