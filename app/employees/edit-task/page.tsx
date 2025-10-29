"use client";

import React, { useState, useEffect } from "react";
import { Search, Edit2, Save, X, CheckCircle, Plus, ChevronDown, ChevronRight, CalendarDays, Clock } from "lucide-react"; 

// --- INTERFACES ---
interface Subtask {
  title: string;
  status: string;
  completion: number;
  remarks?: string;
  // --- NEW SUBTASK FIELDS ADDED ---
  startDate?: string;
  dueDate?: string;
  endDate?: string;
  timeSpent?: string;
}

interface Task {
  _id: string;
  date: string;
  empId: string;
  project: string;
  name: string;
  plan: string;
  done: string;
  completion: string;
  status: string;
  remarks?: string;
  subtasks?: Subtask[];
  // --- TASK FIELDS ---
  startDate?: string;
  dueDate?: string;
  endDate?: string;
  timeSpent?: string;
}

// --- TOAST COMPONENT (Unchanged) ---
interface ToastProps {
  message: string;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className="fixed bottom-5 right-5 z-50 p-4 bg-green-600 text-white rounded-lg shadow-xl flex items-center gap-3 transition-transform duration-300 transform animate-toast-in"
      style={{ animation: "toast-in 0.3s forwards" }}
    >
      <CheckCircle className="w-5 h-5" />
      <span className="font-medium">{message}</span>
      <button
        onClick={onClose}
        className="ml-4 p-1 rounded-full hover:bg-green-700 transition"
      >
        <X className="w-4 h-4" />
      </button>
      <style jsx global>{`
        @keyframes toast-in {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
};

// --- MAIN COMPONENT ---
const ViewTaskPage: React.FC = () => {
  const [empId, setEmpId] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [successToast, setSuccessToast] = useState("");
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

  // --- TOGGLE SUBTASKS (Unchanged) ---
  const toggleSubtasks = (taskId: string) => {
    setExpandedTasks((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  // --- FETCH TASKS (Unchanged) ---
  const handleFetch = async () => {
    if (!empId) {
      setMessage("Please enter Employee ID");
      setTasks([]);
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(`/api/tasks/getByEmpId?empId=${empId}`);
      const data = await res.json();

      if (res.ok) {
        setTasks(data.tasks);
        setMessage(data.tasks.length === 0 ? "No tasks found for this employee." : "");
      } else {
        setTasks([]);
        setMessage(data.error || "Failed to fetch tasks");
      }
    } catch (error) {
      console.error(error);
      setMessage("Server error");
    } finally {
      setLoading(false);
    }
  };

  // --- EDIT HANDLERS ---
  const handleEdit = (task: Task) => {
    setEditingTask(task);
  };

  const handleEditChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setEditingTask((prev) => (prev ? { ...prev, [name]: value } : null));
  };

  const handleAddSubtask = () => {
    if (!editingTask) return;
    const updatedSubtasks = [
      ...(editingTask.subtasks || []),
      // Initializing new subtask with new fields
      { title: "", status: "Pending", completion: 0, remarks: "", startDate: "", dueDate: "", endDate: "", timeSpent: "" },
    ];
    setEditingTask({ ...editingTask, subtasks: updatedSubtasks });
  };

  const handleSubtaskChange = (index: number, field: string, value: string | number) => {
    if (!editingTask || !editingTask.subtasks) return;
    const updatedSubtasks = [...editingTask.subtasks];
    updatedSubtasks[index] = { ...updatedSubtasks[index], [field]: value };
    setEditingTask({ ...editingTask, subtasks: updatedSubtasks });
  };

  const handleDeleteSubtask = (index: number) => {
    if (!editingTask || !editingTask.subtasks) return;
    const updatedSubtasks = editingTask.subtasks.filter((_, i) => i !== index);
    setEditingTask({ ...editingTask, subtasks: updatedSubtasks });
  };

  // --- CRITICAL CHANGE HERE ---
  const handleSave = async () => {
    if (!editingTask) return;
    setLoading(true);
    setMessage("");
    setSuccessToast("");

    if (!editingTask.project || !editingTask.plan || !editingTask.done) {
      setMessage("Project, Plan, and Done fields cannot be empty.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/tasks/update/${editingTask._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingTask),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setEditingTask(null);
        setSuccessToast("Task updated successfully! Refreshing data...");
        
        // CRITICAL FIX: Force re-fetch of all tasks to get fresh data
        await handleFetch(); 

      } else {
        setMessage(data.message || "Failed to update task.");
      }
    } catch (error) {
      console.error(error);
      setMessage("Server error during update.");
    } finally {
      if (!successToast) {
         setLoading(false);
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingTask(null);
    setMessage("");
  };

  // --- TASK RENDERERS (Updated colSpan to 16) ---
  const RenderTaskRow = (task: Task, idx: number) => {
    const isExpanded = expandedTasks.has(task._id);
    const hasSubtasks = task.subtasks && task.subtasks.length > 0;

    // We need 16 columns for the main task row
    const mainColSpan = 16; 

    // We need 9 columns for the subtask table header
    const subtaskHeaderColSpan = 9; 
    
    return (
      <React.Fragment key={task._id}>
        <tr
          className={`border-b border-gray-200 hover:bg-gray-50 transition ${
            idx % 2 === 0 ? "bg-white" : "bg-gray-50"
          }`}
        >
          <td className="px-6 py-4">
            {hasSubtasks && (
              <button
                onClick={() => toggleSubtasks(task._id)}
                className="text-gray-600 hover:text-gray-900 transition p-1"
                title={isExpanded ? "Collapse subtasks" : "Expand subtasks"}
              >
                {isExpanded ? (
                  <ChevronDown className="w-5 h-5" />
                ) : (
                  <ChevronRight className="w-5 h-5" />
                )}
              </button>
            )}
          </td>
          <td className="px-6 py-4 text-sm text-gray-700">{task.date.split("T")[0]}</td>
          <td className="px-6 py-4 text-sm text-black font-medium">{task.empId}</td>
          <td className="px-6 py-4 text-sm text-gray-600">{task.project}</td>
          <td className="px-6 py-4 text-sm text-gray-600">{task.name}</td>
          <td className="px-6 py-4 text-sm text-gray-600">{task.plan}</td>
          <td className="px-6 py-4 text-sm text-gray-600">{task.done}</td>
          <td className="px-6 py-4 text-sm text-center text-black font-semibold">
            {task.completion}
          </td>
          <td className="px-6 py-4 text-sm">
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                task.status === "Completed"
                  ? "bg-green-100 text-green-700"
                  : task.status === "In Progress"
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {task.status}
            </span>
          </td>
          <td className="px-6 py-4 text-sm text-gray-500">{task.remarks || "-"}</td>
          
          {/* --- MAIN TASK DISPLAY FIELDS --- */}
          <td className="px-6 py-4 text-sm text-gray-600">{task.startDate ? task.startDate.split("T")[0] : "-"}</td>
          <td className="px-6 py-4 text-sm text-gray-600">{task.dueDate ? task.dueDate.split("T")[0] : "-"}</td>
          <td className="px-6 py-4 text-sm text-gray-600">{task.endDate ? task.endDate.split("T")[0] : "-"}</td>
          <td className="px-6 py-4 text-sm text-gray-600">{task.timeSpent || "-"}</td>
          
          <td className="px-6 py-4 text-sm font-semibold text-blue-700">Task</td>
          <td className="px-6 py-4 text-center">
            <button
              onClick={() => handleEdit(task)}
              className="text-blue-600 hover:text-blue-800 transition duration-150 p-2 rounded-full hover:bg-blue-100"
              title="Edit Task"
              disabled={loading}
            >
              <Edit2 className="w-4 h-4" />
            </button>
          </td>
        </tr>

        {/* --- SUBTASK DISPLAY --- */}
        {hasSubtasks && isExpanded && (
          <tr className="bg-blue-50">
            <td colSpan={mainColSpan} className="px-6 py-4"> 
              <div className="ml-12">
                <h4 className="font-semibold text-gray-800 mb-3 text-sm flex items-center gap-2">
                  <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs">
                    {task.subtasks!.length}
                  </span>
                  Subtasks
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full border border-gray-300 rounded-lg">
                    <thead>
                      <tr className="bg-gray-100 border-b border-gray-300">
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-300">Title</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-300">Status</th>
                        <th className="px-4 py-2 text-center text-xs font-semibold text-gray-700 border-r border-gray-300">Completion</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-300">Remarks</th>
                        {/* --- NEW SUBTASK HEADERS --- */}
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-300"><CalendarDays className="inline w-3 h-3 mr-1"/>Start</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-300"><CalendarDays className="inline w-3 h-3 mr-1"/>Due</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-300"><CalendarDays className="inline w-3 h-3 mr-1"/>End</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-300"><Clock className="inline w-3 h-3 mr-1"/>Time</th>
                        {/* --------------------------- */}
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Type</th>
                      </tr>
                    </thead>
                    <tbody>
                      {task.subtasks!.map((st, i) => (
                        <tr key={i} className={`${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'} border-b border-gray-200 last:border-b-0`}>
                          <td className="px-4 py-2 text-sm text-gray-800 border-r border-gray-300">{st.title || "(No title)"}</td>
                          <td className="px-4 py-2 text-sm border-r border-gray-300">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                st.status === "Completed"
                                  ? "bg-green-100 text-green-700"
                                  : st.status === "In Progress"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {st.status}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-sm text-center font-medium text-gray-800 border-r border-gray-300">{st.completion}%</td>
                          <td className="px-4 py-2 text-sm text-gray-600 border-r border-gray-300">{st.remarks || "-"}</td>
                          {/* --- NEW SUBTASK DATA CELLS --- */}
                          <td className="px-4 py-2 text-sm text-gray-600 border-r border-gray-300">{st.startDate ? st.startDate.split("T")[0] : "-"}</td>
                          <td className="px-4 py-2 text-sm text-gray-600 border-r border-gray-300">{st.dueDate ? st.dueDate.split("T")[0] : "-"}</td>
                          <td className="px-4 py-2 text-sm text-gray-600 border-r border-gray-300">{st.endDate ? st.endDate.split("T")[0] : "-"}</td>
                          <td className="px-4 py-2 text-sm text-gray-600 border-r border-gray-300">{st.timeSpent || "-"}</td>
                          {/* ------------------------------ */}
                          <td className="px-4 py-2 text-sm font-semibold text-purple-700">Subtask</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </td>
          </tr>
        )}
      </React.Fragment>
    );
  };

  // --- EDIT MODE (Updated subtask section for new fields) ---
  const RenderEditRow = (task: Task) => (
    <>
      <tr key={task._id} className="bg-blue-50 border-b border-blue-200">
        <td className="px-3 py-3"></td>
        <td className="px-3 py-3 text-sm text-gray-700">{task.date.split("T")[0]}</td>
        <td className="px-3 py-3 text-sm text-gray-500">{task.empId}</td>
        <td className="px-3 py-2">
          <input
            name="project"
            value={task.project}
            onChange={handleEditChange}
            className="w-full px-2 py-1 border rounded text-sm text-gray-900"
          />
        </td>
        <td className="px-3 py-2 text-sm text-gray-600">{task.name}</td>
        <td className="px-3 py-2">
          <textarea
            name="plan"
            value={task.plan}
            onChange={handleEditChange}
            rows={1}
            className="w-full px-2 py-1 border rounded text-sm resize-none text-gray-900"
          />
        </td>
        <td className="px-3 py-2">
          <textarea
            name="done"
            value={task.done}
            onChange={handleEditChange}
            rows={1}
            className="w-full px-2 py-1 border rounded text-sm resize-none text-gray-900"
          />
        </td>
        <td className="px-3 py-2">
          <input
            name="completion"
            type="number"
            min="0"
            max="100"
            value={task.completion}
            onChange={handleEditChange}
            className="w-16 px-2 py-1 border rounded text-sm text-center text-gray-900"
          />
        </td>
        <td className="px-3 py-2">
          <select
            name="status"
            value={task.status}
            onChange={handleEditChange}
            className="w-full px-2 py-1 border rounded text-sm bg-white text-gray-900"
          >
            <option value="Completed">Completed</option>
            <option value="In Progress">In Progress</option>
            <option value="Pending">Pending</option>
          </select>
        </td>
        <td className="px-3 py-2">
          <input
            name="remarks"
            value={task.remarks || ""}
            onChange={handleEditChange}
            className="w-full px-2 py-1 border rounded text-sm text-gray-900"
          />
        </td>
        
        {/* --- MAIN TASK EDIT FIELDS --- */}
        <td className="px-3 py-2">
          <input
            name="startDate"
            type="date"
            value={task.startDate ? task.startDate.split("T")[0] : ""} 
            onChange={handleEditChange}
            className="w-full px-2 py-1 border rounded text-sm text-gray-900"
          />
        </td>
        <td className="px-3 py-2">
          <input
            name="dueDate"
            type="date"
            value={task.dueDate ? task.dueDate.split("T")[0] : ""}
            onChange={handleEditChange}
            className="w-full px-2 py-1 border rounded text-sm text-gray-900"
          />
        </td>
        <td className="px-3 py-2">
          <input
            name="endDate"
            type="date"
            value={task.endDate ? task.endDate.split("T")[0] : ""}
            onChange={handleEditChange}
            className="w-full px-2 py-1 border rounded text-sm text-gray-900"
          />
        </td>
        <td className="px-3 py-2">
          <input
            name="timeSpent"
            type="text"
            placeholder="e.g., 8h 30m"
            value={task.timeSpent || ""}
            onChange={handleEditChange}
            className="w-full px-2 py-1 border rounded text-sm text-gray-900"
          />
        </td>
        
        <td className="px-3 py-3 text-sm font-semibold text-blue-700">Task</td>
        <td className="px-6 py-4 flex flex-col gap-1 items-center justify-center h-full">
          <button
            onClick={handleSave}
            className="text-green-600 hover:text-green-800 p-2 rounded-full hover:bg-green-100 transition duration-150"
            title="Save Changes"
            disabled={loading}
          >
            <Save className="w-4 h-4" />
          </button>
          <button
            onClick={handleCancelEdit}
            className="text-red-600 hover:text-red-800 p-2 rounded-full hover:bg-red-100 transition duration-150"
            title="Cancel Edit"
            disabled={loading}
          >
            <X className="w-4 h-4" />
          </button>
        </td>
      </tr>

      {/* --- SUBTASK EDIT --- */}
      <tr>
        <td colSpan={16} className="px-4 py-4 bg-gray-50 border-t border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-800">Subtasks</h3>
            <button
              onClick={handleAddSubtask}
              className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
              disabled={loading}
            >
              <Plus className="w-4 h-4" /> Add Subtask
            </button>
          </div>

          {(!task.subtasks || task.subtasks.length === 0) && (
            <p className="text-gray-500 text-sm italic">No subtasks yet.</p>
          )}

          <div className="space-y-2 mt-2">
            {task.subtasks?.map((subtask, index) => (
              <div
                key={index}
                // Updated to handle 4 extra fields: title, status, completion, remarks, start, due, end, timeSpent, delete button (9 items)
                className="flex items-center gap-3 bg-white border rounded-lg px-3 py-2 text-xs" 
              >
                <input
                  type="text"
                  placeholder="Title"
                  value={subtask.title}
                  onChange={(e) => handleSubtaskChange(index, "title", e.target.value)}
                  className="w-32 border border-gray-300 rounded px-2 py-1 text-gray-800"
                />
                <select
                  value={subtask.status}
                  onChange={(e) => handleSubtaskChange(index, "status", e.target.value)}
                  className="w-24 border border-gray-300 rounded px-2 py-1"
                >
                  <option value="Completed">Completed</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Pending">Pending</option>
                </select>
                <input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="%"
                  value={subtask.completion}
                  onChange={(e) =>
                    handleSubtaskChange(index, "completion", Number(e.target.value))
                  }
                  className="w-12 border border-gray-300 rounded px-2 py-1 text-center"
                />
                <input
                  type="text"
                  placeholder="Remarks"
                  value={subtask.remarks || ""}
                  onChange={(e) => handleSubtaskChange(index, "remarks", e.target.value)}
                  className="flex-1 border border-gray-300 rounded px-2 py-1 text-gray-800"
                />
                
                {/* --- NEW SUBTASK EDIT INPUTS --- */}
                <input
                  type="date"
                  placeholder="Start"
                  value={subtask.startDate ? subtask.startDate.split("T")[0] : ""}
                  onChange={(e) => handleSubtaskChange(index, "startDate", e.target.value)}
                  className="w-28 border border-gray-300 rounded px-2 py-1"
                />
                <input
                  type="date"
                  placeholder="Due"
                  value={subtask.dueDate ? subtask.dueDate.split("T")[0] : ""}
                  onChange={(e) => handleSubtaskChange(index, "dueDate", e.target.value)}
                  className="w-28 border border-gray-300 rounded px-2 py-1"
                />
                <input
                  type="date"
                  placeholder="End"
                  value={subtask.endDate ? subtask.endDate.split("T")[0] : ""}
                  onChange={(e) => handleSubtaskChange(index, "endDate", e.target.value)}
                  className="w-28 border border-gray-300 rounded px-2 py-1"
                />
                <input
                  type="text"
                  placeholder="Time"
                  value={subtask.timeSpent || ""}
                  onChange={(e) => handleSubtaskChange(index, "timeSpent", e.target.value)}
                  className="w-20 border border-gray-300 rounded px-2 py-1"
                />
                {/* ------------------------------- */}

                <button
                  onClick={() => handleDeleteSubtask(index)}
                  className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-100 transition"
                  title="Delete Subtask"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </td>
      </tr>
    </>
  );

  return (
    <div className="min-h-screen">
      <div className="w-full">
        <div className="max-w-7xl mx-auto mt-[15%] px-6 py-8">
          <h1 className="text-4xl font-bold text-white mb-10">Employee Tasks</h1>

          {/* Filters */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
            <div className="flex gap-4 items-end max-w-lg mx-auto md:max-w-none">
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Search className="inline w-4 h-4 mr-2" /> Employee ID
                </label>
                <input
                  type="text"
                  placeholder="Enter Employee ID"
                  value={empId}
                  onChange={(e) => setEmpId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
                  onKeyDown={(e) => e.key === "Enter" && handleFetch()}
                />
              </div>
              <button
                onClick={handleFetch}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-lg transition duration-200 shadow-md h-[42px]"
                style={{ whiteSpace: "nowrap" }}
                disabled={loading}
              >
                {loading ? "Loading..." : "Fetch Tasks"}
              </button>
            </div>
          </div>

          {/* Message */}
          {message && (
            <div
              className={`bg-white border ${
                message.includes("success")
                  ? "border-green-300 text-green-800"
                  : "border-red-500 text-red-700"
              } px-4 py-3 rounded-lg mb-6 font-medium`}
            >
              {message}
            </div>
          )}

          {/* Table */}
          {tasks.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-100 border-b border-gray-200">
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800 w-12"></th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">Date</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">Emp ID</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">Project</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">Name</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">Plan</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">Done</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-800">%</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">Status</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">Remarks</th>
                      {/* --- MAIN TASK HEADERS --- */}
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800" style={{minWidth: '100px'}}><CalendarDays className="inline w-4 h-4 mr-1"/>Start Date</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800" style={{minWidth: '100px'}}><CalendarDays className="inline w-4 h-4 mr-1"/>Due Date</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800" style={{minWidth: '100px'}}><CalendarDays className="inline w-4 h-4 mr-1"/>End Date</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800" style={{minWidth: '100px'}}><Clock className="inline w-4 h-4 mr-1"/>Time Spent</th>
                      {/* -------------------- */}
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">Type</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-800">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map((task, idx) =>
                      editingTask?._id === task._id
                        ? RenderEditRow(editingTask)
                        : RenderTaskRow(task, idx)
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {successToast && (
        <Toast message={successToast} onClose={() => setSuccessToast("")} />
      )}
    </div>
  );
};

export default ViewTaskPage;