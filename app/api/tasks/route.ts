// File: app/api/tasks/route.ts

import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Task from "@/models/Task";

// GET → Fetch all tasks for an employee using a query parameter: /api/tasks?empId={id}
export async function GET(req: NextRequest) {
  try {
    // Assume connectDB is defined in "@/lib/mongodb"
    await connectDB(); 
    
    // Read the empId from the URL Search Params (Query)
    const searchParams = req.nextUrl.searchParams;
    const empId = searchParams.get('empId');

    if (!empId) {
      return NextResponse.json({ message: "Employee ID is required" }, { status: 400 });
    }

    console.log("Fetching tasks for empId:", empId);

    // Case-insensitive search on the 'empId' field
    const tasks = await Task.find({ empId: { $regex: `^${empId}$`, $options: "i" } }).lean();

    // Always return a 200 OK status, even if the array of tasks is empty.
    return NextResponse.json({ tasks: tasks || [] }, { status: 200 }); 
    
  } catch (err) {
    console.error("GET Error:", err);
    return NextResponse.json({ message: "Failed to fetch tasks" }, { status: 500 });
  }
}

// NOTE: Add POST function here if needed for creating new tasks.