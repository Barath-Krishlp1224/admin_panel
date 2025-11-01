// File: app/api/tasks/route.ts

import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Task from "@/models/Task";

/* -------------------------------------------------------------------------- */
/*                            GET → Fetch All Tasks                           */
/* -------------------------------------------------------------------------- */
export async function GET() {
  try {
    await connectDB();

    // Fetch all tasks (no empId filtering)
    const tasks = await Task.find().lean();

    return NextResponse.json({ success: true, tasks }, { status: 200 });
  } catch (err: any) {
    console.error("GET Error:", err);
    return NextResponse.json(
      { success: false, message: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

/* -------------------------------------------------------------------------- */
/*                           POST → Create a New Task                         */
/* -------------------------------------------------------------------------- */
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const data = await req.json();

    const newTask = await Task.create(data);

    return NextResponse.json(
      { success: true, message: "Task added successfully!", task: newTask },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST Error:", error.message);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 400 }
    );
  }
}