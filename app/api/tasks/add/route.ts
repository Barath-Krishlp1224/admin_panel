// /api/tasks/add
import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Task from "@/models/Task";

export async function POST(req: Request) {
  await connectDB();

  try {
    const body = await req.json();

    // Destructure the fields to match the frontend's formData.
    // NOTE: 'name' is removed from destructuring.
    const {
      startDate,
      endDate,
      dueDate,
      empId, // REQUIRED field based on the latest frontend
      project,
      completion,
      status,
      remarks,
    } = body; 

    // ✅ Validate REQUIRED field: empId is the ONLY mandatory field now.
    if (!empId) {
      return NextResponse.json(
        { error: "Missing required field: empId" },
        { status: 400 }
      );
    }

    // Create new task with the updated fields
    const newTask = new Task({
      empId,
      startDate, 
      endDate,   
      dueDate,   
      project,
      // ❌ Removed 'name' field
      completion,
      status,
      remarks,
    });

    const savedTask = await newTask.save();

    return NextResponse.json(
      { message: "Task added successfully", task: savedTask },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error adding task:", error);
    return NextResponse.json(
      { error: "Failed to add task" },
      { status: 500 }
    );
  }
}