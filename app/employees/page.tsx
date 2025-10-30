"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Search, Edit2, Save, X, CheckCircle, Plus, ChevronDown, ChevronRight, CalendarDays, Clock, Filter } from "lucide-react"; 

interface Subtask {
  title: string;
  status: string;
  completion: number;
  remarks?: string;
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
  startDate?: string;
  dueDate?: string;
  endDate?: string;
  timeSpent?: string;
}

// 1. UPDATED: Add new presets to the type
type DateFilterPreset = 
    | "All" 
    | "Today" 
    | "Yesterday" 
    | "Last 7 Days" 
    | "Last 1 Month" 
    | "Last 3 Months" // NEW
    | "Last 6 Months" // NEW
    | "Last 9 Months" // NEW
    | "Last 1 Year" 
    | "Specific Date";

interface DateFilter {
    preset: DateFilterPreset;
    startDate: string;
    endDate: string;
}

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

// 2. UPDATED: Implement logic for new presets
const getDatesForFilter = (preset: DateFilterPreset, customDate: string): { start: string, end: string } => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const formatDate = (date: Date): string => date.toISOString().split('T')[0];
    
    // Helper to get a date 'months' ago
    const getDateMonthsAgo = (months: number): Date => {
        const date = new Date(today);
        date.setMonth(today.getMonth() - months);
        // Correct for months with fewer days (e.g., if today is Jan 31, date.setMonth(today.getMonth() - 1) gives March 3)
        if (date.getDate() < today.getDate()) {
            date.setDate(1); // Set to 1st to then use setDate to get the correct date
            date.setMonth(today.getMonth() - months);
        }
        return date;
    }

    switch (preset) {
        case "Today":
            return { start: formatDate(today), end: formatDate(today) };
        case "Yesterday":
            const yesterday = new Date(today);
            yesterday.setDate(today.getDate() - 1);
            return { start: formatDate(yesterday), end: formatDate(yesterday) };
        case "Last 7 Days":
            const last7Days = new Date(today);
            last7Days.setDate(today.getDate() - 6);
            return { start: formatDate(last7Days), end: formatDate(today) };
        case "Last 1 Month":
            const last1Month = getDateMonthsAgo(1);
            return { start: formatDate(last1Month), end: formatDate(today) };
        case "Last 3 Months": // NEW LOGIC
            const last3Months = getDateMonthsAgo(3);
            return { start: formatDate(last3Months), end: formatDate(today) };
        case "Last 6 Months": // NEW LOGIC
            const last6Months = getDateMonthsAgo(6);
            return { start: formatDate(last6Months), end: formatDate(today) };
        case "Last 9 Months": // NEW LOGIC
            const last9Months = getDateMonthsAgo(9);
            return { start: formatDate(last9Months), end: formatDate(today) };
        case "Last 1 Year":
            const last1Year = getDateMonthsAgo(12);
            return { start: formatDate(last1Year), end: formatDate(today) };
        case "Specific Date":
            const specificDate = customDate || formatDate(today);
            return { start: specificDate, end: specificDate };
        case "All":
        default:
            return { start: "", end: "" };
    }
};

const isTaskInDateRange = (taskDate: string, startDate: string, endDate: string): boolean => {
    const taskDateOnly = taskDate.split('T')[0];
    
    const taskTime = new Date(taskDateOnly).getTime();
    
    const end = new Date(endDate);
    end.setDate(end.getDate() + 1); 
    const endTime = end.getTime();

    const startTime = new Date(startDate).getTime();

    return taskTime >= startTime && taskTime < endTime;
};


