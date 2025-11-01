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

    // ✅ Create and save new task
    const newTask = new Task({
      assigneeName,
      projectId,
      project,
      startDate,
      endDate,
      dueDate,
      completion: completion ? Number(completion) : 0,
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
    console.error("🔥 Error adding task:", error.message || error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to add task" },
      { status: 500 }
    );
  }
}