import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Task from "@/models/Task";

export async function POST(req: Request) {
  await connectDB();

  try {
    const body = await req.json();

    console.log("🟡 Incoming Task Data:", body);

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

    // ✅ Validate required fields
    if (!assigneeName || !projectId || !project) {
      console.error("❌ Missing required fields:", { assigneeName, projectId, project });
      return NextResponse.json(
        { error: "Missing required fields: assigneeName, projectId, project" },
        { status: 400 }
      );
    }
    
    // Parse completion to a number, defaulting to 0 if not provided or empty string
    const completionValue = completion !== "" && completion !== undefined ? Number(completion) : 0;
    
    // ✅ Create and save new task
    const newTask = new Task({
      assigneeName,
      projectId,
      project,
      startDate,
      endDate,
      dueDate,
      completion: completionValue, // Use the parsed value
      status: status || "In Progress",
      remarks,
    });

    const savedTask = await newTask.save();
    console.log("✅ Task saved successfully:", savedTask);

    return NextResponse.json(
      { success: true, message: "Task added successfully", task: savedTask },
      { status: 201 }
    );
  } catch (error: any) {
    // Handle potential Mongoose errors, like duplicate projectId
    let errorMessage = error.message || "Failed to add task";
    if (error.code === 11000) {
      errorMessage = "Project ID must be unique. A task with this ID already exists.";
    }
    
    console.error("🔥 Error adding task:", errorMessage);
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}