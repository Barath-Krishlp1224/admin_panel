import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/connectDB"; 
import User from "@/models/User"; 

export async function POST(req: Request) {
  try {
    await connectDB();
    // The front-end sends the identifier field as 'empIdOrEmail' in the login state
    const { empIdOrEmail, password } = await req.json(); 

    if (!empIdOrEmail || !password) {
        return NextResponse.json({ error: "Identifier and password are required" }, { status: 400 });
    }

    // Search for a user where empId OR email matches the input
    const user = await User.findOne({
      $or: [
        { empId: empIdOrEmail },
        { email: empIdOrEmail }
      ]
    });

    if (!user) {
      return NextResponse.json({ error: "User not found or invalid identifier" }, { status: 404 });
    }

    // Compare the provided password with the hashed password
    const valid = await bcrypt.compare(password, user.password);
    
    if (!valid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Return success response, excluding the password field
    return NextResponse.json({ 
        message: "Login successful", 
        user: { name: user.name, empId: user.empId, email: user.email } 
    }, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}