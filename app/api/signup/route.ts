import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/connectDB"; 
import User from "@/models/User"; 

export async function POST(req: Request) {
  try {
    await connectDB();
    // This is correct: it destructures email from the incoming JSON payload
    const { name, empId, email, password } = await req.json(); 

    // Basic validation
    if (!name || !empId || !email || !password) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    // Check for existing user
    const existingUser = await User.findOne({ $or: [{ empId }, { email }] });
    if (existingUser) {
      if (existingUser.empId === empId) {
        return NextResponse.json({ error: "Employee ID already registered" }, { status: 400 });
      }
      if (existingUser.email === email) {
        return NextResponse.json({ error: "Email already registered" }, { status: 400 });
      }
    }

    const hashed = await bcrypt.hash(password, 10);
    // This is correct: it creates the user with the email field
    await User.create({ name, empId, email, password: hashed }); 

    return NextResponse.json({ message: "Signup successful" }, { status: 201 });
  } catch (err) {
    console.error(err);
    // If you had an error before, it was likely due to the Mongoose required field validation failing
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}