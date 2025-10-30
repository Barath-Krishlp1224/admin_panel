"use client";

import React, { useState } from "react";

const EmployeesPage: React.FC = () => {
  // 1. State: 'name' is removed.
  const [formData, setFormData] = useState({
    startDate: new Date().toISOString().split("T")[0], // Default to today
    endDate: "",
    dueDate: "",
    empId: "", // This is now the only required field
    project: "",
    completion: "", 
    status: "In Progress", // Has a default value
    remarks: "",
  });

  const [message, setMessage] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Client-side check for the *only* required field: empId
      if (!formData.empId) {
        setMessage("⚠️ Employee ID is a mandatory field and cannot be empty.");
        return; // Stop submission
      }

      const res = await fetch("/api/tasks/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage("Task submitted successfully!");
        // 2. Reset form data on successful submission
        setFormData({
          startDate: new Date().toISOString().split("T")[0],
          endDate: "",
          dueDate: "",
          empId: "",
          project: "",
          completion: "",
          status: "In Progress",
          remarks: "",
        });
      } else {
        setMessage(data.error || "Failed to submit task");
      }
    } catch (error) {
      console.error(error);
      setMessage("Server error");
    }
  };

  return (
    <div className="min-h-screen from-slate-100 via-white to-slate-100 py-12 px-4">
      <div className="mx-auto max-w-5xl">
        {/* Header Section */}
        <div className="text-center mt-[3%] mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Employee Task Entry
          </h1>
          <p className="text-white">Track your daily progress and accomplishments</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Message Banner */}
          {message && (
            <div
              className={`px-6 py-4 ${
                message.includes("successfully")
                  ? "bg-green-50 border-b-2 border-green-600"
                  : "bg-red-50 border-b-2 border-red-600"
              }`}
            >
              <p
                className={`font-semibold flex items-center gap-2 ${
                  message.includes("successfully") ? "text-green-700" : "text-red-700"
                }`}
              >
                <span className="text-xl">
                  {message.includes("successfully") ? "✓" : "⚠"}
                </span>
                {message}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Employee ID (REQUIRED) - Added 'required' */}
              <div className="group">
                <label className="block text-sm font-semibold text-black mb-2">
                  🆔 Employee ID **(Required)**
                </label>
                <input
                  type="text"
                  name="empId"
                  value={formData.empId}
                  onChange={handleChange}
                  className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-black focus:border-black focus:ring-2 focus:ring-gray-200 transition-all outline-none"
                  placeholder="Enter your employee ID"
                  required // This is the only required field
                />
              </div>
              
              {/* Spacer for layout adjustment */}
              <div className="group hidden md:block"></div> 

              {/* Project Name (Optional) - Removed 'required' */}
              <div className="group md:col-span-2">
                <label className="block text-sm font-semibold text-black mb-2">
                  📁 Project Name (Optional)
                </label>
                <input
                  type="text"
                  name="project"
                  value={formData.project}
                  onChange={handleChange}
                  className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-black focus:border-black focus:ring-2 focus:ring-gray-200 transition-all outline-none"
                  placeholder="Enter project name"
                />
              </div>

              {/* Start Date (Optional) - Removed 'required' */}
              <div className="group">
                <label className="block text-sm font-semibold text-black mb-2">
                  ▶️ Start Date (Optional)
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-black focus:border-black focus:ring-2 focus:ring-gray-200 transition-all outline-none"
                />
              </div>

              {/* End Date (Optional) */}
              <div className="group">
                <label className="block text-sm font-semibold text-black mb-2">
                  🛑 End Date (Expected/Actual - Optional)
                </label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-black focus:border-black focus:ring-2 focus:ring-gray-200 transition-all outline-none"
                />
              </div>

              {/* Due Date (Optional) - Removed 'required' */}
              <div className="group">
                <label className="block text-sm font-semibold text-black mb-2">
                  ⏳ Due Date (Optional)
                </label>
                <input
                  type="date"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleChange}
                  className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-black focus:border-black focus:ring-2 focus:ring-gray-200 transition-all outline-none"
                />
              </div>
              
              {/* Completion % (Optional) - Removed 'required' */}
              <div className="group">
                <label className="block text-sm font-semibold text-black mb-2">
                  📊 Completion Percentage (Optional)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="completion"
                    value={formData.completion}
                    onChange={handleChange}
                    className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 pr-10 text-black focus:border-black focus:ring-2 focus:ring-gray-200 transition-all outline-none"
                    placeholder="0 - 100"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-black font-semibold">
                    %
                  </span>
                </div>
              </div>

              {/* Status (Optional - has default value) - Removed 'required' */}
              <div className="group">
                <label className="block text-sm font-semibold text-black mb-2">
                  🔄 Status (Optional)
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-black focus:border-black focus:ring-2 focus:ring-gray-200 transition-all outline-none bg-white cursor-pointer"
                >
                  <option value="In Progress">In Progress</option>
                  <option value="Paused">Paused</option>
                  <option value="Completed">Completed</option>
                  <option value="On Hold">On Hold</option>
                </select>
              </div>

              {/* Remarks (Optional) - Removed 'required' */}
              <div className="md:col-span-2 group">
                <label className="block text-sm font-semibold text-black mb-2">
                  💬 Remarks (Optional)
                </label>
                <input
                  type="text"
                  name="remarks"
                  value={formData.remarks}
                  onChange={handleChange}
                  className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-black focus:border-black focus:ring-2 focus:ring-gray-200 transition-all outline-none"
                  placeholder="Any additional comments or notes"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="mt-8">
              <button
                type="submit"
                className="w-full bg-white text-black font-bold py-4 px-6 rounded-xl hover:bg-gray-100 transform hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Submit Task
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EmployeesPage;