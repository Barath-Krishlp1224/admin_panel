import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Task from "@/models/Task";

export async function PUT(
  req: NextRequest,
  { params }: { params: { taskId: string } }
) {
  await connectDB();

  try {
    const taskId = params.taskId?.trim();
    const body = await req.json();

    console.log("🟣 Updating task:", taskId);
    console.log("🟡 Received data:", body);

    if (!taskId) {
      return NextResponse.json(
        { success: false, error: "Missing task ID" },
        { status: 400 }
      );
    }

    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      { $set: body },
      { new: true, runValidators: true }
    );

    if (!updatedTask) {
      return NextResponse.json(
        { success: false, error: "Task not found" },
        { status: 404 }
      );
    }

    console.log("✅ Task updated successfully:", updatedTask);
    return NextResponse.json({ success: true, task: updatedTask });
  } catch (error: any) {
    console.error("❌ PUT error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update task" },
      { status: 500 }
    );
  }
}