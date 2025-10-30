"use client";

import React from "react";
import { useRouter } from "next/navigation";

const EmployeesPage: React.FC = () => {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-100 to-white">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Employee Task Portal
        </h1>
        <p className="text-gray-600">
          Manage your daily tasks easily
        </p>
      </div>

      {/* Buttons */}
      <div className="flex flex-col md:flex-row gap-6">
        <button
          onClick={() => router.push("/team-lead/create-task")}
          className="bg-black text-white px-8 py-4 rounded-xl font-semibold hover:bg-gray-800 transform hover:scale-105 transition-all duration-200 shadow-lg"
        >
          ➕ Create Task
        </button>

        <button
          onClick={() => router.push("/view-task")}
          className="bg-white border-2 border-black text-black px-8 py-4 rounded-xl font-semibold hover:bg-gray-100 transform hover:scale-105 transition-all duration-200 shadow-lg"
        >
          📋 View / Update Task
        </button>
      </div>
    </div>
  );
};

export default EmployeesPage;