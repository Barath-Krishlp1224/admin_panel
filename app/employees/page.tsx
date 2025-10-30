"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import * as XLSX from "xlsx";
// ⭐ CHANGE 1: Imported Plus icon
import { Download, Search, Calendar, ChevronDown, ChevronUp, Clock, CalendarDays, Edit2, Save, X, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

// --- INTERFACES ---
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
  empId: string;
  project?: string;
  plan?: string;
  done?: string;
  completion?: string;
  status?: string;
  remarks?: string;
  subtasks?: Subtask[];
  startDate?: string;
  dueDate?: string;
  endDate?: string;
  timeSpent?: string;
  date?: string; 
}

// -----------------------------------------------------------

const ViewTaskPage: React.FC = () => {
  const router = useRouter();
  const [searchCriteria, setSearchCriteria] = useState<"empId" | "project" | "">(""); 
  const [searchValue, setSearchValue] = useState(""); 
  const [tasks, setTasks] = useState<Task[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [message, setMessage] = useState("Loading your tasks automatically...");
  const [timeRange, setTimeRange] = useState("all");
  const [selectedDate, setSelectedDate] = useState<string>("");
  
  // Edit state
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Task | null>(null);

  const parseDate = (dateStr?: string) => new Date(dateStr || new Date());

  // Memoized list of tasks sorted by date (most recent first)
  const sortedTasks = useMemo(() => {
    const tasksCopy = [...tasks];
    
    return tasksCopy.sort((a, b) => {
      const dateA = parseDate(a.date || a.startDate);
      const dateB = parseDate(b.date || b.startDate);

      return dateB.getTime() - dateA.getTime();
    });
  }, [tasks]); 

  const isFetchEnabled = useMemo(() => {
    return searchCriteria.trim() !== "" && searchValue.trim() !== "";
  }, [searchCriteria, searchValue]);

  const getPlaceholderText = () => {
    switch (searchCriteria) {
      case 'empId':
        return 'Enter Emp ID';
      case 'project':
        return 'Enter Project Name';
      default:
        return 'Select a search field first';
    }
  };
  
  const filterTasksByDate = useCallback((tasks: Task[]) => {
    const now = new Date();
    const isSameDay = (d1: Date, d2: Date) =>
        d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate();

    return tasks.filter((task) => {
      const dateToFilter = task.date || task.startDate;
      if (!dateToFilter) return timeRange === "all";

      const taskDate = parseDate(dateToFilter);

      if (selectedDate) {
        const selDate = parseDate(selectedDate);
        return isSameDay(taskDate, selDate);
      }

      switch (timeRange) {
        case "today":
          return isSameDay(taskDate, now);
        case "yesterday":
          const yesterday = new Date(now);
          yesterday.setDate(now.getDate() - 1);
          return isSameDay(taskDate, yesterday);
        case "week":
          const weekAgo = new Date(now);
          weekAgo.setDate(now.getDate() - 7);
          return taskDate >= weekAgo && taskDate <= now;
        case "month":
          const monthAgo = new Date(now);
          monthAgo.setMonth(now.getMonth() - 1);
          return taskDate >= monthAgo && taskDate <= now;
        case "year":
          const yearAgo = new Date(now);
          yearAgo.setFullYear(now.getFullYear() - 1);
          return taskDate >= yearAgo && taskDate <= now;
        case "all":
        default:
          return true;
      }
    });
  }, [selectedDate, timeRange]);

  const handleFetch = useCallback(async () => {
    if (!searchCriteria || !searchValue) {
      setMessage("Please select a criteria and enter a search value.");
      setTasks([]);
      return;
    }

    setMessage(`Fetching tasks for ${searchCriteria}: ${searchValue}...`);
    
    try {
      const params = new URLSearchParams();
      params.append(searchCriteria, searchValue);

      const res = await fetch(`/api/tasks/getByEmpId?${params.toString()}`); 
      const data = await res.json();

      if (res.ok) {
        const tasksArray = Array.isArray(data.tasks) ? data.tasks : [];
        const filtered = filterTasksByDate(tasksArray);
        setTasks(filtered);
        setMessage(filtered.length === 0 ? "No tasks found for selected criteria and range" : "");
      } else {
        setTasks([]);
        setMessage(data.error || "Failed to fetch tasks");
      }
    } catch (error) {
      console.error(error);
      setTasks([]);
      setMessage("Server error. Check API connection.");
    }
  }, [searchCriteria, searchValue, filterTasksByDate]);

  useEffect(() => {
    const storedEmpId = localStorage.getItem("userEmpId");
    const storedRole = localStorage.getItem("userRole");

    if (storedEmpId) {
        setSearchCriteria("empId");
        setSearchValue(storedEmpId);
    } else {
        router.push('/');
    }
  }, [router]);
  
  useEffect(() => {
      if (searchCriteria === 'empId' && searchValue) {
          handleFetch();
      }
  }, [searchCriteria, searchValue, handleFetch]);

  // Edit handlers
  const startEditing = (task: Task) => {
    setEditingTaskId(task._id);
    setEditFormData({ ...task });
  };

  const cancelEditing = () => {
    setEditingTaskId(null);
    setEditFormData(null);
  };
  
  // ⭐ NEW: Function to add a new subtask
  const addSubtask = () => {
    if (editFormData) {
      const newSubtask: Subtask = {
        title: "New Subtask",
        status: "Pending",
        completion: 0,
        remarks: "",
        startDate: new Date().toISOString().split('T')[0], // Set current date as default
        dueDate: "",
        endDate: "",
        timeSpent: "",
      };
      setEditFormData({
        ...editFormData,
        // Ensure subtasks is treated as an array
        subtasks: [...(editFormData.subtasks || []), newSubtask], 
      });
    }
  };


  const handleEditChange = (field: keyof Task, value: any) => {
    if (editFormData) {
      setEditFormData({ ...editFormData, [field]: value });
    }
  };

  const handleSubtaskChange = (index: number, field: keyof Subtask, value: any) => {
    if (editFormData && editFormData.subtasks) {
      const updatedSubtasks = [...editFormData.subtasks];
      updatedSubtasks[index] = { ...updatedSubtasks[index], [field]: value };
      setEditFormData({ ...editFormData, subtasks: updatedSubtasks });
    }
  };

  const saveEdit = async () => {
    if (!editFormData) return;

    try {
      const res = await fetch(`/api/tasks/${editFormData._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project: editFormData.project,
          plan: editFormData.plan || "",
          done: editFormData.done || "",
          completion: editFormData.completion,
          status: editFormData.status,
          remarks: editFormData.remarks,
          startDate: editFormData.startDate,
          dueDate: editFormData.dueDate,
          endDate: editFormData.endDate,
          timeSpent: editFormData.timeSpent,
          subtasks: editFormData.subtasks || []
        })
      });

      const data = await res.json();

      if (res.ok) {
        setMessage("Task updated successfully!");
        setEditingTaskId(null);
        setEditFormData(null);
        handleFetch(); // Refresh the task list
      } else {
        setMessage(data.message || "Failed to update task");
      }
    } catch (error) {
      console.error(error);
      setMessage("Error updating task");
    }
  };

  const toggleExpand = (taskId: string) => {
    setExpanded(expanded === taskId ? null : taskId);
  };

  const downloadTasks = (tasksToDownload: Task[], filename: string) => {
    if (tasksToDownload.length === 0) {
      alert("No tasks available to download");
      return;
    }

    const worksheetData = tasksToDownload.flatMap((t) => {
      const taskRow = {
        Type: "Task",
        Date: t.date ? t.date.split("T")[0] : "",
        "Employee ID": t.empId,
        Project: t.project || "",
        "Completion %": t.completion || "0",
        Status: t.status || "N/A",
        Remarks: t.remarks || "",
        "Start Date": t.startDate ? t.startDate.split("T")[0] : "",
        "Due Date": t.dueDate ? t.dueDate.split("T")[0] : "",
        "End Date": t.endDate ? t.endDate.split("T")[0] : "",
        "Time Spent": t.timeSpent || "",
      };

      const subtaskRows = (t.subtasks || []).map((st) => ({
        Type: "Subtask",
        Date: t.date ? t.date.split("T")[0] : "",
        "Employee ID": t.empId,
        Project: t.project || "",
        "Subtask Name": st.title, 
        "Completion %": st.completion,
        Status: st.status,
        Remarks: st.remarks || "",
        "Start Date": st.startDate ? st.startDate.split("T")[0] : "",
        "Due Date": st.dueDate ? st.dueDate.split("T")[0] : "",
        "End Date": st.endDate ? st.endDate.split("T")[0] : "",
        "Time Spent": st.timeSpent || "",
      }));

      return [taskRow, ...subtaskRows];
    });

    const ws = XLSX.utils.json_to_sheet(worksheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Tasks");
    XLSX.writeFile(wb, filename);
  };

  const downloadAllTasks = async () => {
    try {
      const res = await fetch("/api/tasks/all");
      const data = await res.json();

      if (!res.ok || !data.tasks || data.tasks.length === 0) {
        return alert("No tasks found");
      }

      const filtered = filterTasksByDate(data.tasks);
      downloadTasks(filtered, "All_Employee_Tasks.xlsx");
    } catch (error) {
      console.error(error);
      alert("Failed to download all tasks");
    }
  };
  
  const formatDate = (dateString?: string) => 
    dateString ? dateString.split("T")[0] : "-";

  return (
    <div className="min-h-screen"> 
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8 pt-16 sm:pt-20 md:pt-24">
        {/* Header */}
        <div className="mt-[10%]">
          {/* Main heading set to black */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-4xl font-extrabold text-white mb-5">
            Employee Tasks Dashboard
          </h1>
        </div>

        {/* Message (Already text-black) */}
        {message && (
          <div className="bg-white border border-gray-300 text-black px-4 py-3 rounded-xl mb-6 font-semibold shadow-lg text-sm sm:text-base">
            {message}
          </div>
        )}

        {/* Table Section - Desktop */}
        {tasks.length > 0 && (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-4 xl:px-6 py-3 xl:py-4 text-left text-xs xl:text-sm font-bold text-black">Type</th>
                      <th className="px-4 xl:px-6 py-3 xl:py-4 text-left text-xs xl:text-sm font-bold text-black">Date</th>
                      <th className="px-4 xl:px-6 py-3 xl:py-4 text-left text-xs xl:text-sm font-bold text-black">Employee ID</th>
                      <th className="px-4 xl:px-6 py-3 xl:py-4 text-left text-xs xl:text-sm font-bold text-black">Project</th>
                      <th className="px-4 xl:px-6 py-3 xl:py-4 text-center text-xs xl:text-sm font-bold text-black">%</th>
                      <th className="px-4 xl:px-6 py-3 xl:py-4 text-left text-xs xl:text-sm font-bold text-black">Status</th>
                      <th className="px-4 xl:px-6 py-3 xl:py-4 text-left text-xs xl:text-sm font-bold text-black">Remarks</th>
                      <th className="px-4 xl:px-6 py-3 xl:py-4 text-left text-xs xl:text-sm font-bold text-black" style={{minWidth: '100px'}}><CalendarDays className="inline w-3 h-3 mr-1"/>Start</th>
                      <th className="px-4 xl:px-6 py-3 xl:py-4 text-left text-xs xl:text-sm font-bold text-black" style={{minWidth: '100px'}}><CalendarDays className="inline w-3 h-3 mr-1"/>Due</th>
                      <th className="px-4 xl:px-6 py-3 xl:py-4 text-left text-xs xl:text-sm font-bold text-black" style={{minWidth: '100px'}}><CalendarDays className="inline w-3 h-3 mr-1"/>End</th>
                      <th className="px-4 xl:px-6 py-3 xl:py-4 text-left text-xs xl:text-sm font-bold text-black" style={{minWidth: '100px'}}><Clock className="inline w-3 h-3 mr-1"/>Time</th>
                      <th className="px-4 xl:px-6 py-3 xl:py-4 text-center text-xs xl:text-sm font-bold text-black">Subtasks</th>
                      <th className="px-4 xl:px-6 py-3 xl:py-4 text-center text-xs xl:text-sm font-bold text-black">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Use sortedTasks instead of tasks */}
                    {sortedTasks.map((task, idx) => (
                      <React.Fragment key={task._id}>
                        {editingTaskId === task._id ? (
                          // Edit Mode Row
                          <tr className="bg-blue-50 border-b border-blue-200">
                            <td className="px-4 xl:px-6 py-3 xl:py-4 text-xs xl:text-sm font-bold text-black">Task</td>
                            <td className="px-4 xl:px-6 py-3 xl:py-4 text-xs xl:text-sm text-black">{formatDate(task.date)}</td>
                            <td className="px-4 xl:px-6 py-3 xl:py-4 text-xs xl:text-sm font-semibold text-black">{task.empId}</td>
                            <td className="px-4 xl:px-6 py-3 xl:py-4">
                              <input
                                type="text"
                                value={editFormData?.project || ""}
                                onChange={(e) => handleEditChange("project", e.target.value)}
                                className="w-full px-2 py-1 border rounded text-xs text-black" 
                              />
                            </td>
                            <td className="px-4 xl:px-6 py-3 xl:py-4">
                              <input
                                type="number"
                                value={editFormData?.completion || ""}
                                onChange={(e) => handleEditChange("completion", e.target.value)}
                                className="w-full px-2 py-1 border rounded text-xs text-center text-black" 
                                min="0"
                                max="100"
                              />
                            </td>
                            <td className="px-4 xl:px-6 py-3 xl:py-4">
                              <select
                                value={editFormData?.status || ""}
                                onChange={(e) => handleEditChange("status", e.target.value)}
                                className="w-full px-2 py-1 border rounded text-xs text-black" 
                              >
                                <option value="Pending">Pending</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Completed">Completed</option>
                              </select>
                            </td>
                            <td className="px-4 xl:px-6 py-3 xl:py-4">
                              <input
                                type="text"
                                value={editFormData?.remarks || ""}
                                onChange={(e) => handleEditChange("remarks", e.target.value)}
                                className="w-full px-2 py-1 border rounded text-xs text-black" 
                              />
                            </td>
                            <td className="px-4 xl:px-6 py-3 xl:py-4">
                              <input
                                type="date"
                                value={editFormData?.startDate?.split("T")[0] || ""}
                                onChange={(e) => handleEditChange("startDate", e.target.value)}
                                className="w-full px-2 py-1 border rounded text-xs text-black" 
                              />
                            </td>
                            <td className="px-4 xl:px-6 py-3 xl:py-4">
                              <input
                                type="date"
                                value={editFormData?.dueDate?.split("T")[0] || ""}
                                onChange={(e) => handleEditChange("dueDate", e.target.value)}
                                className="w-full px-2 py-1 border rounded text-xs text-black" 
                              />
                            </td>
                            <td className="px-4 xl:px-6 py-3 xl:py-4">
                              <input
                                type="date"
                                value={editFormData?.endDate?.split("T")[0] || ""}
                                onChange={(e) => handleEditChange("endDate", e.target.value)}
                                className="w-full px-2 py-1 border rounded text-xs text-black" 
                              />
                            </td>
                            <td className="px-4 xl:px-6 py-3 xl:py-4">
                              <input
                                type="text"
                                value={editFormData?.timeSpent || ""}
                                onChange={(e) => handleEditChange("timeSpent", e.target.value)}
                                className="w-full px-2 py-1 border rounded text-xs text-black" 
                                placeholder="e.g., 2h 30m"
                              />
                            </td>
                            <td className="px-4 xl:px-6 py-3 xl:py-4 text-center">
                              {/* Always show toggle button if subtasks exist */}
                              {(task.subtasks && task.subtasks.length > 0) || (editFormData?.subtasks && editFormData.subtasks.length > 0) ? (
                                <button onClick={() => toggleExpand(task._id)} className="text-black hover:text-gray-700 transition-colors">
                                  {expanded === task._id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                </button>
                              ) : "-"}
                            </td>
                            <td className="px-4 xl:px-6 py-3 xl:py-4 text-center">
                              <div className="flex gap-2 justify-center">
                                <button
                                  onClick={saveEdit}
                                  className="p-1 bg-green-500 text-white rounded hover:bg-green-600"
                                  title="Save"
                                >
                                  <Save className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={cancelEditing}
                                  className="p-1 bg-red-500 text-white rounded hover:bg-red-600"
                                  title="Cancel"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                                {/* ⭐ NEW: Add Subtask Button for Desktop */}
                                <button
                                  onClick={addSubtask}
                                  className="p-1 bg-purple-500 text-white rounded hover:bg-purple-600"
                                  title="Add Subtask"
                                >
                                  <Plus className="w-4 h-4" /> 
                                </button>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          // View Mode Row
                          <tr className={`border-b border-gray-200 hover:bg-gray-50 transition ${idx % 2 === 0 ? "bg-white" : "bg-gray-100"}`}>
                            <td className="px-4 xl:px-6 py-3 xl:py-4 text-xs xl:text-sm font-bold text-black">Task</td>
                            <td className="px-4 xl:px-6 py-3 xl:py-4 text-xs xl:text-sm text-black">{formatDate(task.date)}</td>
                            <td className="px-4 xl:px-6 py-3 xl:py-4 text-xs xl:text-sm font-semibold text-black">{task.empId}</td>
                            <td className="px-4 xl:px-6 py-3 xl:py-4 text-xs xl:text-sm text-black">{task.project || "-"}</td>
                            <td className="px-4 xl:px-6 py-3 xl:py-4 text-center text-xs xl:text-sm font-bold text-black">{task.completion || "0"}</td>
                            <td className="px-4 xl:px-6 py-3 xl:py-4 text-xs xl:text-sm">
                              {/* Status text set to black */}
                              <span className={`px-2 xl:px-3 py-1 rounded-full text-xs font-bold ${task.status === "Completed" ? "bg-green-200 text-black" : task.status === "In Progress" ? "bg-yellow-200 text-black" : "bg-gray-200 text-black"}`}>
                                {task.status || "N/A"}
                              </span>
                            </td>
                            <td className="px-4 xl:px-6 py-3 xl:py-4 text-xs xl:text-sm text-black">{task.remarks || "-"}</td>
                            <td className="px-4 xl:px-6 py-3 xl:py-4 text-xs xl:text-sm text-black">{formatDate(task.startDate)}</td>
                            <td className="px-4 xl:px-6 py-3 xl:py-4 text-xs xl:text-sm text-black">{formatDate(task.dueDate)}</td>
                            <td className="px-4 xl:px-6 py-3 xl:py-4 text-xs xl:text-sm text-black">{formatDate(task.endDate)}</td>
                            <td className="px-4 xl:px-6 py-3 xl:py-4 text-xs xl:text-sm text-black">{task.timeSpent || "-"}</td>
                            <td className="px-4 xl:px-6 py-3 xl:py-4 text-center">
                              {task.subtasks && task.subtasks.length > 0 ? (
                                <button onClick={() => toggleExpand(task._id)} className="text-black hover:text-gray-700 transition-colors">
                                  {expanded === task._id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                </button>
                              ) : "-"}
                            </td>
                            <td className="px-4 xl:px-6 py-3 xl:py-4 text-center">
                              <button
                                onClick={() => startEditing(task)}
                                className="p-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                                title="Edit Task"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        )}

                        {expanded === task._id && editFormData?.subtasks && editingTaskId === task._id ? (
                            // Subtask Edit View (using editFormData)
                            editFormData.subtasks.map((subtask, subIdx) => (
                                <tr key={`${task._id}-sub-${subIdx}`} className="bg-gray-100 border-b border-gray-200">
                                    <td className="px-4 xl:px-6 py-2 xl:py-3 text-xs xl:text-sm font-bold text-black pl-8 xl:pl-12">Subtask</td>
                                    <td className="px-4 xl:px-6 py-2 xl:py-3 text-xs xl:text-sm text-black">{formatDate(task.date)}</td>
                                    <td className="px-4 xl:px-6 py-2 xl:py-3 text-xs xl:text-sm text-black">{task.empId}</td>
                                    <td className="px-4 xl:px-6 py-2 xl:py-3 text-xs xl:text-sm text-black">{task.project || "-"}</td>
                                    
                                    {/* Subtask Title Input */}
                                    <td className="px-4 xl:px-6 py-2 xl:py-3" colSpan={3}>
                                        <input
                                            type="text"
                                            value={subtask.title || ""}
                                            onChange={(e) => handleSubtaskChange(subIdx, "title", e.target.value)}
                                            className="w-full px-2 py-1 border rounded text-xs text-black" 
                                        />
                                    </td>
                                    {/* Completion Input */}
                                    <td className="px-4 xl:px-6 py-2 xl:py-3">
                                        <input
                                            type="number"
                                            value={subtask.completion || 0}
                                            onChange={(e) => handleSubtaskChange(subIdx, "completion", Number(e.target.value))}
                                            className="w-full px-2 py-1 border rounded text-xs text-center text-black" 
                                            min="0"
                                            max="100"
                                        />
                                    </td>
                                    {/* Status Select */}
                                    <td className="px-4 xl:px-6 py-2 xl:py-3">
                                        <select
                                            value={subtask.status || ""}
                                            onChange={(e) => handleSubtaskChange(subIdx, "status", e.target.value)}
                                            className="w-full px-2 py-1 border rounded text-xs text-black"
                                        >
                                            <option value="Pending">Pending</option>
                                            <option value="In Progress">In Progress</option>
                                            <option value="Completed">Completed</option>
                                        </select>
                                    </td>
                                    {/* Remarks Input */}
                                    <td className="px-4 xl:px-6 py-2 xl:py-3">
                                        <input
                                            type="text"
                                            value={subtask.remarks || ""}
                                            onChange={(e) => handleSubtaskChange(subIdx, "remarks", e.target.value)}
                                            className="w-full px-2 py-1 border rounded text-xs text-black" 
                                        />
                                    </td>
                                    {/* Date Inputs */}
                                    <td className="px-4 xl:px-6 py-2 xl:py-3">
                                        <input
                                            type="date"
                                            value={subtask.startDate?.split("T")[0] || ""}
                                            onChange={(e) => handleSubtaskChange(subIdx, "startDate", e.target.value)}
                                            className="w-full px-2 py-1 border rounded text-xs text-black"
                                        />
                                    </td>
                                    <td className="px-4 xl:px-6 py-2 xl:py-3">
                                        <input
                                            type="date"
                                            value={subtask.dueDate?.split("T")[0] || ""}
                                            onChange={(e) => handleSubtaskChange(subIdx, "dueDate", e.target.value)}
                                            className="w-full px-2 py-1 border rounded text-xs text-black"
                                        />
                                    </td>
                                    <td className="px-4 xl:px-6 py-2 xl:py-3">
                                        <input
                                            type="date"
                                            value={subtask.endDate?.split("T")[0] || ""}
                                            onChange={(e) => handleSubtaskChange(subIdx, "endDate", e.target.value)}
                                            className="w-full px-2 py-1 border rounded text-xs text-black"
                                        />
                                    </td>
                                    {/* Time Spent Input */}
                                    <td className="px-4 xl:px-6 py-2 xl:py-3">
                                        <input
                                            type="text"
                                            value={subtask.timeSpent || ""}
                                            onChange={(e) => handleSubtaskChange(subIdx, "timeSpent", e.target.value)}
                                            className="w-full px-2 py-1 border rounded text-xs text-black" 
                                        />
                                    </td>
                                    <td className="px-4 xl:px-6 py-2 xl:py-3"></td>
                                    <td className="px-4 xl:px-6 py-2 xl:py-3"></td>
                                </tr>
                            ))
                        ) : (
                          // Subtask View Mode (using task.subtasks)
                          expanded === task._id && task.subtasks && task.subtasks.map((subtask, subIdx) => (
                            <tr key={`${task._id}-sub-${subIdx}`} className="bg-gray-100 border-b border-gray-200">
                              {/* Subtask label set to black */}
                              <td className="px-4 xl:px-6 py-2 xl:py-3 text-xs xl:text-sm font-bold text-black pl-8 xl:pl-12">Subtask</td>
                              <td className="px-4 xl:px-6 py-2 xl:py-3 text-xs xl:text-sm text-black">{formatDate(task.date)}</td>
                              <td className="px-4 xl:px-6 py-2 xl:py-3 text-xs xl:text-sm text-black">{task.empId}</td>
                              <td className="px-4 xl:px-6 py-2 xl:py-3 text-xs xl:text-sm text-black">{task.project || "-"}</td>
                              
                              <td className="px-4 xl:px-6 py-2 xl:py-3 text-xs xl:text-sm text-black font-semibold" colSpan={3}>{subtask.title}</td>
                              <td className="px-4 xl:px-6 py-2 xl:py-3 text-center text-xs xl:text-sm font-bold text-black">{subtask.completion}</td>
                              <td className="px-4 xl:px-6 py-2 xl:py-3 text-xs xl:text-sm">
                                {/* Status text set to black */}
                                <span className={`px-2 xl:px-3 py-1 rounded-full text-xs font-bold ${subtask.status === "Completed" ? "bg-green-200 text-black" : subtask.status === "In Progress" ? "bg-yellow-200 text-black" : "bg-gray-200 text-black"}`}>
                                  {subtask.status}
                                </span>
                              </td>
                              <td className="px-4 xl:px-6 py-2 xl:py-3 text-xs xl:text-sm text-black">{subtask.remarks || "-"}</td>
                              <td className="px-4 xl:px-6 py-2 xl:py-3 text-xs xl:text-sm text-black">{formatDate(subtask.startDate)}</td>
                              <td className="px-4 xl:px-6 py-2 xl:py-3 text-xs xl:text-sm text-black">{formatDate(subtask.dueDate)}</td>
                              <td className="px-4 xl:px-6 py-2 xl:py-3 text-xs xl:text-sm text-black">{formatDate(subtask.endDate)}</td>
                              <td className="px-4 xl:px-6 py-2 xl:py-3 text-xs xl:text-sm text-black">{subtask.timeSpent || "-"}</td>
                              <td className="px-4 xl:px-6 py-2 xl:py-3"></td>
                              <td className="px-4 xl:px-6 py-2 xl:py-3"></td>
                            </tr>
                          ))
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile/Tablet Card View */}
            <div className="lg:hidden space-y-4">
              {/* Use sortedTasks instead of tasks */}
              {sortedTasks.map((task, idx) => (
                <div key={task._id} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                  {editingTaskId === task._id ? (
                    // Edit Mode Card
                    <div className="bg-blue-50 p-4">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-lg text-black">Edit Task</h3>
                        <div className="flex gap-2">
                          <button
                            onClick={saveEdit}
                            className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                          >
                            <Save className="w-5 h-5" />
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-semibold text-black mb-1">Project</label>
                          <input
                            type="text"
                            value={editFormData?.project || ""}
                            onChange={(e) => handleEditChange("project", e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg text-black" 
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-semibold text-black mb-1">Completion %</label>
                            <input
                              type="number"
                              value={editFormData?.completion || ""}
                              onChange={(e) => handleEditChange("completion", e.target.value)}
                              className="w-full px-3 py-2 border rounded-lg text-black" 
                              min="0"
                              max="100"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-black mb-1">Status</label>
                            <select
                              value={editFormData?.status || ""}
                              onChange={(e) => handleEditChange("status", e.target.value)}
                              className="w-full px-3 py-2 border rounded-lg text-black" 
                            >
                              <option value="Pending">Pending</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Completed">Completed</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-black mb-1">Remarks</label>
                          <textarea
                            value={editFormData?.remarks || ""}
                            onChange={(e) => handleEditChange("remarks", e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg text-black" 
                            rows={2}
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-sm font-semibold text-black mb-1">Start Date</label>
                            <input
                              type="date"
                              value={editFormData?.startDate?.split("T")[0] || ""}
                              onChange={(e) => handleEditChange("startDate", e.target.value)}
                              className="w-full px-3 py-2 border rounded-lg text-black" 
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-black mb-1">Due Date</label>
                            <input
                              type="date"
                              value={editFormData?.dueDate?.split("T")[0] || ""}
                              onChange={(e) => handleEditChange("dueDate", e.target.value)}
                              className="w-full px-3 py-2 border rounded-lg text-black" 
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-black mb-1">End Date</label>
                            <input
                              type="date"
                              value={editFormData?.endDate?.split("T")[0] || ""}
                              onChange={(e) => handleEditChange("endDate", e.target.value)}
                              className="w-full px-3 py-2 border rounded-lg text-black" 
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-black mb-1">Time Spent</label>
                          <input
                            type="text"
                            value={editFormData?.timeSpent || ""}
                            onChange={(e) => handleEditChange("timeSpent", e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg text-black" 
                            placeholder="e.g., 2h 30m"
                          />
                        </div>
                      </div>

                      {/* Subtasks Section for Mobile Edit */}
                      <div className="mt-4 pt-4 border-t border-gray-300">
                        <h4 className="font-bold text-sm mb-3 text-black flex justify-between items-center">
                            <span>Subtasks</span>
                            {/* ⭐ NEW: Add Subtask Button for Mobile */}
                            <button
                                onClick={addSubtask}
                                className="px-3 py-1 text-xs bg-purple-500 text-white rounded-lg hover:bg-purple-600 flex items-center gap-1"
                                title="Add Subtask"
                            >
                                <Plus className="w-3 h-3" /> Add
                            </button>
                        </h4> 
                        <div className="space-y-3">
                          {(editFormData?.subtasks || []).map((subtask, subIdx) => (
                            <div key={subIdx} className="bg-white p-3 rounded-lg border border-gray-300">
                              <div>
                                <label className="block text-xs font-semibold text-black mb-1">Title</label>
                                <input
                                  type="text"
                                  value={subtask.title || ""}
                                  onChange={(e) => handleSubtaskChange(subIdx, "title", e.target.value)}
                                  className="w-full px-2 py-1 border rounded text-sm text-black" 
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-2 mt-2">
                                <div>
                                  <label className="block text-xs font-semibold text-black mb-1">Completion %</label>
                                  <input
                                    type="number"
                                    value={subtask.completion || 0}
                                    onChange={(e) => handleSubtaskChange(subIdx, "completion", Number(e.target.value))}
                                    className="w-full px-2 py-1 border rounded text-sm text-black" 
                                    min="0"
                                    max="100"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-semibold text-black mb-1">Status</label>
                                  <select
                                    value={subtask.status || ""}
                                    onChange={(e) => handleSubtaskChange(subIdx, "status", e.target.value)}
                                    className="w-full px-2 py-1 border rounded text-sm text-black"
                                  >
                                    <option value="Pending">Pending</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Completed">Completed</option>
                                  </select>
                                </div>
                              </div>
                              <div className="mt-2">
                                <label className="block text-xs font-semibold text-black mb-1">Remarks</label>
                                <input
                                  type="text"
                                  value={subtask.remarks || ""}
                                  onChange={(e) => handleSubtaskChange(subIdx, "remarks", e.target.value)}
                                  className="w-full px-2 py-1 border rounded text-sm text-black" 
                                />
                              </div>
                              <div className="grid grid-cols-3 gap-2 mt-2">
                                <div>
                                  <label className="block text-xs font-semibold text-black mb-1">Start</label>
                                  <input
                                    type="date"
                                    value={subtask.startDate?.split("T")[0] || ""}
                                    onChange={(e) => handleSubtaskChange(subIdx, "startDate", e.target.value)}
                                    className="w-full px-2 py-1 border rounded text-xs text-black"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-semibold text-black mb-1">Due</label>
                                  <input
                                    type="date"
                                    value={subtask.dueDate?.split("T")[0] || ""}
                                    onChange={(e) => handleSubtaskChange(subIdx, "dueDate", e.target.value)}
                                    className="w-full px-2 py-1 border rounded text-xs text-black"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-semibold text-black mb-1">End</label>
                                  <input
                                    type="date"
                                    value={subtask.endDate?.split("T")[0] || ""}
                                    onChange={(e) => handleSubtaskChange(subIdx, "endDate", e.target.value)}
                                    className="w-full px-2 py-1 border rounded text-xs text-black"
                                  />
                                </div>
                              </div>
                              <div className="mt-2">
                                <label className="block text-xs font-semibold text-black mb-1">Time Spent</label>
                                <input
                                  type="text"
                                  value={subtask.timeSpent || ""}
                                  onChange={(e) => handleSubtaskChange(subIdx, "timeSpent", e.target.value)}
                                  className="w-full px-2 py-1 border rounded text-sm text-black" 
                                  placeholder="e.g., 1h 15m"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    // View Mode Card
                    <>
                      <div className="bg-gray-50 p-3 sm:p-4 border-b border-gray-200">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="inline-block px-2 sm:px-3 py-1 bg-black text-white text-xs font-bold rounded-full mb-2">TASK</span>
                            <h3 className="font-bold text-black text-sm sm:text-base">Project: {task.project || "N/A"}</h3>
                            <p className="text-xs sm:text-sm text-black mt-1">Emp ID: {task.empId}</p>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            {/* Status text set to black */}
                            <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-bold ${task.status === "Completed" ? "bg-green-200 text-black" : task.status === "In Progress" ? "bg-yellow-200 text-black" : "bg-gray-200 text-black"}`}>
                              {task.status || "N/A"}
                            </span>
                            <button
                              onClick={() => startEditing(task)}
                              className="p-1.5 bg-blue-500 text-white rounded hover:bg-blue-600"
                              title="Edit Task"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-3 sm:p-4 space-y-2 text-xs sm:text-sm text-black">
                        <div className="grid grid-cols-2 gap-2">
                          <div><span className="font-semibold text-black">Date:</span> {formatDate(task.date)}</div>
                          <div><span className="font-semibold text-black">Completion:</span> <span className="font-bold text-black">{task.completion || "0"}%</span></div>
                          <div><span className="font-semibold text-black">Time Spent:</span> {task.timeSpent || "-"}</div>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-gray-200">
                          <div className="flex items-center gap-1">
                            <CalendarDays className="w-3 h-3 text-green-600" />
                            <span className="font-semibold text-black">Start:</span> {formatDate(task.startDate)}
                          </div>
                          <div className="flex items-center gap-1">
                            <CalendarDays className="w-3 h-3 text-yellow-600" />
                            <span className="font-semibold text-black">Due:</span> {formatDate(task.dueDate)}
                          </div>
                          <div className="flex items-center gap-1">
                            <CalendarDays className="w-3 h-3 text-red-600" />
                            <span className="font-semibold text-black">End:</span> {formatDate(task.endDate)}
                          </div>
                        </div>
                        
                        {task.remarks && (
                          <div className="pt-2 border-t border-gray-200">
                            <span className="font-semibold text-black">Remarks:</span>
                            <p className="text-black mt-1">{task.remarks}</p>
                          </div>
                        )}
                      </div>

                      {task.subtasks && task.subtasks.length > 0 && (
                        <div className="border-t border-gray-200">
                          <button
                            onClick={() => toggleExpand(task._id)}
                            className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 hover:bg-gray-100 transition-all flex items-center justify-between font-semibold text-black text-xs sm:text-sm"
                          >
                            <span>Subtasks ({task.subtasks.length})</span>
                            {expanded === task._id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                          
                          {expanded === task._id && (
                            <div className="bg-white p-3 sm:p-4 space-y-3">
                              {task.subtasks.map((subtask, subIdx) => (
                                <div key={`${task._id}-sub-${subIdx}`} className="bg-gray-50 rounded-lg p-3 shadow-md border border-gray-200">
                                  <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-semibold text-black text-xs sm:text-sm">{subtask.title}</h4>
                                    {/* Status text set to black */}
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${subtask.status === "Completed" ? "bg-green-200 text-black" : subtask.status === "In Progress" ? "bg-yellow-200 text-black" : "bg-gray-200 text-black"}`}>
                                      {subtask.status}
                                    </span>
                                  </div>
                                  
                                  <div className="grid grid-cols-2 gap-2 text-xs text-black">
                                    <div><span className="font-semibold text-black">Completion:</span> <span className="font-bold text-black">{subtask.completion}%</span></div>
                                    <div><span className="font-semibold text-black">Time:</span> {subtask.timeSpent || "-"}</div>
                                  </div>
                                  
                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 mt-2 text-xs text-black">
                                    <div className="flex items-center gap-1">
                                      <CalendarDays className="w-3 h-3 text-green-600" />
                                      <span className="font-semibold">Start:</span> {formatDate(subtask.startDate)}
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <CalendarDays className="w-3 h-3 text-yellow-600" />
                                      <span className="font-semibold">Due:</span> {formatDate(subtask.dueDate)}
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <CalendarDays className="w-3 h-3 text-red-600" />
                                      <span className="font-semibold">End:</span> {formatDate(subtask.endDate)}
                                    </div>
                                  </div>
                                  
                                  {subtask.remarks && (
                                    <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-black">
                                      <span className="font-semibold text-black">Remarks:</span>
                                      <p className="text-black mt-1">{subtask.remarks}</p>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ViewTaskPage;