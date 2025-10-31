"use client"
import React, { useState, useMemo, useEffect, useCallback } from "react";
import * as XLSX from "xlsx";
import { Download, Search, Calendar, ChevronDown, ChevronUp, Clock, CalendarDays, Edit2, Save, X, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

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

const ViewTaskPage: React.FC = () => {
  const router = useRouter();
  const [searchCriteria, setSearchCriteria] = useState<"empId" | "project" | "">("");
  const [searchValue, setSearchValue] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [message, setMessage] = useState("Loading your tasks automatically...");
  const [timeRange, setTimeRange] = useState("all");
  const [selectedDate, setSelectedDate] = useState<string>("");

  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Task | null>(null);

  const parseDate = (dateStr?: string) => new Date(dateStr || new Date());

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

  const startEditing = (task: Task) => {
    setEditingTaskId(task._id);
    setEditFormData({ ...task });
  };

  const cancelEditing = () => {
    setEditingTaskId(null);
    setEditFormData(null);
  };

  const addSubtask = () => {
    if (editFormData) {
      const newSubtask: Subtask = {
        title: "New Subtask",
        status: "Pending",
        completion: 0,
        remarks: "",
        startDate: new Date().toISOString().split('T')[0],
        dueDate: "",
        endDate: "",
        timeSpent: "",
      };
      setEditFormData({
        ...editFormData,
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
        handleFetch();
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
    <div className="min-h-screen ">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8 pt-16 sm:pt-20 md:pt-24">
        <div className="mt-[10%]">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-slate-800 via-blue-900 to-slate-900 bg-clip-text text-white mb-10">
            Employee Tasks Dashboard
          </h1>
        </div>

        {message && (
          <div className="bg-white/80 backdrop-blur-sm border-l-4 border-blue-500 text-slate-800 px-6 py-4 rounded-xl mb-6 font-medium shadow-lg text-sm sm:text-base">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              {message}
            </div>
          </div>
        )}

        {tasks.length > 0 && (
          <>
            <div className="hidden lg:block bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-slate-800 to-blue-900 border-b border-slate-700">
                      <th className="px-4 xl:px-6 py-4 xl:py-5 text-left text-xs xl:text-sm font-bold text-white uppercase tracking-wider">Type</th>
                      <th className="px-4 xl:px-6 py-4 xl:py-5 text-left text-xs xl:text-sm font-bold text-white uppercase tracking-wider">Date</th>
                      <th className="px-4 xl:px-6 py-4 xl:py-5 text-left text-xs xl:text-sm font-bold text-white uppercase tracking-wider">Employee ID</th>
                      <th className="px-4 xl:px-6 py-4 xl:py-5 text-left text-xs xl:text-sm font-bold text-white uppercase tracking-wider">Project</th>
                      <th className="px-4 xl:px-6 py-4 xl:py-5 text-center text-xs xl:text-sm font-bold text-white uppercase tracking-wider">Progress</th>
                      <th className="px-4 xl:px-6 py-4 xl:py-5 text-left text-xs xl:text-sm font-bold text-white uppercase tracking-wider">Status</th>
                      <th className="px-4 xl:px-6 py-4 xl:py-5 text-left text-xs xl:text-sm font-bold text-white uppercase tracking-wider">Remarks</th>
                      <th className="px-4 xl:px-6 py-4 xl:py-5 text-left text-xs xl:text-sm font-bold text-white uppercase tracking-wider" style={{minWidth: '120px'}}><CalendarDays className="inline w-4 h-4 mr-1"/>Start</th>
                      <th className="px-4 xl:px-6 py-4 xl:py-5 text-left text-xs xl:text-sm font-bold text-white uppercase tracking-wider" style={{minWidth: '120px'}}><CalendarDays className="inline w-4 h-4 mr-1"/>Due</th>
                      <th className="px-4 xl:px-6 py-4 xl:py-5 text-left text-xs xl:text-sm font-bold text-white uppercase tracking-wider" style={{minWidth: '120px'}}><CalendarDays className="inline w-4 h-4 mr-1"/>End</th>
                      <th className="px-4 xl:px-6 py-4 xl:py-5 text-left text-xs xl:text-sm font-bold text-white uppercase tracking-wider" style={{minWidth: '100px'}}><Clock className="inline w-4 h-4 mr-1"/>Time</th>
                      <th className="px-4 xl:px-6 py-4 xl:py-5 text-center text-xs xl:text-sm font-bold text-white uppercase tracking-wider">Subtasks</th>
                      <th className="px-4 xl:px-6 py-4 xl:py-5 text-center text-xs xl:text-sm font-bold text-white uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedTasks.map((task, idx) => (
                      <React.Fragment key={task._id}>
                        {editingTaskId === task._id ? (
                          <tr className="bg-blue-50/80 backdrop-blur-sm border-b border-blue-200 hover:bg-blue-100/80 transition-all duration-200">
                            <td className="px-4 xl:px-6 py-3 xl:py-4 text-xs xl:text-sm font-bold text-blue-900">
                              <span className="px-3 py-1 bg-blue-600 text-white rounded-full text-xs font-semibold">TASK</span>
                            </td>
                            <td className="px-4 xl:px-6 py-3 xl:py-4 text-xs xl:text-sm text-slate-700 font-medium">{formatDate(task.date)}</td>
                            <td className="px-4 xl:px-6 py-3 xl:py-4 text-xs xl:text-sm font-semibold text-slate-800">{task.empId}</td>
                            <td className="px-4 xl:px-6 py-3 xl:py-4">
                              <input
                                type="text"
                                value={editFormData?.project || ""}
                                onChange={(e) => handleEditChange("project", e.target.value)}
                                className="w-full px-3 py-2 border-2 border-blue-300 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                              />
                            </td>
                            <td className="px-4 xl:px-6 py-3 xl:py-4">
                              <input
                                type="number"
                                value={editFormData?.completion || ""}
                                onChange={(e) => handleEditChange("completion", e.target.value)}
                                className="w-full px-3 py-2 border-2 border-blue-300 rounded-lg text-xs text-center text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                min="0"
                                max="100"
                              />
                            </td>
                            <td className="px-4 xl:px-6 py-3 xl:py-4">
                              <select
                                value={editFormData?.status || ""}
                                onChange={(e) => handleEditChange("status", e.target.value)}
                                className="w-full px-3 py-2 border-2 border-blue-300 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
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
                                className="w-full px-3 py-2 border-2 border-blue-300 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                              />
                            </td>
                            <td className="px-4 xl:px-6 py-3 xl:py-4">
                              <input
                                type="date"
                                value={editFormData?.startDate?.split("T")[0] || ""}
                                onChange={(e) => handleEditChange("startDate", e.target.value)}
                                className="w-full px-3 py-2 border-2 border-blue-300 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                              />
                            </td>
                            <td className="px-4 xl:px-6 py-3 xl:py-4">
                              <input
                                type="date"
                                value={editFormData?.dueDate?.split("T")[0] || ""}
                                onChange={(e) => handleEditChange("dueDate", e.target.value)}
                                className="w-full px-3 py-2 border-2 border-blue-300 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                              />
                            </td>
                            <td className="px-4 xl:px-6 py-3 xl:py-4">
                              <input
                                type="date"
                                value={editFormData?.endDate?.split("T")[0] || ""}
                                onChange={(e) => handleEditChange("endDate", e.target.value)}
                                className="w-full px-3 py-2 border-2 border-blue-300 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                              />
                            </td>
                            <td className="px-4 xl:px-6 py-3 xl:py-4">
                              <input
                                type="text"
                                value={editFormData?.timeSpent || ""}
                                onChange={(e) => handleEditChange("timeSpent", e.target.value)}
                                className="w-full px-3 py-2 border-2 border-blue-300 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                placeholder="e.g., 2h 30m"
                              />
                            </td>
                            <td className="px-4 xl:px-6 py-3 xl:py-4 text-center">
                              {(task.subtasks && task.subtasks.length > 0) || (editFormData?.subtasks && editFormData.subtasks.length > 0) ? (
                                <button onClick={() => toggleExpand(task._id)} className="text-blue-700 hover:text-blue-900 transition-colors p-2 hover:bg-blue-100 rounded-lg">
                                  {expanded === task._id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                </button>
                              ) : "-"}
                            </td>
                            <td className="px-4 xl:px-6 py-3 xl:py-4 text-center">
                              <div className="flex gap-2 justify-center">
                                <button
                                  onClick={saveEdit}
                                  className="p-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all shadow-md hover:shadow-lg transform hover:scale-105"
                                  title="Save"
                                >
                                  <Save className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={cancelEditing}
                                  className="p-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all shadow-md hover:shadow-lg transform hover:scale-105"
                                  title="Cancel"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={addSubtask}
                                  className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-md hover:shadow-lg transform hover:scale-105"
                                  title="Add Subtask"
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          <tr className={`border-b border-slate-200 hover:bg-slate-50/80 transition-all duration-200 ${idx % 2 === 0 ? "bg-white/80" : "bg-slate-50/50"}`}>
                            <td className="px-4 xl:px-6 py-3 xl:py-4 text-xs xl:text-sm font-bold">
                              <span className="px-3 py-1 bg-gradient-to-r from-slate-700 to-slate-800 text-white rounded-full text-xs font-semibold shadow-sm">TASK</span>
                            </td>
                            <td className="px-4 xl:px-6 py-3 xl:py-4 text-xs xl:text-sm text-slate-700 font-medium">{formatDate(task.date)}</td>
                            <td className="px-4 xl:px-6 py-3 xl:py-4 text-xs xl:text-sm font-semibold text-slate-800">{task.empId}</td>
                            <td className="px-4 xl:px-6 py-3 xl:py-4 text-xs xl:text-sm text-slate-700 font-medium">{task.project || "-"}</td>
                            <td className="px-4 xl:px-6 py-3 xl:py-4 text-center text-xs xl:text-sm">
                              <span className="font-bold text-blue-700 bg-blue-100 px-3 py-1 rounded-full">{task.completion || "0"}%</span>
                            </td>
                            <td className="px-4 xl:px-6 py-3 xl:py-4 text-xs xl:text-sm">
                              <span className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-sm ${
                                task.status === "Completed"
                                  ? "bg-gradient-to-r from-green-400 to-green-500 text-white"
                                  : task.status === "In Progress"
                                  ? "bg-gradient-to-r from-amber-400 to-amber-500 text-white"
                                  : "bg-gradient-to-r from-slate-300 to-slate-400 text-slate-800"
                              }`}>
                                {task.status || "N/A"}
                              </span>
                            </td>
                            <td className="px-4 xl:px-6 py-3 xl:py-4 text-xs xl:text-sm text-slate-600">{task.remarks || "-"}</td>
                            <td className="px-4 xl:px-6 py-3 xl:py-4 text-xs xl:text-sm text-slate-700 font-medium">{formatDate(task.startDate)}</td>
                            <td className="px-4 xl:px-6 py-3 xl:py-4 text-xs xl:text-sm text-slate-700 font-medium">{formatDate(task.dueDate)}</td>
                            <td className="px-4 xl:px-6 py-3 xl:py-4 text-xs xl:text-sm text-slate-700 font-medium">{formatDate(task.endDate)}</td>
                            <td className="px-4 xl:px-6 py-3 xl:py-4 text-xs xl:text-sm text-slate-700 font-medium">{task.timeSpent || "-"}</td>
                            <td className="px-4 xl:px-6 py-3 xl:py-4 text-center">
                              {task.subtasks && task.subtasks.length > 0 ? (
                                <button onClick={() => toggleExpand(task._id)} className="text-slate-700 hover:text-slate-900 transition-colors p-2 hover:bg-slate-100 rounded-lg">
                                  {expanded === task._id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                </button>
                              ) : "-"}
                            </td>
                            <td className="px-4 xl:px-6 py-3 xl:py-4 text-center">
                              <button
                                onClick={() => startEditing(task)}
                                className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-md hover:shadow-lg transform hover:scale-105"
                                title="Edit Task"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        )}

                        {expanded === task._id && editFormData?.subtasks && editingTaskId === task._id ? (
                            editFormData.subtasks.map((subtask, subIdx) => (
                                <tr key={`${task._id}-sub-${subIdx}`} className="bg-gradient-to-r from-slate-100 to-blue-50 border-b border-slate-200">
                                    <td className="px-4 xl:px-6 py-2 xl:py-3 text-xs xl:text-sm font-bold pl-8 xl:pl-12">
                                      <span className="px-3 py-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full text-xs font-semibold shadow-sm">SUB</span>
                                    </td>
                                    <td className="px-4 xl:px-6 py-2 xl:py-3 text-xs xl:text-sm text-slate-700">{formatDate(task.date)}</td>
                                    <td className="px-4 xl:px-6 py-2 xl:py-3 text-xs xl:text-sm text-slate-700">{task.empId}</td>
                                    <td className="px-4 xl:px-6 py-2 xl:py-3 text-xs xl:text-sm text-slate-700">{task.project || "-"}</td>

                                    <td className="px-4 xl:px-6 py-2 xl:py-3" colSpan={3}>
                                        <input
                                            type="text"
                                            value={subtask.title || ""}
                                            onChange={(e) => handleSubtaskChange(subIdx, "title", e.target.value)}
                                            className="w-full px-3 py-2 border-2 border-blue-300 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                        />
                                    </td>
                                    <td className="px-4 xl:px-6 py-2 xl:py-3">
                                        <input
                                            type="number"
                                            value={subtask.completion || 0}
                                            onChange={(e) => handleSubtaskChange(subIdx, "completion", Number(e.target.value))}
                                            className="w-full px-3 py-2 border-2 border-blue-300 rounded-lg text-xs text-center text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                            min="0"
                                            max="100"
                                        />
                                    </td>
                                    <td className="px-4 xl:px-6 py-2 xl:py-3">
                                        <select
                                            value={subtask.status || ""}
                                            onChange={(e) => handleSubtaskChange(subIdx, "status", e.target.value)}
                                            className="w-full px-3 py-2 border-2 border-blue-300 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                        >
                                            <option value="Pending">Pending</option>
                                            <option value="In Progress">In Progress</option>
                                            <option value="Completed">Completed</option>
                                        </select>
                                    </td>
                                    <td className="px-4 xl:px-6 py-2 xl:py-3">
                                        <input
                                            type="text"
                                            value={subtask.remarks || ""}
                                            onChange={(e) => handleSubtaskChange(subIdx, "remarks", e.target.value)}
                                            className="w-full px-3 py-2 border-2 border-blue-300 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                        />
                                    </td>
                                    <td className="px-4 xl:px-6 py-2 xl:py-3">
                                        <input
                                            type="date"
                                            value={subtask.startDate?.split("T")[0] || ""}
                                            onChange={(e) => handleSubtaskChange(subIdx, "startDate", e.target.value)}
                                            className="w-full px-3 py-2 border-2 border-blue-300 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                        />
                                    </td>
                                    <td className="px-4 xl:px-6 py-2 xl:py-3">
                                        <input
                                            type="date"
                                            value={subtask.dueDate?.split("T")[0] || ""}
                                            onChange={(e) => handleSubtaskChange(subIdx, "dueDate", e.target.value)}
                                            className="w-full px-3 py-2 border-2 border-blue-300 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                        />
                                    </td>
                                    <td className="px-4 xl:px-6 py-2 xl:py-3">
                                        <input
                                            type="date"
                                            value={subtask.endDate?.split("T")[0] || ""}
                                            onChange={(e) => handleSubtaskChange(subIdx, "endDate", e.target.value)}
                                            className="w-full px-3 py-2 border-2 border-blue-300 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                        />
                                    </td>
                                    <td className="px-4 xl:px-6 py-2 xl:py-3">
                                        <input
                                            type="text"
                                            value={subtask.timeSpent || ""}
                                            onChange={(e) => handleSubtaskChange(subIdx, "timeSpent", e.target.value)}
                                            className="w-full px-3 py-2 border-2 border-blue-300 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                        />
                                    </td>
                                    <td className="px-4 xl:px-6 py-2 xl:py-3"></td>
                                    <td className="px-4 xl:px-6 py-2 xl:py-3"></td>
                                </tr>
                            ))
                        ) : (
                          expanded === task._id && task.subtasks && task.subtasks.map((subtask, subIdx) => (
                            <tr key={`${task._id}-sub-${subIdx}`} className="bg-gradient-to-r from-slate-50 to-blue-50/50 border-b border-slate-200">
                              <td className="px-4 xl:px-6 py-2 xl:py-3 text-xs xl:text-sm font-bold pl-8 xl:pl-12">
                                <span className="px-3 py-1 bg-gradient-to-r from-slate-600 to-blue-700 text-white rounded-full text-xs font-semibold shadow-sm">SUB</span>
                              </td>
                              <td className="px-4 xl:px-6 py-2 xl:py-3 text-xs xl:text-sm text-slate-700">{formatDate(task.date)}</td>
                              <td className="px-4 xl:px-6 py-2 xl:py-3 text-xs xl:text-sm text-slate-700">{task.empId}</td>
                              <td className="px-4 xl:px-6 py-2 xl:py-3 text-xs xl:text-sm text-slate-700">{task.project || "-"}</td>

                              <td className="px-4 xl:px-6 py-2 xl:py-3 text-xs xl:text-sm text-slate-800 font-semibold" colSpan={3}>{subtask.title}</td>
                              <td className="px-4 xl:px-6 py-2 xl:py-3 text-center text-xs xl:text-sm">
                                <span className="font-bold text-blue-700 bg-blue-100 px-3 py-1 rounded-full">{subtask.completion}%</span>
                              </td>
                              <td className="px-4 xl:px-6 py-2 xl:py-3 text-xs xl:text-sm">
                                <span className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-sm ${
                                  subtask.status === "Completed"
                                    ? "bg-gradient-to-r from-green-400 to-green-500 text-white"
                                    : subtask.status === "In Progress"
                                    ? "bg-gradient-to-r from-amber-400 to-amber-500 text-white"
                                    : "bg-gradient-to-r from-slate-300 to-slate-400 text-slate-800"
                                }`}>
                                  {subtask.status}
                                </span>
                              </td>
                              <td className="px-4 xl:px-6 py-2 xl:py-3 text-xs xl:text-sm text-slate-600">{subtask.remarks || "-"}</td>
                              <td className="px-4 xl:px-6 py-2 xl:py-3 text-xs xl:text-sm text-slate-700">{formatDate(subtask.startDate)}</td>
                              <td className="px-4 xl:px-6 py-2 xl:py-3 text-xs xl:text-sm text-slate-700">{formatDate(subtask.dueDate)}</td>
                              <td className="px-4 xl:px-6 py-2 xl:py-3 text-xs xl:text-sm text-slate-700">{formatDate(subtask.endDate)}</td>
                              <td className="px-4 xl:px-6 py-2 xl:py-3 text-xs xl:text-sm text-slate-700">{subtask.timeSpent || "-"}</td>
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

            <div className="lg:hidden space-y-4">
              {sortedTasks.map((task, idx) => (
                <div key={task._id} className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200 overflow-hidden hover:shadow-2xl transition-all duration-300">
                  {editingTaskId === task._id ? (
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 p-4">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                          <Edit2 className="w-5 h-5 text-blue-600" />
                          Edit Task
                        </h3>
                        <div className="flex gap-2">
                          <button
                            onClick={saveEdit}
                            className="p-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 shadow-md hover:shadow-lg transform hover:scale-105 transition-all"
                          >
                            <Save className="w-5 h-5" />
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="p-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 shadow-md hover:shadow-lg transform hover:scale-105 transition-all"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1">Project</label>
                          <input
                            type="text"
                            value={editFormData?.project || ""}
                            onChange={(e) => handleEditChange("project", e.target.value)}
                            className="w-full px-3 py-2 border-2 border-blue-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Completion %</label>
                            <input
                              type="number"
                              value={editFormData?.completion || ""}
                              onChange={(e) => handleEditChange("completion", e.target.value)}
                              className="w-full px-3 py-2 border-2 border-blue-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                              min="0"
                              max="100"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Status</label>
                            <select
                              value={editFormData?.status || ""}
                              onChange={(e) => handleEditChange("status", e.target.value)}
                              className="w-full px-3 py-2 border-2 border-blue-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            >
                              <option value="Pending">Pending</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Completed">Completed</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1">Remarks</label>
                          <textarea
                            value={editFormData?.remarks || ""}
                            onChange={(e) => handleEditChange("remarks", e.target.value)}
                            className="w-full px-3 py-2 border-2 border-blue-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            rows={2}
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Start Date</label>
                            <input
                              type="date"
                              value={editFormData?.startDate?.split("T")[0] || ""}
                              onChange={(e) => handleEditChange("startDate", e.target.value)}
                              className="w-full px-3 py-2 border-2 border-blue-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Due Date</label>
                            <input
                              type="date"
                              value={editFormData?.dueDate?.split("T")[0] || ""}
                              onChange={(e) => handleEditChange("dueDate", e.target.value)}
                              className="w-full px-3 py-2 border-2 border-blue-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">End Date</label>
                            <input
                              type="date"
                              value={editFormData?.endDate?.split("T")[0] || ""}
                              onChange={(e) => handleEditChange("endDate", e.target.value)}
                              className="w-full px-3 py-2 border-2 border-blue-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1">Time Spent</label>
                          <input
                            type="text"
                            value={editFormData?.timeSpent || ""}
                            onChange={(e) => handleEditChange("timeSpent", e.target.value)}
                            className="w-full px-3 py-2 border-2 border-blue-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            placeholder="e.g., 2h 30m"
                          />
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-blue-300">
                        <h4 className="font-bold text-sm mb-3 text-slate-800 flex justify-between items-center">
                            <span>Subtasks</span>
                            <button
                                onClick={addSubtask}
                                className="px-3 py-1 text-xs bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 flex items-center gap-1 shadow-md hover:shadow-lg transform hover:scale-105 transition-all"
                                title="Add Subtask"
                            >
                                <Plus className="w-3 h-3" /> Add
                            </button>
                        </h4>
                        <div className="space-y-3">
                          {(editFormData?.subtasks || []).map((subtask, subIdx) => (
                            <div key={subIdx} className="bg-white p-3 rounded-lg border-2 border-blue-200 shadow-sm">
                              <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Title</label>
                                <input
                                  type="text"
                                  value={subtask.title || ""}
                                  onChange={(e) => handleSubtaskChange(subIdx, "title", e.target.value)}
                                  className="w-full px-2 py-1 border-2 border-blue-300 rounded text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-2 mt-2">
                                <div>
                                  <label className="block text-xs font-semibold text-slate-700 mb-1">Completion %</label>
                                  <input
                                    type="number"
                                    value={subtask.completion || 0}
                                    onChange={(e) => handleSubtaskChange(subIdx, "completion", Number(e.target.value))}
                                    className="w-full px-2 py-1 border-2 border-blue-300 rounded text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                    min="0"
                                    max="100"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                                  <select
                                    value={subtask.status || ""}
                                    onChange={(e) => handleSubtaskChange(subIdx, "status", e.target.value)}
                                    className="w-full px-2 py-1 border-2 border-blue-300 rounded text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                  >
                                    <option value="Pending">Pending</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Completed">Completed</option>
                                  </select>
                                </div>
                              </div>
                              <div className="mt-2">
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Remarks</label>
                                <input
                                  type="text"
                                  value={subtask.remarks || ""}
                                  onChange={(e) => handleSubtaskChange(subIdx, "remarks", e.target.value)}
                                  className="w-full px-2 py-1 border-2 border-blue-300 rounded text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                />
                              </div>
                              <div className="grid grid-cols-3 gap-2 mt-2">
                                <div>
                                  <label className="block text-xs font-semibold text-slate-700 mb-1">Start</label>
                                  <input
                                    type="date"
                                    value={subtask.startDate?.split("T")[0] || ""}
                                    onChange={(e) => handleSubtaskChange(subIdx, "startDate", e.target.value)}
                                    className="w-full px-2 py-1 border-2 border-blue-300 rounded text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-semibold text-slate-700 mb-1">Due</label>
                                  <input
                                    type="date"
                                    value={subtask.dueDate?.split("T")[0] || ""}
                                    onChange={(e) => handleSubtaskChange(subIdx, "dueDate", e.target.value)}
                                    className="w-full px-2 py-1 border-2 border-blue-300 rounded text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-semibold text-slate-700 mb-1">End</label>
                                  <input
                                    type="date"
                                    value={subtask.endDate?.split("T")[0] || ""}
                                    onChange={(e) => handleSubtaskChange(subIdx, "endDate", e.target.value)}
                                    className="w-full px-2 py-1 border-2 border-blue-300 rounded text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                  />
                                </div>
                              </div>
                              <div className="mt-2">
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Time Spent</label>
                                <input
                                  type="text"
                                  value={subtask.timeSpent || ""}
                                  onChange={(e) => handleSubtaskChange(subIdx, "timeSpent", e.target.value)}
                                  className="w-full px-2 py-1 border-2 border-blue-300 rounded text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                  placeholder="e.g., 1h 15m"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="bg-gradient-to-r from-slate-800 to-blue-900 p-3 sm:p-4 border-b border-slate-700">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="inline-block px-3 py-1 bg-white text-slate-800 text-xs font-bold rounded-full mb-2 shadow-sm">TASK</span>
                            <h3 className="font-bold text-white text-sm sm:text-base">{task.project || "N/A"}</h3>
                            <p className="text-xs sm:text-sm text-blue-100 mt-1">Emp ID: {task.empId}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-bold shadow-md whitespace-nowrap ${
                              task.status === "Completed"
                                ? "bg-gradient-to-r from-green-400 to-green-500 text-white"
                                : task.status === "In Progress"
                                ? "bg-gradient-to-r from-amber-400 to-amber-500 text-white"
                                : "bg-gradient-to-r from-slate-300 to-slate-400 text-slate-800"
                            }`}>
                              {task.status || "N/A"}
                            </span>
                            <button
                              onClick={() => startEditing(task)}
                              className="p-1.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 shadow-md hover:shadow-lg transform hover:scale-105 transition-all flex-shrink-0"
                              title="Edit Task"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="p-3 sm:p-4 space-y-2 text-xs sm:text-sm">
                        <div className="grid grid-cols-2 gap-2 text-slate-700">
                          <div><span className="font-semibold text-slate-800">Date:</span> {formatDate(task.date)}</div>
                          <div><span className="font-semibold text-slate-800">Completion:</span> <span className="font-bold text-blue-700">{task.completion || "0"}%</span></div>
                          <div><span className="font-semibold text-slate-800">Time Spent:</span> {task.timeSpent || "-"}</div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-200">
                          <div className="flex items-center gap-1 text-slate-700">
                            <CalendarDays className="w-3 h-3 text-green-600" />
                            <span className="font-semibold text-slate-800">Start:</span> {formatDate(task.startDate)}
                          </div>
                          <div className="flex items-center gap-1 text-slate-700">
                            <CalendarDays className="w-3 h-3 text-amber-600" />
                            <span className="font-semibold text-slate-800">Due:</span> {formatDate(task.dueDate)}
                          </div>
                          <div className="flex items-center gap-1 text-slate-700">
                            <CalendarDays className="w-3 h-3 text-red-600" />
                            <span className="font-semibold text-slate-800">End:</span> {formatDate(task.endDate)}
                          </div>
                        </div>

                        {task.remarks && (
                          <div className="pt-2 border-t border-slate-200">
                            <span className="font-semibold text-slate-800">Remarks:</span>
                            <p className="text-slate-700 mt-1">{task.remarks}</p>
                          </div>
                        )}
                      </div>

                      {task.subtasks && task.subtasks.length > 0 && (
                        <div className="border-t border-slate-200">
                          <button
                            onClick={() => toggleExpand(task._id)}
                            className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-r from-slate-50 to-blue-50 hover:from-slate-100 hover:to-blue-100 transition-all flex items-center justify-between font-semibold text-slate-800 text-xs sm:text-sm shadow-inner"
                          >
                            <span>Subtasks ({task.subtasks.length})</span>
                            {expanded === task._id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>

                          {expanded === task._id && (
                            <div className="bg-slate-50 p-3 sm:p-4 space-y-3">
                              {task.subtasks.map((subtask, subIdx) => (
                                <div key={`${task._id}-sub-${subIdx}`} className="bg-white rounded-xl p-3 shadow-md border border-slate-200 hover:shadow-lg transition-all">
                                  <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-semibold text-slate-800 text-xs sm:text-sm">{subtask.title}</h4>
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold shadow-sm ${
                                      subtask.status === "Completed"
                                        ? "bg-gradient-to-r from-green-400 to-green-500 text-white"
                                        : subtask.status === "In Progress"
                                        ? "bg-gradient-to-r from-amber-400 to-amber-500 text-white"
                                        : "bg-gradient-to-r from-slate-300 to-slate-400 text-slate-800"
                                    }`}>
                                      {subtask.status}
                                    </span>
                                  </div>

                                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-700">
                                    <div><span className="font-semibold text-slate-800">Completion:</span> <span className="font-bold text-blue-700">{subtask.completion}%</span></div>
                                    <div><span className="font-semibold text-slate-800">Time:</span> {subtask.timeSpent || "-"}</div>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 mt-2 text-xs text-slate-700">
                                    <div className="flex items-center gap-1">
                                      <CalendarDays className="w-3 h-3 text-green-600" />
                                      <span className="font-semibold">Start:</span> {formatDate(subtask.startDate)}
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <CalendarDays className="w-3 h-3 text-amber-600" />
                                      <span className="font-semibold">Due:</span> {formatDate(subtask.dueDate)}
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <CalendarDays className="w-3 h-3 text-red-600" />
                                      <span className="font-semibold">End:</span> {formatDate(subtask.endDate)}
                                    </div>
                                  </div>

                                  {subtask.remarks && (
                                    <div className="mt-2 pt-2 border-t border-slate-200 text-xs">
                                      <span className="font-semibold text-slate-800">Remarks:</span>
                                      <p className="text-slate-700 mt-1">{subtask.remarks}</p>
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
