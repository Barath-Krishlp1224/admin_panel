// app/admin/assign-task/page.tsx
"use client";

import React, { useEffect, useState } from "react";

/* ----------------------------- Interfaces ----------------------------- */
interface Subtask {
  title: string;
  status: string;
  completion: number;
  remarks: string;
  startDate?: string;
  dueDate?: string;
  endDate?: string;
  timeSpent?: string;
  assignee?: string;
}

interface Task {
  _id: string;
  project: string;
  startDate: string;
  endDate: string;
  dueDate: string;
  completion: number;
  status: string;
  remarks: string;
  timeSpent: string;
  assignee?: string;
  type?: "Main Task" | "Subtask";
  subtasks: Subtask[];
}

interface Employee {
  _id: string;
  name: string;
}

/* -------------------------------------------------------------------------- */
/* 🟢 MAIN COMPONENT */
/* -------------------------------------------------------------------------- */
const AssignTaskPage = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<Partial<Task>>({
    startDate: new Date().toISOString().split("T")[0],
    type: "Main Task",
    subtasks: [],
  });
  const [isEditing, setIsEditing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showSubtaskModal, setShowSubtaskModal] = useState(false);
  const [subtaskForm, setSubtaskForm] = useState<Partial<Subtask>>({});

  /* -------------------------------------------------------------------------- */
  /* 🟢 FETCH ALL TASKS & EMPLOYEES */
  /* -------------------------------------------------------------------------- */
  const fetchTasks = async () => {
    try {
      const res = await fetch("/api/tasks");
      const data = await res.json();
      if (data.success) setTasks(data.tasks);
      else setTasks([]);
    } catch (err) {
      console.error("Error fetching tasks:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch("/api/employees");
      const data = await res.json();
      if (data.success) setEmployees(data.employees);
    } catch (err) {
      console.error("Error fetching employees:", err);
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchEmployees();
  }, []);

  /* -------------------------------------------------------------------------- */
  /* 🟡 HANDLE INPUTS */
  /* -------------------------------------------------------------------------- */
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubtaskChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setSubtaskForm((prev) => ({ ...prev, [name]: value }));
  };

  /* -------------------------------------------------------------------------- */
  /* 🟢 UPDATE TASK */
  /* -------------------------------------------------------------------------- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditing || !form._id) {
      alert("❌ Missing Task ID for update.");
      return;
    }

    try {
      const res = await fetch(`/api/tasks/${form._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (data.success) {
        alert("✅ Task updated successfully!");
        setShowModal(false);
        setIsEditing(false);
        setForm({ startDate: new Date().toISOString().split("T")[0], subtasks: [] });
        fetchTasks();
      } else alert(data.message || "❌ Failed to update task");
    } catch (err) {
      console.error("Error saving task:", err);
      alert("❌ Something went wrong while saving.");
    }
  };

  /* -------------------------------------------------------------------------- */
  /* 🔴 DELETE TASK */
  /* -------------------------------------------------------------------------- */
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        alert("🗑️ Task deleted successfully!");
        fetchTasks();
      } else alert(data.message || "❌ Failed to delete task");
    } catch (err) {
      console.error("Error deleting task:", err);
    }
  };

  /* -------------------------------------------------------------------------- */
  /* ✏️ EDIT TASK */
  /* -------------------------------------------------------------------------- */
  const handleEdit = (task: Task) => {
    setForm(task);
    setIsEditing(true);
    setShowModal(true);
  };

  /* -------------------------------------------------------------------------- */
  /* ➕ ADD SUBTASK */
  /* -------------------------------------------------------------------------- */
  const handleAddSubtask = () => {
    if (!subtaskForm.title?.trim()) {
      alert("❌ Subtask title required");
      return;
    }

    setForm((prev) => ({
      ...prev,
      subtasks: [...(prev.subtasks || []), subtaskForm as Subtask],
    }));

    setSubtaskForm({});
    setShowSubtaskModal(false);
  };

  /* -------------------------------------------------------------------------- */
  /* 💡 UI */
  /* -------------------------------------------------------------------------- */
  if (loading) return <div className="p-4 text-center text-black">Loading tasks...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-black">📋 Task Management</h1>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto bg-white rounded-lg shadow border border-gray-200">
        <table className="min-w-full border-collapse">
          <thead className="bg-gray-100 text-black text-sm">
            <tr>
              <th className="px-4 py-2 border">Project</th>
              <th className="px-4 py-2 border">Assignee</th>
              <th className="px-4 py-2 border">Type</th>
              <th className="px-4 py-2 border">Start</th>
              <th className="px-4 py-2 border">Due</th>
              <th className="px-4 py-2 border">End</th>
              <th className="px-4 py-2 border">Status</th>
              <th className="px-4 py-2 border">Completion</th>
              <th className="px-4 py-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tasks.length > 0 ? (
              tasks.map((t) => (
                <tr
                  key={t._id}
                  className="text-center hover:bg-gray-50 text-sm text-black"
                >
                  <td className="border px-4 py-2">{t.project}</td>
                  <td className="border px-4 py-2">{t.assignee || "-"}</td>
                  <td className="border px-4 py-2">{t.type || "Main Task"}</td>
                  <td className="border px-4 py-2">{t.startDate}</td>
                  <td className="border px-4 py-2">{t.dueDate}</td>
                  <td className="border px-4 py-2">{t.endDate}</td>
                  <td className="border px-4 py-2">{t.status}</td>
                  <td className="border px-4 py-2">{t.completion}%</td>
                  <td className="border px-4 py-2 flex justify-center gap-2">
                    <button
                      onClick={() => handleEdit(t)}
                      className="bg-yellow-400 text-black px-3 py-1 rounded hover:bg-yellow-500 transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(t._id)}
                      className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={9} className="py-4 text-center text-black">
                  No tasks found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL: EDIT TASK */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-lg">
            <h2 className="text-xl font-semibold mb-4 text-black">✏️ Edit Task</h2>

            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="text"
                name="project"
                placeholder="Project Name"
                value={form.project || ""}
                onChange={handleChange}
                className="w-full border p-2 rounded text-black"
                required
              />

              <select
                name="assignee"
                value={form.assignee || ""}
                onChange={handleChange}
                className="w-full border p-2 rounded text-black"
              >
                <option value="">Select Assignee</option>
                {employees.map((emp) => (
                  <option key={emp._id} value={emp.name}>
                    {emp.name}
                  </option>
                ))}
              </select>

              <select
                name="type"
                value={form.type || "Main Task"}
                onChange={handleChange}
                className="w-full border p-2 rounded text-black"
              >
                <option>Main Task</option>
                <option>Subtask</option>
              </select>

              <div className="grid grid-cols-3 gap-2">
                <input
                  type="date"
                  name="startDate"
                  value={form.startDate || ""}
                  onChange={handleChange}
                  className="border p-2 rounded text-black"
                />
                <input
                  type="date"
                  name="dueDate"
                  value={form.dueDate || ""}
                  onChange={handleChange}
                  className="border p-2 rounded text-black"
                />
                <input
                  type="date"
                  name="endDate"
                  value={form.endDate || ""}
                  onChange={handleChange}
                  className="border p-2 rounded text-black"
                />
              </div>

              <input
                type="number"
                name="completion"
                placeholder="Completion %"
                value={form.completion || ""}
                onChange={handleChange}
                className="w-full border p-2 rounded text-black"
              />

              <input
                type="text"
                name="status"
                placeholder="Status"
                value={form.status || ""}
                onChange={handleChange}
                className="w-full border p-2 rounded text-black"
              />

              <textarea
                name="remarks"
                placeholder="Remarks"
                value={form.remarks || ""}
                onChange={handleChange}
                className="w-full border p-2 rounded text-black"
              />

              {/* SUBTASKS */}
              <div>
                <h3 className="font-semibold text-black flex justify-between">
                  Subtasks
                  <button
                    type="button"
                    className="text-blue-600 underline"
                    onClick={() => setShowSubtaskModal(true)}
                  >
                    + Add Subtask
                  </button>
                </h3>
                {form.subtasks && form.subtasks.length > 0 ? (
                  <ul className="mt-2 text-sm text-gray-700">
                    {form.subtasks.map((st, i) => (
                      <li key={i}>
                        ✅ {st.title} — {st.status} ({st.completion}%)
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">No subtasks yet.</p>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUBTASK MODAL */}
      {showSubtaskModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md">
            <h2 className="text-lg font-semibold text-black mb-3">Add Subtask</h2>

            <input
              type="text"
              name="title"
              placeholder="Subtask Title"
              value={subtaskForm.title || ""}
              onChange={handleSubtaskChange}
              className="w-full border p-2 rounded text-black mb-2"
            />
            <select
              name="assignee"
              value={subtaskForm.assignee || ""}
              onChange={handleSubtaskChange}
              className="w-full border p-2 rounded text-black mb-2"
            >
              <option value="">Select Assignee</option>
              {employees.map((emp) => (
                <option key={emp._id} value={emp.name}>
                  {emp.name}
                </option>
              ))}
            </select>

            <input
              type="number"
              name="completion"
              placeholder="Completion %"
              value={subtaskForm.completion || ""}
              onChange={handleSubtaskChange}
              className="w-full border p-2 rounded text-black mb-2"
            />

            <input
              type="text"
              name="status"
              placeholder="Status"
              value={subtaskForm.status || ""}
              onChange={handleSubtaskChange}
              className="w-full border p-2 rounded text-black mb-2"
            />

            <textarea
              name="remarks"
              placeholder="Remarks"
              value={subtaskForm.remarks || ""}
              onChange={handleSubtaskChange}
              className="w-full border p-2 rounded text-black mb-2"
            />

            <div className="flex justify-end gap-3 mt-3">
              <button
                onClick={() => setShowSubtaskModal(false)}
                className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleAddSubtask}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignTaskPage;