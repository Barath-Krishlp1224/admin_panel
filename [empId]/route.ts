import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Task from "@/models/Task";

// Helper function to process subtasks, ensuring new fields are included
const processSubtasks = (subtasks: any[]) => {
  return subtasks.map((st: any) => ({
    title: st.title?.trim() || "",
    status: st.status || "Pending",
    completion: Number(st.completion) || 0,
    remarks: st.remarks?.trim() || "",
    // 🆕 Include new subtask fields
    startDate: st.startDate ?? "", 
    dueDate: st.dueDate ?? "",
    endDate: st.endDate ?? "",
    timeSpent: st.timeSpent ?? "",
  }));
};


// GET → Fetch all tasks for an employee
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const url = new URL(req.url);
    // Assuming the URL structure is /api/tasks/getByEmpId/[empId]
    // This logic relies on the last URL segment being the empId
    const empId = url.pathname.split('/').pop()?.trim();

    if (!empId) {
      return NextResponse.json({ message: "Employee ID is required" }, { status: 400 });
    }

    console.log("Fetching tasks for empId:", empId);

    // Case-insensitive search
    const tasks = await Task.find({ empId: { $regex: `^${empId}$`, $options: "i" } }).lean();

    console.log("Tasks found:", tasks.length);

    if (!tasks || tasks.length === 0) {
      return NextResponse.json({ message: "No tasks found" }, { status: 404 });
    }

    return NextResponse.json({ tasks }, { status: 200 });
  } catch (err) {
    console.error("GET Error:", err);
    return NextResponse.json({ message: "Failed to fetch tasks" }, { status: 500 });
  }
}

// --- PUT FUNCTION (UPDATED) ---
export async function PUT(req: NextRequest) {
  try {
    await connectDB();

    const url = new URL(req.url);
    const taskId = url.pathname.split('/').pop()?.trim();
    const body = await req.json();

    if (!taskId) {
      return NextResponse.json({ success: false, message: "Task ID is required for update" }, { status: 400 });
    }

    console.log("Updating task with _id:", taskId);
    // console.log("Received data:", body); // Uncomment for debugging

    // Destructure all fields, including the new ones
    const { 
      date, empId, project, name, plan, done, completion, status, remarks, 
      startDate, dueDate, endDate, timeSpent, subtasks 
    } = body;

    // Build the update object, ensuring types are correct (especially completion)
    const updateData: any = {
      date, empId, project, name, plan, done, 
      completion: Number(completion), 
      status, remarks,
      // Task-level new fields
      startDate, dueDate, endDate, timeSpent,
    };

    // Process subtasks if they exist in the payload
    if (Array.isArray(subtasks)) {
        updateData.subtasks = processSubtasks(subtasks);
    }
    
    // Use $set to explicitly update fields. { new: true } returns the updated document.
    const updatedTask = await Task.findByIdAndUpdate(taskId, { $set: updateData }, { new: true, runValidators: true });

    if (!updatedTask) {
      return NextResponse.json({ success: false, message: "Task not found" }, { status: 404 });
    }
    
    // Return the updated task object (crucial for frontend refresh)
    return NextResponse.json({ success: true, task: updatedTask }, { status: 200 });
    
  } catch (err) {
    console.error("PUT Error:", err);
    return NextResponse.json({ success: false, error: "Failed to update task" }, { status: 500 });
  }
}


// DELETE → Delete a task by its _id
export async function DELETE(req: NextRequest) {
  try {
    await connectDB();

    const url = new URL(req.url);
    const taskId = url.pathname.split('/').pop()?.trim();

    if (!taskId) {
      return NextResponse.json({ success: false, message: "Task ID is required for deletion" }, { status: 400 });
    }

    const result = await Task.findByIdAndDelete(taskId);

    if (!result) {
      return NextResponse.json({ success: false, message: "Task not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Task deleted successfully" }, { status: 200 });
  } catch (err) {
    console.error("DELETE Error:", err);
    return NextResponse.json({ success: false, message: "Failed to delete task" }, { status: 500 });
  }
}