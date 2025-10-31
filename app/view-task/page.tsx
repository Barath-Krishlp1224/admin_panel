"use client";

import React, { useState, useMemo } from "react";
import * as XLSX from "xlsx";
import { Download, Search, Calendar, ChevronDown, ChevronUp, Clock, CalendarDays, Filter } from "lucide-react";

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
  const [searchCriteria, setSearchCriteria] = useState<"empId" | "project" | "">(""); 
  const [searchValue, setSearchValue] = useState(""); 
  const [tasks, setTasks] = useState<Task[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [timeRange, setTimeRange] = useState("today");
  const [selectedDate, setSelectedDate] = useState<string>("");

  const parseDate = (dateStr?: string) => new Date(dateStr || new Date());

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

  const filterTasksByDate = (tasks: Task[]) => {
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
  };

  const handleFetch = async () => {
    if (!searchCriteria || !searchValue) {
      setMessage("Please select a criteria and enter a search value.");
      setTasks([]);
      return;
    }

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
      setMessage("Server error");
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-10 lg:px-8 py-8 pt-20">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-1 h-12 bg-white rounded-full"></div>
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-white">
              Task Management
            </h1>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-6 mb-6 hover:shadow-2xl transition-all duration-300">
          <div className="flex items-center gap-2 mb-6">
            <Filter className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold text-slate-800">Search & Filter</h2>
          </div>

          <div className="space-y-5"> 
            {/* Search Criteria and Input */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                  <Search className="w-4 h-4 text-blue-600" />
                  Search By
                </label>
                <select
                  value={searchCriteria}
                  onChange={(e) => {
                    setSearchCriteria(e.target.value as "empId" | "project" | "");
                    setSearchValue("");
                  }}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-slate-700 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:border-slate-300"
                >
                  <option value="" disabled>Select Field</option>
                  <option value="empId">Employee ID</option>
                  <option value="project">Project Name</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Search Value
                </label>
                <input
                  type="text"
                  placeholder={getPlaceholderText()}
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  disabled={searchCriteria === ""}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-slate-700 placeholder-slate-400 disabled:bg-slate-50 disabled:cursor-not-allowed bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:border-slate-300"
                />
              </div>
            </div>

            {/* Time Range and Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  Time Range
                </label>
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-slate-700 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:border-slate-300"
                >
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last 1 Month</option>
                  <option value="year">Last 1 Year</option>
                  <option value="all">All Time</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-blue-600" />
                  Select Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-slate-700 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:border-slate-300"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <button
                onClick={handleFetch}
                disabled={!isFetchEnabled}
                className={`w-full font-semibold px-5 py-3.5 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl ${
                  isFetchEnabled
                    ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700 transform hover:-translate-y-0.5"
                    : "bg-slate-200 text-slate-400 cursor-not-allowed"
                }`}
              >
                <Search className="w-4 h-4" />
                Fetch Tasks
              </button>

              <button
                onClick={() => downloadTasks(tasks, `${searchCriteria ? `${searchCriteria}_${searchValue}` : "Filtered"}_Tasks.xlsx`)}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold px-5 py-3.5 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download Filtered
              </button>

              <button
                onClick={downloadAllTasks}
                className="w-full bg-gradient-to-r from-indigo-500 to-indigo-600 text-white font-semibold px-5 py-3.5 rounded-xl hover:from-indigo-600 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download All
              </button>
            </div>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className="bg-amber-50 border-l-4 border-amber-500 text-amber-800 px-5 py-4 rounded-xl mb-6 shadow-md">
            <p className="font-medium">{message}</p>
          </div>
        )}

        {/* Table Section - Desktop */}
        {tasks.length > 0 && (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 overflow-hidden hover:shadow-2xl transition-all duration-300">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-slate-50 to-blue-50 border-b-2 border-slate-200">
                      <th className="px-5 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Type</th>
                      <th className="px-5 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Date</th>
                      <th className="px-5 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Employee ID</th>
                      <th className="px-5 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Project</th>
                      <th className="px-5 py-4 text-center text-xs font-bold text-slate-700 uppercase tracking-wider">%</th>
                      <th className="px-5 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Status</th>
                      <th className="px-5 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Remarks</th>
                      <th className="px-5 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider" style={{minWidth: '100px'}}><CalendarDays className="inline w-3 h-3 mr-1"/>Start</th>
                      <th className="px-5 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider" style={{minWidth: '100px'}}><CalendarDays className="inline w-3 h-3 mr-1"/>Due</th>
                      <th className="px-5 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider" style={{minWidth: '100px'}}><CalendarDays className="inline w-3 h-3 mr-1"/>End</th>
                      <th className="px-5 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider" style={{minWidth: '100px'}}><Clock className="inline w-3 h-3 mr-1"/>Time</th>
                      <th className="px-5 py-4 text-center text-xs font-bold text-slate-700 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {tasks.map((task, idx) => (
                      <React.Fragment key={task._id}>
                        <tr className={`hover:bg-blue-50/50 transition-colors duration-200 ${idx % 2 === 0 ? "bg-white" : "bg-slate-50/30"}`}>
                          <td className="px-5 py-4 text-sm">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                              Task
                            </span>
                          </td>
                          <td className="px-5 py-4 text-sm text-slate-600">{formatDate(task.date)}</td>
                          <td className="px-5 py-4 text-sm font-semibold text-slate-800">{task.empId}</td>
                          <td className="px-5 py-4 text-sm text-slate-600">{task.project || "-"}</td>
                          <td className="px-5 py-4 text-center">
                            <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 text-sm font-bold text-blue-700">
                              {task.completion || "0"}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-sm">
                            <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${task.status === "Completed" ? "bg-emerald-100 text-emerald-700" : task.status === "In Progress" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-700"}`}>
                              {task.status || "N/A"}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-sm text-slate-600 max-w-xs truncate">{task.remarks || "-"}</td>
                          <td className="px-5 py-4 text-sm text-slate-600">{formatDate(task.startDate)}</td>
                          <td className="px-5 py-4 text-sm text-slate-600">{formatDate(task.dueDate)}</td>
                          <td className="px-5 py-4 text-sm text-slate-600">{formatDate(task.endDate)}</td>
                          <td className="px-5 py-4 text-sm text-slate-600">{task.timeSpent || "-"}</td>
                          <td className="px-5 py-4 text-center">
                            {task.subtasks && task.subtasks.length > 0 ? (
                              <button 
                                onClick={() => toggleExpand(task._id)} 
                                className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all duration-200"
                              >
                                {expanded === task._id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                              </button>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                        </tr>

                        {expanded === task._id && task.subtasks && task.subtasks.map((subtask, subIdx) => (
                          <tr key={`${task._id}-sub-${subIdx}`} className="bg-gradient-to-r from-slate-50 to-blue-50/30 border-l-4 border-blue-400">
                            <td className="px-5 py-3 text-sm pl-12">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">
                                Subtask
                              </span>
                            </td>
                            <td className="px-5 py-3 text-sm text-slate-600">{formatDate(task.date)}</td>
                            <td className="px-5 py-3 text-sm text-slate-600">{task.empId}</td>
                            <td className="px-5 py-3 text-sm text-slate-600">{task.project || "-"}</td>
                            <td className="px-5 py-3 text-sm font-semibold text-slate-800" colSpan={3}>{subtask.title}</td> 
                            <td className="px-5 py-3 text-center">
                              <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 text-xs font-bold text-indigo-700">
                                {subtask.completion}
                              </span>
                            </td>
                            <td className="px-5 py-3 text-sm">
                              <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${subtask.status === "Completed" ? "bg-emerald-100 text-emerald-700" : subtask.status === "In Progress" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-700"}`}>
                                {subtask.status}
                              </span>
                            </td>
                            <td className="px-5 py-3 text-sm text-slate-600 max-w-xs truncate">{subtask.remarks || "-"}</td>
                            <td className="px-5 py-3 text-sm text-slate-600">{formatDate(subtask.startDate)}</td>
                            <td className="px-5 py-3 text-sm text-slate-600">{formatDate(subtask.dueDate)}</td>
                            <td className="px-5 py-3 text-sm text-slate-600">{formatDate(subtask.endDate)}</td>
                            <td className="px-5 py-3 text-sm text-slate-600">{subtask.timeSpent || "-"}</td>
                            <td className="px-5 py-3"></td>
                          </tr>
                        ))}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile/Tablet Card View */}
            <div className="lg:hidden space-y-4">
              {tasks.map((task, idx) => (
                <div key={task._id} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden hover:shadow-2xl transition-all duration-300">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 border-b border-slate-200">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <span className="inline-flex items-center px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-full mb-2">
                          TASK
                        </span>
                        <h3 className="font-bold text-slate-800 text-base mt-2">Project: {task.project || "N/A"}</h3>
                        <p className="text-sm text-slate-600 mt-1 flex items-center gap-2">
                          <span className="inline-flex items-center px-2 py-0.5 bg-slate-200 rounded-full text-xs font-semibold">
                            {task.empId}
                          </span>
                        </p>
                      </div>
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${task.status === "Completed" ? "bg-emerald-100 text-emerald-700" : task.status === "In Progress" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-700"}`}>
                        {task.status || "N/A"}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-4 space-y-3 text-sm">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-50 rounded-lg p-3">
                        <span className="text-xs font-semibold text-slate-500 block mb-1">Date</span>
                        <span className="text-slate-800 font-medium">{formatDate(task.date)}</span>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-3">
                        <span className="text-xs font-semibold text-slate-500 block mb-1">Completion</span>
                        <span className="text-blue-700 font-bold text-lg">{task.completion || "0"}%</span>
                      </div>
                    </div>
                    
                    <div className="bg-slate-50 rounded-lg p-3">
                      <span className="text-xs font-semibold text-slate-500 block mb-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Time Spent
                      </span>
                      <span className="text-slate-800 font-medium">{task.timeSpent || "-"}</span>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
                      <div className="bg-emerald-50 rounded-lg p-2 flex flex-col">
                        <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1 mb-1">
                          <CalendarDays className="w-3 h-3" />
                          Start
                        </span>
                        <span className="text-slate-800 text-xs font-medium">{formatDate(task.startDate)}</span>
                      </div>
                      <div className="bg-amber-50 rounded-lg p-2 flex flex-col">
                        <span className="text-xs font-semibold text-amber-600 flex items-center gap-1 mb-1">
                          <CalendarDays className="w-3 h-3" />
                          Due
                        </span>
                        <span className="text-slate-800 text-xs font-medium">{formatDate(task.dueDate)}</span>
                      </div>
                      <div className="bg-rose-50 rounded-lg p-2 flex flex-col">
                        <span className="text-xs font-semibold text-rose-600 flex items-center gap-1 mb-1">
                          <CalendarDays className="w-3 h-3" />
                          End
                        </span>
                        <span className="text-slate-800 text-xs font-medium">{formatDate(task.endDate)}</span>
                      </div>
                    </div>
                    
                    {task.remarks && (
                      <div className="pt-3 border-t border-slate-200">
                        <span className="text-xs font-semibold text-slate-500 block mb-1">Remarks</span>
                        <p className="text-slate-700 text-sm leading-relaxed">{task.remarks}</p>
                      </div>
                    )}
                  </div>

                  {task.subtasks && task.subtasks.length > 0 && (
                    <div className="border-t border-slate-200">
                      <button
                        onClick={() => toggleExpand(task._id)}
                        className="w-full px-4 py-3 bg-gradient-to-r from-slate-50 to-blue-50 hover:from-slate-100 hover:to-blue-100 transition-all flex items-center justify-between font-semibold text-slate-700 text-sm"
                      >
                        <span className="flex items-center gap-2">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
                            {task.subtasks.length}
                          </span>
                          Subtasks
                        </span>
                        {expanded === task._id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </button>
                      
                      {expanded === task._id && (
                        <div className="bg-gradient-to-br from-slate-50 to-blue-50 p-4 space-y-3">
                          {task.subtasks.map((subtask, subIdx) => (
                            <div key={`${task._id}-sub-${subIdx}`} className="bg-white rounded-xl p-4 shadow-md border border-slate-100 hover:shadow-lg transition-all duration-200">
                              <div className="flex justify-between items-start mb-3">
                                <h4 className="font-semibold text-slate-800 text-sm flex-1 pr-2">{subtask.title}</h4>
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${subtask.status === "Completed" ? "bg-emerald-100 text-emerald-700" : subtask.status === "In Progress" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-700"}`}>
                                  {subtask.status}
                                </span>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-2 mb-3">
                                <div className="bg-indigo-50 rounded-lg p-2">
                                  <span className="text-xs font-semibold text-slate-500 block mb-1">Completion</span>
                                  <span className="text-indigo-700 font-bold text-base">{subtask.completion}%</span>
                                </div>
                                <div className="bg-slate-50 rounded-lg p-2">
                                  <span className="text-xs font-semibold text-slate-500 block mb-1 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    Time
                                  </span>
                                  <span className="text-slate-800 font-medium text-sm">{subtask.timeSpent || "-"}</span>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
                                <div className="bg-emerald-50 rounded-lg p-2 flex flex-col">
                                  <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1 mb-1">
                                    <CalendarDays className="w-3 h-3" />
                                    Start
                                  </span>
                                  <span className="text-slate-800 text-xs font-medium">{formatDate(subtask.startDate)}</span>
                                </div>
                                <div className="bg-amber-50 rounded-lg p-2 flex flex-col">
                                  <span className="text-xs font-semibold text-amber-600 flex items-center gap-1 mb-1">
                                    <CalendarDays className="w-3 h-3" />
                                    Due
                                  </span>
                                  <span className="text-slate-800 text-xs font-medium">{formatDate(subtask.dueDate)}</span>
                                </div>
                                <div className="bg-rose-50 rounded-lg p-2 flex flex-col">
                                  <span className="text-xs font-semibold text-rose-600 flex items-center gap-1 mb-1">
                                    <CalendarDays className="w-3 h-3" />
                                    End
                                  </span>
                                  <span className="text-slate-800 text-xs font-medium">{formatDate(subtask.endDate)}</span>
                                </div>
                              </div>
                              
                              {subtask.remarks && (
                                <div className="pt-2 border-t border-slate-200">
                                  <span className="text-xs font-semibold text-slate-500 block mb-1">Remarks</span>
                                  <p className="text-slate-700 text-xs leading-relaxed">{subtask.remarks}</p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
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