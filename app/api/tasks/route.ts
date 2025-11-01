// File: app/api/tasks/route.ts

import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Task from "@/models/Task";

/* -------------------------------------------------------------------------- */
/* GET → Fetch All Tasks                           */
/* -------------------------------------------------------------------------- */
export async function GET() {
  try {
    await connectDB();

    // Fetch all tasks, excluding subtasks for a lighter list view
    const tasks = await Task.find({}, '-subtasks').sort({ createdAt: -1 }).lean();

    return NextResponse.json({ success: true, tasks }, { status: 200 });
  } catch (err: any) {
    console.error("🔥 GET Error (Fetch All Tasks):", err);
    return NextResponse.json(
      { success: false, error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

/* -------------------------------------------------------------------------- */
/* POST → Create a New Task                         */
/* -------------------------------------------------------------------------- */
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();

    const {
      assigneeName,
      projectId,
      project,
      startDate,
      endDate,
      dueDate,
      completion,
      status,
      remarks,
    } = body;

    // ✅ Validate required fields as per your form and schema
    if (!assigneeName || !projectId || !project) {
      console.error("❌ Missing required fields:", { assigneeName, projectId, project });
      return NextResponse.json(
        { success: false, error: "Missing required fields: Assignee, Project ID, and Project Name." },
        { status: 400 }
      );
    }
    
    // Convert completion to a number, defaulting to 0 if null, undefined, or empty string
    const completionValue = completion !== "" && completion !== undefined ? Number(completion) : 0;

    // ✅ Create and save new task with structured data
    const newTask = new Task({
      assigneeName,
      projectId,
      project,
      startDate,
      endDate,
      dueDate,
      completion: completionValue, 
      status: status || "In Progress",
      remarks,
    });

    const savedTask = await newTask.save();
    console.log("✅ Task saved successfully:", savedTask);

    return NextResponse.json(
      { success: true, message: "Task added successfully!", task: savedTask },
      { status: 201 }
    );

  } catch (error: any) {
    // Handle Mongoose duplicate key error (E11000) for projectId
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, error: "Project ID must be unique. A task with this ID already exists." },
        { status: 409 }
      );
    }

    console.error("🔥 POST Error (Create Task):", error.message);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to add task" },
      { status: 500 }
    );
  }
}