"use client";

import React, { useState, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer,
} from "recharts";
import { Search, Calendar, ChevronDown, ChevronUp, TrendingUp, CheckCircle2, Clock, ListChecks } from "lucide-react";

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
  date?: string; 
  empId: string;
  project?: string;
  completion?: string | number;
  status?: string;
  remarks?: string;
  subtasks?: Subtask[];
  startDate?: string;
  dueDate?: string;
  endDate?: string;
  timeSpent?: string;
}

interface ProjectStatusData {
  project: string;
  Completed: number;
  "In Progress": number;
  Pending: number;
  [key: string]: any;
}

interface CompletionPieData {
  name: string;
  value: number;
  [key: string]: any;
}

const ViewTaskPage: React.FC = () => {
  const [searchCriteria, setSearchCriteria] = useState<"empId" | "project" | "">(""); 
  const [searchValue, setSearchValue] = useState(""); 
  const [tasks, setTasks] = useState<Task[]>([]);
  const [message, setMessage] = useState("");
  const [timeRange, setTimeRange] = useState("today");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [expandedTask, setExpandedTask] = useState<string | null>(null);

  const parseDate = (dateStr?: string) => {
    if (!dateStr) return new Date(0); 
    return new Date(dateStr.split("T")[0]);
  };

  const PIE_COLORS = ["#4f46e5", "#e5e7eb"]; 
  const SUBTASK_PIE_COLORS = ["#10b981", "#3b82f6", "#f59e0b"]; 

  const isFetchEnabled = useMemo(() => {
    return searchCriteria.trim() !== "" && searchValue.trim() !== "";
  }, [searchCriteria, searchValue]);

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
          const y = new Date(now);
          y.setDate(now.getDate() - 1);
          return isSameDay(taskDate, y);
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
    if (!isFetchEnabled) {
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
        const allTasksForEmp = Array.isArray(data.tasks) ? data.tasks : [];
        const filtered = filterTasksByDate(allTasksForEmp);
        setTasks(filtered);
        setMessage(filtered.length === 0 ? `No tasks found for selected criteria and range.` : "");
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

  const getPlaceholderText = () => {
    switch (searchCriteria) {
      case 'empId':
        return 'Enter Employee ID';
      case 'project':
        return 'Enter Project Name';
      default:
        return 'Select a search field first';
    }
  };

  const projectStatusData = useMemo((): ProjectStatusData[] => {
    const map = new Map<string, { Completed: number; "In Progress": number; Pending: number }>();

    tasks.forEach((task) => {
      const projectName = task.project || "Unassigned"; 
      
      if (!map.has(projectName)) {
        map.set(projectName, { Completed: 0, "In Progress": 0, Pending: 0 });
      }
      
      const counts = map.get(projectName)!;
      const status = task.status || "Pending"; 
      
      if (status === "Completed") {
        counts["Completed"]++;
      } else if (status === "In Progress") {
        counts["In Progress"]++;
      } else {
        counts["Pending"]++;
      }
    });

    return Array.from(map.entries()).map(([project, counts]) => ({
      project,
      ...counts,
    }));
  }, [tasks]);

  const overallCompletionData = useMemo((): CompletionPieData[] => {
    if (tasks.length === 0) return [];
    let totalCompletion = 0;
    let valid = 0;

    tasks.forEach((t) => {
      const completionStr = String(t.completion || "0").replace("%", "").trim();
      const val = parseFloat(completionStr);
      
      if (!isNaN(val)) {
        totalCompletion += val;
        valid++;
      }
    });

    const avg = valid > 0 ? totalCompletion / valid : 0;
    const avgRounded = Math.round(avg);
    const remainingRounded = Math.round(100 - avg);
    
    return [
      { name: "Average Completion", value: avgRounded },
      { name: "Remaining", value: remainingRounded > 0 ? remainingRounded : 0 },
    ];
  }, [tasks]);

  const subtasksStatusData = useMemo(() => {
    let completed = 0;
    let inProgress = 0;
    let pending = 0;

    tasks.forEach((task) => {
      if (task.subtasks && task.subtasks.length > 0) {
        task.subtasks.forEach((st) => {
          const status = st.status || "Pending";
          if (status === "Completed") completed++;
          else if (status === "In Progress") inProgress++;
          else pending++;
        });
      }
    });

    return [
      { name: "Completed", value: completed },
      { name: "In Progress", value: inProgress },
      { name: "Pending", value: pending },
    ];
  }, [tasks]);

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "Completed").length;
  const avgCompletion =
    overallCompletionData.find((d) => d.name === "Average Completion")?.value || 0;
  const totalSubtasks = subtasksStatusData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="min-h-screen mt-50 ">
      <div className="w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
          {/* Header */}
          <div className="mb-8 sm:mb-10">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 bg-clip-text text-white mb-2">
              Employee Task Dashboard
            </h1>
          </div>

          {/* Filters Section */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 sm:p-8 mb-8">
            <h2 className="text-lg font-semibold text-slate-800 mb-6 flex items-center gap-2">
              <Search className="w-5 h-5 text-indigo-600" />
              Search & Filter
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-5">
              {/* Search Criteria */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">
                  Search By
                </label>
                <select
                  value={searchCriteria}
                  onChange={(e) => {
                    setSearchCriteria(e.target.value as "empId" | "project" | "");
                    setSearchValue("");
                  }}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
                >
                  <option value="" disabled>Select Field</option>
                  <option value="empId">Employee ID</option>
                  <option value="project">Project Name</option>
                </select>
              </div>

              {/* Search Value */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">
                  Search Value
                </label>
                <input
                  type="text"
                  placeholder={getPlaceholderText()}
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  disabled={searchCriteria === ""}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder-slate-400 disabled:bg-slate-100 disabled:cursor-not-allowed text-sm"
                />
              </div>

              {/* Time Range */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">
                  Time Range
                </label>
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
                >
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last Month</option>
                  <option value="year">Last Year</option>
                  <option value="all">All Time</option>
                </select>
              </div>

              {/* Date Picker */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">
                  Specific Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
                />
              </div>

              {/* Fetch Button */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-transparent">
                  Action
                </label>
                <button
                  onClick={handleFetch}
                  disabled={!isFetchEnabled}
                  className={`w-full h-[42px] font-semibold rounded-lg shadow-md transition-all transform active:scale-95 text-sm ${
                    isFetchEnabled
                      ? "bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white shadow-indigo-200"
                      : "bg-slate-200 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  Fetch Dashboard
                </button>
              </div>
            </div>
          </div>

          {/* Message */}
          {message && (
            <div className="bg-amber-50 border-l-4 border-amber-400 text-amber-800 px-4 py-3 rounded-lg mb-6 shadow-sm">
              <p className="text-sm font-medium">{message}</p>
            </div>
          )}

          {/* Dashboard Content */}
          {tasks.length > 0 && (
            <div className="space-y-6 sm:space-y-8">
              {/* Metrics Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <div className="bg-white rounded-xl shadow-md border border-slate-200 p-5 sm:p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                      <ListChecks className="w-5 h-5 text-indigo-600" />
                    </div>
                  </div>
                  <p className="text-sm font-medium text-slate-600 mb-1">Total Tasks</p>
                  <p className="text-3xl font-bold text-slate-900">{totalTasks}</p>
                </div>
                
                <div className="bg-white rounded-xl shadow-md border border-slate-200 p-5 sm:p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    </div>
                  </div>
                  <p className="text-sm font-medium text-slate-600 mb-1">Completed</p>
                  <p className="text-3xl font-bold text-slate-900">{completedTasks}</p>
                </div>
                
                <div className="bg-white rounded-xl shadow-md border border-slate-200 p-5 sm:p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                    </div>
                  </div>
                  <p className="text-sm font-medium text-slate-600 mb-1">Avg Completion</p>
                  <p className="text-3xl font-bold text-slate-900">{avgCompletion}%</p>
                </div>
                
                <div className="bg-white rounded-xl shadow-md border border-slate-200 p-5 sm:p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Clock className="w-5 h-5 text-purple-600" />
                    </div>
                  </div>
                  <p className="text-sm font-medium text-slate-600 mb-1">Total Subtasks</p>
                  <p className="text-3xl font-bold text-slate-900">{totalSubtasks}</p>
                </div>
              </div>

              {/* Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                {/* Bar Chart */}
                <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6 sm:p-8">
                  <h3 className="text-lg sm:text-xl font-semibold text-slate-800 mb-6">
                    Task Status by Project
                  </h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={projectStatusData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis 
                          dataKey="project" 
                          tick={{ fill: '#475569', fontSize: 12 }} 
                          angle={-45}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis tick={{ fill: '#475569', fontSize: 12 }} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#ffffff', 
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                          }} 
                        />
                        <Legend />
                        <Bar dataKey="Completed" fill="#10b981" radius={[8, 8, 0, 0]} />
                        <Bar dataKey="In Progress" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                        <Bar dataKey="Pending" fill="#f59e0b" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Overall Completion Pie */}
                <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6 sm:p-8">
                  <h3 className="text-lg sm:text-xl font-semibold text-slate-800 mb-6">
                    Overall Completion
                  </h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={overallCompletionData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={110}
                          labelLine={false}
                          label={(entry: { name?: string; value?: number }) => {
                            const name = entry.name ?? "N/A";
                            const value = entry.value ?? 0;
                            return `${value}%`;
                          }}
                        >
                          {overallCompletionData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={PIE_COLORS[index % PIE_COLORS.length]} 
                            />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(v: number, name: string) => [`${v}%`, name]}
                          contentStyle={{ 
                            backgroundColor: '#ffffff', 
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0'
                          }} 
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Subtasks Chart */}
              {totalSubtasks > 0 && (
                <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6 sm:p-8">
                  <h3 className="text-lg sm:text-xl font-semibold text-slate-800 mb-6">
                    Subtasks Status Distribution
                  </h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={subtasksStatusData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={110}
                          labelLine={false}
                          label={(entry: { name?: string; value?: number }) => {
                            const name = entry.name ?? "N/A";
                            const value = entry.value ?? 0;
                            return `${name}: ${value}`;
                          }}
                        >
                          {subtasksStatusData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={SUBTASK_PIE_COLORS[index % SUBTASK_PIE_COLORS.length]} 
                            />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#ffffff', 
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0'
                          }} 
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewTaskPage;