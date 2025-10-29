import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Task from "@/models/Task";

export async function POST(req: Request) {
  await connectDB();

  try {
    const body = await req.json();

    // Destructure and validate required fields
    const { date, empId, project, name, plan, done, completion, status, remarks } = body;

    if (!empId || !date || !project || !name || !plan || !done || !completion || !status) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create new task
    const newTask = new Task({
      empId,
      date,
      project,
      name,
      plan,
      done,
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