const ViewTaskPage: React.FC = () => {
  const [empId, setEmpId] = useState("");
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [successToast, setSuccessToast] = useState("");
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  
  const [dateFilter, setDateFilter] = useState<DateFilter>({
      preset: "Last 7 Days",
      startDate: getDatesForFilter("Last 7 Days", "").start,
      endDate: getDatesForFilter("Last 7 Days", "").end,
  });


  const filterTasks = useCallback((taskList: Task[], currentFilter: DateFilter) => {
    if (currentFilter.preset === "All") {
        return taskList;
    }
    
    const { start, end } = getDatesForFilter(currentFilter.preset, currentFilter.startDate);

    if (!start || !end) {
        return taskList;
    }

    return taskList.filter(task => 
        isTaskInDateRange(task.date, start, end)
    );
  }, []);

  useEffect(() => {
      setTasks(filterTasks(allTasks, dateFilter));
  }, [allTasks, dateFilter, filterTasks]);


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

  const handleDateFilterChange = (
    e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    
    if (name === "preset") {
        const newPreset = value as DateFilterPreset;
        const { start, end } = getDatesForFilter(newPreset, dateFilter.startDate);
        
        setDateFilter({
            preset: newPreset,
            startDate: newPreset === "Specific Date" ? dateFilter.startDate : start,
            endDate: newPreset === "Specific Date" ? dateFilter.endDate : end,
        });

    } else if (name === "startDate" || name === "endDate") {
        if (dateFilter.preset === "Specific Date") {
             setDateFilter(prev => ({ 
                ...prev, 
                [name]: value,
                endDate: name === "startDate" && value > prev.endDate ? value : prev.endDate
            }));
        }
    }
  };


  const handleFetch = async () => {
    if (!empId) {
      setMessage("Please enter Employee ID");
      setAllTasks([]);
      setTasks([]);
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      // NOTE: You'll need to replace this with your actual API endpoint
      const res = await fetch(`/api/tasks/getByEmpId?empId=${empId}`);
      const data = await res.json();

      if (res.ok) {
        const fetchedTasks = data.tasks || [];
        setAllTasks(fetchedTasks);
        setMessage(fetchedTasks.length === 0 ? "No tasks found for this employee." : "");
      } else {
        setAllTasks([]);
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
      // NOTE: You'll need to replace this with your actual API endpoint
      const res = await fetch(`/api/tasks/update/${editingTask._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingTask),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setEditingTask(null);
        setSuccessToast("Task updated successfully! Refreshing data...");
        
        // Refetch all tasks to update the list
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

  const RenderTaskRow = (task: Task, idx: number) => {
    const isExpanded = expandedTasks.has(task._id);
    const hasSubtasks = task.subtasks && task.subtasks.length > 0;

    const mainColSpan = 16; 

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
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-300"><CalendarDays className="inline w-3 h-3 mr-1"/>Start</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-300"><CalendarDays className="inline w-3 h-3 mr-1"/>Due</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-300"><CalendarDays className="inline w-3 h-3 mr-1"/>End</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-300"><Clock className="inline w-3 h-3 mr-1"/>Time</th>
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
                          <td className="px-4 py-2 text-sm text-gray-600 border-r border-gray-300">{st.startDate ? st.startDate.split("T")[0] : "-"}</td>
                          <td className="px-4 py-2 text-sm text-gray-600 border-r border-gray-300">{st.dueDate ? st.dueDate.split("T")[0] : "-"}</td>
                          <td className="px-4 py-2 text-sm text-gray-600 border-r border-gray-300">{st.endDate ? st.endDate.split("T")[0] : "-"}</td>
                          <td className="px-4 py-2 text-sm text-gray-600 border-r border-gray-300">{st.timeSpent || "-"}</td>
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

          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
            <div className="flex flex-col md:flex-row gap-4 md:items-end">
              
              <div className="flex-1 min-w-[200px]">
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

              <div className="min-w-[200px]">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Filter className="inline w-4 h-4 mr-2" /> Date Filter
                </label>
                <select
                  name="preset"
                  value={dateFilter.preset}
                  onChange={handleDateFilterChange}
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
                  disabled={loading}
                >
                    <option value="Last 7 Days">Last 7 Days (Default)</option>
                    <option value="All">All Tasks</option>
                    <option value="Today">Today</option>
                    <option value="Yesterday">Yesterday</option>
                    <option value="Last 1 Month">Last 1 Month</option>
                    <option value="Last 3 Months">Last 3 Months</option> {/* ADDED */}
                    <option value="Last 6 Months">Last 6 Months</option> {/* ADDED */}
                    <option value="Last 9 Months">Last 9 Months</option> {/* ADDED */}
                    <option value="Last 1 Year">Last 1 Year</option>
                    <option value="Specific Date">Specific Date Range</option>
                </select>
              </div>

              {dateFilter.preset === "Specific Date" && (
                <>
                  <div className="min-w-[140px]">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Start Date
                    </label>
                    <input
                      type="date"
                      name="startDate"
                      value={dateFilter.startDate}
                      onChange={handleDateFilterChange}
                      className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
                      disabled={loading}
                    />
                  </div>
                  <div className="min-w-[140px]">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        End Date
                    </label>
                    <input
                      type="date"
                      name="endDate"
                      value={dateFilter.endDate}
                      onChange={handleDateFilterChange}
                      className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
                      disabled={loading}
                      min={dateFilter.startDate}
                    />
                  </div>
                </>
              )}


              <button
                onClick={handleFetch}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-lg transition duration-200 shadow-md h-[42px] mt-2 md:mt-0"
                style={{ whiteSpace: "nowrap" }}
                disabled={loading}
              >
                {loading ? "Loading..." : "Fetch Tasks"}
              </button>
            </div>
          </div>

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
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800" style={{minWidth: '100px'}}><CalendarDays className="inline w-4 h-4 mr-1"/>Start Date</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800" style={{minWidth: '100px'}}><CalendarDays className="inline w-4 h-4 mr-1"/>Due Date</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800" style={{minWidth: '100px'}}><CalendarDays className="inline w-4 h-4 mr-1"/>End Date</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800" style={{minWidth: '100px'}}><Clock className="inline w-4 h-4 mr-1"/>Time Spent</th>
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
          {tasks.length === 0 && allTasks.length > 0 && !message && (
             <div className="bg-white border border-yellow-500 text-yellow-700 px-4 py-3 rounded-lg mb-6 font-medium">
                No tasks found for the selected date filter: **{dateFilter.preset}** ({dateFilter.preset === "Specific Date" ? `${dateFilter.startDate} to ${dateFilter.endDate}` : getDatesForFilter(dateFilter.preset, dateFilter.startDate).start + ' to ' + getDatesForFilter(dateFilter.preset, dateFilter.startDate).end}).
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