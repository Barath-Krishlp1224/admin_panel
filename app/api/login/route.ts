import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/connectDB"; 
import User from "@/models/User"; 

export async function POST(req: Request) {
  try {
    await connectDB();
    const { empIdOrEmail, password } = await req.json(); 

    if (!empIdOrEmail || !password) {
        return NextResponse.json({ error: "Identifier and password are required" }, { status: 400 });
    }

    const user = await User.findOne({
      $or: [
        { empId: empIdOrEmail },
        { email: empIdOrEmail }
      ]
    });

    if (!user) {
      return NextResponse.json({ error: "User not found or invalid identifier" }, { status: 404 });
    }

    const valid = await bcrypt.compare(password, user.password);
    
    if (!valid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // ✅ FIX: Ensure user.role is explicitly returned in the response
    return NextResponse.json({ 
        message: "Login successful", 
        user: { 
            name: user.name, 
            empId: user.empId, 
            email: user.email, 
            role: user.role // <-- Must be here and match the model field
        } 
    }, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}