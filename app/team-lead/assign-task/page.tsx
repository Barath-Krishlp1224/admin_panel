"use client";

import React, { useState, useEffect } from "react";

/* ----------------------------- Interfaces ----------------------------- */
interface Subtask {
  title: string;
  status: string;
  completion: number;
  remarks?: string;
}

interface Task {
  _id: string;
  projectId: string;
  project: string;
  assigneeName: string;
  startDate: string;
  endDate?: string;
  dueDate: string;
  completion: number;
  status: string;
  remarks?: string;
  subtasks?: Subtask[];
}

/* ----------------------------- Component ----------------------------- */
const TasksPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editRowId, setEditRowId] = useState<string | null>(null);
  const [draftTask, setDraftTask] = useState<Partial<Task>>({});
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  
  // 🆕 New State: To track which task IDs have their subtasks expanded (visible)
  const [expandedTasks, setExpandedTasks] = useState<string[]>([]); 

  // 🔹 Fetch tasks
  const fetchTasks = async () => {
    setLoading(true);
    setError("");
    try {
      // NOTE: Replace '/api/tasks' with your actual API endpoint if different.
      const res = await fetch("/api/tasks"); 
      const data = await res.json();
      if (res.ok && data.success) setTasks(data.tasks);
      else setError(data.error || "Failed to fetch tasks.");
    } catch (err) {
      console.error("Error fetching tasks:", err);
      setError("Server connection error while fetching tasks.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  /* --------------------------- UTILITY HANDLERS --------------------------- */

  // 🆕 Handler to toggle subtask visibility
  const toggleSubtasks = (taskId: string) => {
    setExpandedTasks(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId) 
        : [...prev, taskId]
    );
  };

  /* --------------------------- DELETE TASK --------------------------- */
  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        alert("✅ Task deleted successfully!");
        fetchTasks();
      } else alert(data.error || "Failed to delete task.");
    } catch (err) {
      console.error("Delete error:", err);
      alert("Server error during deletion.");
    }
  };

  /* ---------------------------- EDIT TASK ---------------------------- */
  const handleEdit = (task: Task) => {
    setEditRowId(task._id);
    setDraftTask(task);
    setSubtasks(task.subtasks || []);
  };

  const handleDraftChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setDraftTask((prev) => ({
      ...prev,
      [name]: name === "completion" ? Number(value) : value,
    }));
  };

  /* ---------------------------- SUBTASK HANDLERS ---------------------------- */
  const handleSubtaskChange = (index: number, field: keyof Subtask, value: string | number) => {
    const updated = [...subtasks];
    (updated[index] as any)[field] = value; 
    setSubtasks(updated);
  };

  const addSubtask = () => {
    setSubtasks([
      ...subtasks,
      { title: "", status: "Pending", completion: 0, remarks: "" },
    ]);
  };

  const removeSubtask = (index: number) => {
    setSubtasks(subtasks.filter((_, i) => i !== index));
  };

  /* ---------------------------- UPDATE ---------------------------- */
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editRowId) return;
    const updatedTask = { ...draftTask, subtasks };

    try {
      const res = await fetch(`/api/tasks/${editRowId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedTask),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        alert("✅ Task updated successfully!");
        setEditRowId(null);
        setDraftTask({});
        setSubtasks([]);
        fetchTasks();
      } else {
        alert(`❌ Failed to update task: ${data.error || "Unknown error"}`);
      }
    } catch (err) {
      console.error("Update error:", err);
      alert("A server error occurred during update.");
    }
  };

  const cancelEdit = () => {
    setEditRowId(null);
    setDraftTask({});
    setSubtasks([]);
  };

  const getStatusBadge = (status: string, isSubtask: boolean = false) => {
    let color = isSubtask ? "bg-gray-200 text-gray-800" : "bg-gray-100 text-gray-800";
    if (status === "Completed") color = isSubtask ? "bg-green-200 text-green-900" : "bg-green-100 text-green-800";
    else if (status === "In Progress") color = isSubtask ? "bg-blue-200 text-blue-900" : "bg-blue-100 text-blue-800";
    else if (status === "On Hold" || status === "Paused" || status === "Pending") color = isSubtask ? "bg-yellow-200 text-yellow-900" : "bg-yellow-100 text-yellow-800";
    return `px-2 py-1 text-xs font-medium rounded-full ${color}`;
  };

  /* ---------------------------- RENDER ---------------------------- */
  if (loading)
    return <div className="flex justify-center items-center min-h-screen"><p>Loading tasks...</p></div>;

  if (error)
    return <div className="text-center p-10 text-red-600">{error}</div>;
  
  // 🌟 Determine if the task has subtasks to show the chevron
  const hasSubtasks = (task: Task) => task.subtasks && task.subtasks.length > 0;

  return (
    <div className="min-h-screen mt-[10%] p-8">
      <h1 className="text-3xl font-bold text-white mb-6">
        Project Task List ({tasks.length})
      </h1>

      <div className="shadow overflow-x-auto border-b border-gray-200 sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-200 table-fixed">
          <thead className="bg-gray-100">
            <tr>
              {/* 🆕 Added Type column */}
              {["", "ID", "Type", "Project", "Assignee", "Start", "End", "Due", "Completion", "Status", "Remarks", "Actions"].map(
                (h) => (
                  <th key={h} className="px-3 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-200">
            {tasks.map((task) => {
              const isEditing = task._id === editRowId;
              const isExpanded = expandedTasks.includes(task._id);
              const current = isEditing ? draftTask : task;

              return (
                <React.Fragment key={task._id}>
                  {/* MAIN TASK ROW */}
                  <tr className="hover:bg-gray-50">
                    {/* 🆕 Toggle Button Column */}
                    <td className="px-3 py-4 text-sm text-gray-500 w-10">
                      {hasSubtasks(task) && (
                        <button 
                          onClick={() => toggleSubtasks(task._id)}
                          className="text-gray-600 hover:text-indigo-600 transition-transform duration-200"
                        >
                          <svg 
                            className={`w-4 h-4 transform ${isExpanded ? 'rotate-90' : 'rotate-0'}`} 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24" 
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                          </svg>
                        </button>
                      )}
                    </td>
                    <td className="px-3 py-4 text-sm font-medium text-gray-900 truncate">{task.projectId}</td>
                    {/* 🆕 Task Type Cell */}
                    <td className="px-3 py-4 text-sm font-medium text-blue-600">Task</td>
                    <td className="px-3 py-4 text-sm text-gray-900">
                      {isEditing ? (
                        <input name="project" value={current.project || ""} onChange={handleDraftChange} className="border p-1 rounded w-full" />
                      ) : (
                        task.project
                      )}
                    </td>
                    <td className="px-3 py-4 text-sm text-gray-900">
                      {isEditing ? (
                        <input name="assigneeName" value={current.assigneeName || ""} onChange={handleDraftChange} className="border p-1 rounded w-full" />
                      ) : (
                        task.assigneeName
                      )}
                    </td>
                    <td className="px-3 py-4 text-sm text-gray-900">
                      {isEditing ? (
                        <input type="date" name="startDate" value={current.startDate || ""} onChange={handleDraftChange} className="border p-1 rounded w-full" />
                      ) : (
                        task.startDate
                      )}
                    </td>
                    <td className="px-3 py-4 text-sm text-gray-900">
                      {isEditing ? (
                        <input type="date" name="endDate" value={current.endDate || ""} onChange={handleDraftChange} className="border p-1 rounded w-full" />
                      ) : (
                        task.endDate || "N/A"
                      )}
                    </td>
                    <td className="px-3 py-4 text-sm text-gray-900">
                      {isEditing ? (
                        <input type="date" name="dueDate" value={current.dueDate || ""} onChange={handleDraftChange} className="border p-1 rounded w-full" />
                      ) : (
                        task.dueDate
                      )}
                    </td>
                    <td className="px-3 py-4 text-sm text-gray-900">
                      {isEditing ? (
                        <input
                          type="number"
                          name="completion"
                          value={current.completion || 0}
                          onChange={handleDraftChange}
                          min={0}
                          max={100}
                          className="border p-1 rounded w-full text-center"
                        />
                      ) : (
                        `${task.completion}%`
                      )}
                    </td>
                    <td className="px-3 py-4 text-sm text-gray-900">
                      {isEditing ? (
                        <select name="status" value={current.status || ""} onChange={handleDraftChange} className="border p-1 rounded w-full">
                          <option>In Progress</option>
                          <option>Completed</option>
                          <option>On Hold</option>
                          <option>Paused</option>
                        </select>
                      ) : (
                        <span className={getStatusBadge(task.status)}>{task.status}</span>
                      )}
                    </td>
                    <td className="px-3 py-4 text-sm text-gray-900">
                      {isEditing ? (
                        <input name="remarks" value={current.remarks || ""} onChange={handleDraftChange} className="border p-1 rounded w-full" />
                      ) : (
                        task.remarks || "-"
                      )}
                    </td>
                    <td className="px-3 py-4 text-right text-sm font-medium">
                      {isEditing ? (
                        <div className="flex justify-end gap-2">
                          <button onClick={handleUpdate} className="text-green-600">Save</button>
                          <button onClick={cancelEdit} className="text-gray-600">Cancel</button>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-2">
                          <button onClick={() => handleEdit(task)} className="text-indigo-600">Edit</button>
                          <button onClick={() => handleDelete(task._id)} className="text-red-600">Delete</button>
                        </div>
                      )}
                    </td>
                  </tr>

                  {/* SUBTASK VIEWER (Only visible if expanded and NOT editing) */}
                  {isExpanded && !isEditing && hasSubtasks(task) && (
                    <tr className="bg-gray-100">
                      {/* Note: Colspan is now 12 due to the added columns */}
                      <td colSpan={12} className="p-3">
                        <div className="ml-8 border-l-4 border-indigo-400 pl-4">
                          <h4 className="font-semibold text-gray-700 mb-2">Subtasks for {task.project}</h4>
                          <table className="w-full text-sm">
                            <tbody>
                              {task.subtasks!.map((subtask, i) => (
                                <tr key={i} className="border-b border-gray-200">
                                  {/* Empty cells for alignment */}
                                  <td className="p-1 w-10"></td>
                                  <td className="p-1 font-medium text-gray-500 w-16"></td>
                                  {/* 🆕 Subtask Type Cell */}
                                  <td className="p-1 font-medium text-purple-600">Subtask</td>
                                  <td className="p-1 text-gray-900 font-medium">{subtask.title}</td>
                                  <td className="p-1 text-gray-500"></td> {/* Assignee */}
                                  <td className="p-1 text-gray-500"></td> {/* Start Date */}
                                  <td className="p-1 text-gray-500"></td> {/* End Date */}
                                  <td className="p-1 text-gray-500"></td> {/* Due Date */}
                                  <td className="p-1 text-gray-900">{subtask.completion}%</td>
                                  <td className="p-1">
                                    <span className={getStatusBadge(subtask.status, true)}>{subtask.status}</span>
                                  </td>
                                  <td className="p-1 text-gray-500">{subtask.remarks || '-'}</td>
                                  <td className="p-1 text-gray-500"></td> {/* Actions */}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}


                  {/* Subtask editor (Only visible if editing) */}
                  {isEditing && (
                    <tr className="bg-gray-50">
                      {/* Colspan changed to 12 */}
                      <td colSpan={12} className="p-3"> 
                        <div>
                          <h4 className="font-semibold text-gray-700 mb-2">Subtasks (Edit Mode)</h4>
                          <table className="w-full border text-sm">
                            {/* Darker Heading from previous request */}
                            <thead className="bg-gray-700 text-white"> 
                              <tr>
                                <th className="border p-1 w-1/4">Title</th>
                                <th className="border p-1 w-1/6">Status</th>
                                <th className="border p-1 w-1/12">Completion</th>
                                <th className="border p-1 w-1/4">Remarks</th>
                                <th className="border p-1 w-1/6">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {subtasks.map((sub, i) => (
                                <tr key={i}>
                                  <td className="border p-1">
                                    <input
                                      value={sub.title}
                                      onChange={(e) => handleSubtaskChange(i, "title", e.target.value)}
                                      className="border p-1 rounded w-full text-black placeholder-gray-700"
                                      placeholder="Subtask Title"
                                    />
                                  </td>
                                  <td className="border p-1">
                                    <select
                                      value={sub.status}
                                      onChange={(e) => handleSubtaskChange(i, "status", e.target.value)}
                                      className="border p-1 rounded w-full text-black"
                                    >
                                      <option>Pending</option>
                                      <option>In Progress</option>
                                      <option>Completed</option>
                                    </select>
                                  </td>
                                  <td className="border p-1">
                                    <input
                                      type="number"
                                      value={sub.completion}
                                      onChange={(e) => handleSubtaskChange(i, "completion", Number(e.target.value))}
                                      className="border p-1 rounded w-full text-center text-black placeholder-gray-700"
                                      placeholder="0-100"
                                    />
                                  </td>
                                  <td className="border p-1">
                                    <input
                                      value={sub.remarks || ""}
                                      onChange={(e) => handleSubtaskChange(i, "remarks", e.target.value)}
                                      className="border p-1 rounded w-full text-black placeholder-gray-700"
                                      placeholder="Add remarks"
                                    />
                                  </td>
                                  <td className="border p-1 text-center">
                                    <button onClick={() => removeSubtask(i)} className="text-red-600">Remove</button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          <button onClick={addSubtask} className="mt-2 bg-green-500 text-white px-3 py-1 rounded">
                            ➕ Add Subtask
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TasksPage;