import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Task from "@/models/Task";

// 🧩 Helper: Normalize and process subtasks
const processSubtasks = (subtasks: any[]) => {
  return subtasks.map((st: any) => ({
    title: st.title?.trim() || "",
    status: st.status || "Pending",
    completion: Number(st.completion) || 0,
    remarks: st.remarks?.trim() || "",
    startDate: st.startDate ?? "",
    dueDate: st.dueDate ?? "",
    endDate: st.endDate ?? "",
    timeSpent: st.timeSpent ?? "",
  }));
};

interface RouteParams {
  params: {
    taskId: string;
  };
}

/* -------------------------------------------------------------------------- */
/* 🟢 GET → Fetch tasks for an employee or a single task by ID */
/* -------------------------------------------------------------------------- */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    await connectDB();

    const taskIdOrEmpId = params.taskId?.trim();

    if (!taskIdOrEmpId) {
      return NextResponse.json({ message: "Task ID or Employee ID is required" }, { status: 400 });
    }

    // Try to fetch by ObjectId (if valid)
    const isObjectId = /^[a-fA-F0-9]{24}$/.test(taskIdOrEmpId);

    let result;
    if (isObjectId) {
      result = await Task.findById(taskIdOrEmpId);
      if (!result) {
        return NextResponse.json({ message: "Task not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, task: result }, { status: 200 });
    }

    // Else fetch all tasks for the given employee ID
    const tasks = await Task.find({ empId: { $regex: `^${taskIdOrEmpId}$`, $options: "i" } }).lean();
    if (!tasks.length) {
      return NextResponse.json({ message: "No tasks found for this employee" }, { status: 404 });
    }

    return NextResponse.json({ success: true, tasks }, { status: 200 });
  } catch (err) {
    console.error("GET Error:", err);
    return NextResponse.json({ message: "Failed to fetch task(s)" }, { status: 500 });
  }
}

/* -------------------------------------------------------------------------- */
/* 🟡 PUT → Update a single task (includes subtasks and time fields) */
/* -------------------------------------------------------------------------- */
export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    await connectDB();

    const taskId = params.taskId?.trim();
    const body = await req.json();

    if (!taskId) {
      return NextResponse.json({ success: false, message: "Task ID is required for update" }, { status: 400 });
    }

    const {
      date,
      empId,
      project,
      name,
      plan,
      done,
      completion,
      status,
      remarks,
      startDate,
      dueDate,
      endDate,
      timeSpent,
      subtasks,
    } = body;

    const updateData: any = {
      date,
      empId,
      project,
      name,
      plan,
      done,
      completion: Number(completion),
      status,
      remarks,
      startDate,
      dueDate,
      endDate,
      timeSpent,
    };

    if (Array.isArray(subtasks)) {
      updateData.subtasks = processSubtasks(subtasks);
    }

    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedTask) {
      return NextResponse.json({ success: false, message: "Task not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, task: updatedTask }, { status: 200 });
  } catch (err) {
    console.error("PUT Error:", err);
    return NextResponse.json({ success: false, error: "Failed to update task" }, { status: 500 });
  }
}

/* -------------------------------------------------------------------------- */
/* 🔴 DELETE → Remove a task by ID */
/* -------------------------------------------------------------------------- */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    await connectDB();

    const taskId = params.taskId?.trim();

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