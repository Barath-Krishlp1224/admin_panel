"use client";

import React, { useState, useEffect } from "react";

/* ----------------------------- Interfaces ----------------------------- */
interface Task {
  _id: string;
  projectId: string;
  project: string;
  assigneeName: string;
  startDate: string;
  endDate?: string; // Assuming endDate can be optional
  dueDate: string;
  completion: number;
  status: string;
  remarks?: string;
}

/* ----------------------------- Component ----------------------------- */
const TasksPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editRowId, setEditRowId] = useState<string | null>(null); 
  const [draftTask, setDraftTask] = useState<Partial<Task>>({}); 

  // 🔹 Fetch tasks from DB
  const fetchTasks = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/tasks");
      const data = await res.json();

      if (res.ok && data.success) {
        setTasks(data.tasks);
      } else {
        setError(data.error || "Failed to fetch tasks.");
      }
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

  /* --------------------------- DELETE TASK --------------------------- */
  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;

    try {
      const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        alert("✅ Task deleted successfully!");
        fetchTasks();
      } else {
        alert(data.error || "Failed to delete task.");
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert("A server error occurred during deletion.");
    }
  };

  /* ---------------------------- EDIT TASK ---------------------------- */
  const handleEdit = (task: Task) => {
    setEditRowId(task._id); 
    setDraftTask(task); 
  };

  const handleDraftChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setDraftTask((prev) => ({
      ...prev,
      [name]: name === "completion" ? Number(value) : value, 
    }));
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editRowId) return;

    try {
      console.log("🟡 Sending update for:", editRowId, draftTask);

      const res = await fetch(`/api/tasks/${editRowId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draftTask), 
      });

      const data = await res.json();
      console.log("🟢 API response:", data);

      if (res.ok && data.success) {
        alert("✅ Task updated successfully!");
        setEditRowId(null); 
        setDraftTask({}); 
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
  };

  /* --------------------------- STATUS BADGE -------------------------- */
  const getStatusBadge = (status: string) => {
    // Note: Badge text will still be determined by the specific badge color (e.g., text-green-800)
    let color = "bg-gray-100 text-gray-800"; 
    if (status === "Completed") color = "bg-green-100 text-green-800";
    else if (status === "In Progress") color = "bg-blue-100 text-blue-800";
    else if (status === "On Hold" || status === "Paused") color = "bg-yellow-100 text-yellow-800";
    return `px-2 py-1 text-xs font-medium rounded-full ${color}`;
  };

  /* -------------------------- LOADING STATE -------------------------- */
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-xl text-gray-600">Loading tasks...</p>
      </div>
    );
  }

  /* --------------------------- ERROR STATE --------------------------- */
  if (error) {
    return (
      <div className="text-center p-10">
        <h2 className="text-xl font-bold text-red-600">Error Loading Tasks</h2>
        <p className="text-red-500 mt-2">{error}</p>
      </div>
    );
  }

  /* --------------------------- EMPTY STATE --------------------------- */
  if (tasks.length === 0) {
    return (
      <div className="text-center p-10">
        <h2 className="text-xl font-bold text-gray-700">No Tasks Found 🤷‍♂️</h2>
        <p className="text-gray-500 mt-2">Start by creating a new task.</p>
      </div>
    );
  }

  /* ---------------------------- MAIN TABLE --------------------------- */
  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="mx-auto max-w-full">
        {/* Title updated to text-gray-900 (dark black) */}
        <h1 className="text-3xl font-bold text-gray-900 mb-6">📋 Project Task List ({tasks.length})</h1>

        <div className="shadow overflow-x-auto border-b border-gray-200 sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-200 table-fixed"> 
            <thead className="bg-gray-100">
              <tr>
                {/* Table headers updated to text-gray-900 */}
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider w-1/10">ID</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider w-1/10">Project</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider w-1/10">Assignee</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider w-1/10">Start Date</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider w-1/10">End Date</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider w-1/10">Due Date</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider w-1/10">Completion</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider w-1/10">Status</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider w-1/10">Remarks</th>
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-900 uppercase tracking-wider w-1/10">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tasks.map((task) => {
                const isEditing = task._id === editRowId;
                const currentData = isEditing ? draftTask : task;

                return (
                  <tr key={task._id} className="hover:bg-gray-50">
                    {/* Project ID - changed to text-gray-900 */}
                    <td className="px-3 py-4 text-sm font-medium text-gray-900 whitespace-nowrap overflow-hidden truncate">
                      {currentData.projectId}
                    </td>

                    {/* Project Name - changed to text-gray-900 */}
                    <td className="px-3 py-4 text-sm text-gray-900 whitespace-nowrap overflow-hidden truncate">
                      {isEditing ? (
                        <input
                          type="text"
                          name="project"
                          value={currentData.project || ""}
                          onChange={handleDraftChange}
                          className="w-full border border-gray-300 p-1 rounded text-sm text-gray-900" // Added text-gray-900 to input
                          required
                        />
                      ) : (
                        task.project
                      )}
                    </td>

                    {/* Assignee Name - changed to text-gray-900 */}
                    <td className="px-3 py-4 text-sm text-gray-900 whitespace-nowrap overflow-hidden truncate">
                      {isEditing ? (
                        <input
                          type="text"
                          name="assigneeName"
                          value={currentData.assigneeName || ""}
                          onChange={handleDraftChange}
                          className="w-full border border-gray-300 p-1 rounded text-sm text-gray-900" // Added text-gray-900 to input
                          required
                        />
                      ) : (
                        task.assigneeName
                      )}
                    </td>

                    {/* Start Date - changed to text-gray-900 */}
                    <td className="px-3 py-4 text-sm text-gray-900 whitespace-nowrap overflow-hidden truncate">
                       {isEditing ? (
                        <input
                          type="date"
                          name="startDate"
                          value={currentData.startDate || ""}
                          onChange={handleDraftChange}
                          className="w-full border border-gray-300 p-1 rounded text-sm text-gray-900" // Added text-gray-900 to input
                          required
                        />
                      ) : (
                        task.startDate
                      )}
                    </td>
                    
                    {/* End Date - changed to text-gray-900 */}
                    <td className="px-3 py-4 text-sm text-gray-900 whitespace-nowrap overflow-hidden truncate">
                       {isEditing ? (
                        <input
                          type="date"
                          name="endDate"
                          value={currentData.endDate || ""}
                          onChange={handleDraftChange}
                          className="w-full border border-gray-300 p-1 rounded text-sm text-gray-900" // Added text-gray-900 to input
                        />
                      ) : (
                        task.endDate || "N/A"
                      )}
                    </td>

                    {/* Due Date - changed to text-gray-900 */}
                    <td className="px-3 py-4 text-sm text-gray-900 whitespace-nowrap overflow-hidden truncate">
                      {isEditing ? (
                        <input
                          type="date"
                          name="dueDate"
                          value={currentData.dueDate || ""}
                          onChange={handleDraftChange}
                          className="w-full border border-gray-300 p-1 rounded text-sm text-gray-900" // Added text-gray-900 to input
                        />
                      ) : (
                        task.dueDate || "N/A"
                      )}
                    </td>

                    {/* Completion - changed to text-gray-900 */}
                    <td className="px-3 py-4 text-sm text-gray-900">
                      {isEditing ? (
                        <input
                          type="number"
                          name="completion"
                          value={currentData.completion || 0}
                          onChange={handleDraftChange}
                          className="w-full border border-gray-300 p-1 rounded text-sm text-center text-gray-900" // Added text-gray-900 to input
                          min="0"
                          max="100"
                        />
                      ) : (
                        `${task.completion}%`
                      )}
                    </td>

                    {/* Status: The badge itself retains its colored text for distinction */}
                    <td className="px-3 py-4">
                      {isEditing ? (
                        <select
                          name="status"
                          value={currentData.status || ""}
                          onChange={handleDraftChange}
                          className="w-full border border-gray-300 p-1 rounded text-sm text-gray-900" // Added text-gray-900 to select
                        >
                          <option value="In Progress">In Progress</option>
                          <option value="Completed">Completed</option>
                          <option value="On Hold">On Hold</option>
                          <option value="Paused">Paused</option>
                        </select>
                      ) : (
                        <span className={getStatusBadge(task.status)}>{task.status}</span>
                      )}
                    </td>
                    
                    {/* Remarks - changed to text-gray-900 */}
                    <td className="px-3 py-4 text-sm text-gray-900 overflow-hidden truncate">
                       {isEditing ? (
                        <input
                          type="text"
                          name="remarks"
                          value={currentData.remarks || ""}
                          onChange={handleDraftChange}
                          className="w-full border border-gray-300 p-1 rounded text-sm text-gray-900" // Added text-gray-900 to input
                        />
                      ) : (
                        task.remarks || "-"
                      )}
                    </td>

                    {/* Actions - The action buttons retain their specific colors (green/gray/indigo/red) for UX */}
                    <td className="px-3 py-4 text-right text-sm font-medium whitespace-nowrap">
                      {isEditing ? (
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={handleUpdate}
                            className="text-green-600 hover:text-green-900 transition duration-150"
                          >
                            Save
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="text-gray-600 hover:text-gray-900 transition duration-150"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleEdit(task)}
                            className="text-indigo-600 hover:text-indigo-900 transition duration-150"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(task._id)}
                            className="text-red-600 hover:text-red-900 transition duration-150"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TasksPage;