// app/admin/view-emp/page.tsx

"use client"
import React, { useState, useCallback } from "react";

// Define the shape of the employee data
interface IEmployee {
  _id: string;
  empId: string;
  name: string;
  fatherName: string;
  dateOfBirth: string;
  joiningDate: string;
  team: string;
  department: string;
  phoneNumber: string;
  mailId: string;
  accountNumber: string;
  ifscCode: string;
  photo?: string;
}

// The main Employee List/Search/Print Component
const EmployeeListPage: React.FC = () => {
  const [searchId, setSearchId] = useState("");
  const [employee, setEmployee] = useState<IEmployee | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const departments = [
    'Accountant', 'Senior Full Stack Developer', 'Junior Full Stack Developer', 
    'Hybrid Mobile Developer', 'Product Manager', 'Project Manager', 
    'QA Engineer – Manual & Automation', 'Social Media Manager & Content Writer', 
    'UI/UX Developer', 'IT Administrator', 'Customer Success Associate'
  ];

  // Search Function
  const handleSearch = useCallback(async (idToSearch: string) => {
    if (!idToSearch) {
      setError("Please enter an Employee ID");
      return;
    }

    setLoading(true);
    setError("");
    setEmployee(null);

    try {
      const res = await fetch(`/api/employees/get/${idToSearch.toUpperCase()}`);
      const data = await res.json();

      if (data.success) {
        setEmployee(data.employee);
      } else {
        setError(data.message || "Employee not found");
      }
    } catch (err) {
      console.error(err);
      setError("Error fetching employee");
    }

    setLoading(false);
  }, []);

  // Print Handler
  const handlePrint = () => {
    window.print();
  };

  const RenderEmployeeDetails = () => (
    <div className="border-t border-gray-100 pt-4 sm:pt-6 md:pt-8 print-area">
      
      {/* Employee name visible during print */}
      <h3 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 sm:mb-8 hidden print:block">
        {employee?.name} Details
      </h3>
      
      <div className="flex flex-col lg:flex-row gap-6 sm:gap-8">
        
        {/* Photo Section */}
        {employee?.photo && (
          <div className="flex-shrink-0 flex justify-center lg:justify-start">
            <div className="relative group">
              <div className="absolute -inset-1 rounded-xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
              <img 
                src={employee.photo} 
                alt="Employee Photo" 
                className="relative w-32 h-32 xs:w-40 xs:h-40 sm:w-48 sm:h-48 object-cover rounded-full shadow-2xl border-4 border-white" 
              />
            </div>
          </div>
        )}
        
        {/* Details Section with Card Layout */}
        <div className="flex-grow">
          {/* Employee Name Header (visible when not printing) */}
          <div className="w-full mb-6 sm:mb-8 print:hidden">
            <h3 className="text-2xl sm:text-3xl md:text-3xl font-bold text-gray-800 break-words">
                {employee?.name}
            </h3>
            <div className="border-b border-gray-100 mt-3"></div>
          </div>
        
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
            
            {/* Employee ID */}
            <div className="bg-white p-4 sm:p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
              <p className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-2 flex items-center gap-2">
                <svg className="w-3 h-3 sm:w-4 sm:h-4 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
                Employee ID
              </p>
              <p className="text-base sm:text-lg text-gray-900 font-semibold break-words">{employee?.empId}</p>
            </div>

            {/* Father's Name */}
            <div className="bg-white p-4 sm:p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
              <p className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-2 flex items-center gap-2">
                <svg className="w-3 h-3 sm:w-4 sm:h-4 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
                Father's Name
              </p>
              <p className="text-base sm:text-lg text-gray-900 font-semibold break-words">{employee?.fatherName}</p>
            </div>

            {/* Date of Birth */}
            <div className="bg-white p-4 sm:p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
              <p className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-2 flex items-center gap-2">
                <svg className="w-3 h-3 sm:w-4 sm:h-4 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
                Date of Birth
              </p>
              <p className="text-base sm:text-lg text-gray-900 font-semibold">{employee?.dateOfBirth}</p>
            </div>

            {/* Joining Date */}
            <div className="bg-white p-4 sm:p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
              <p className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-2 flex items-center gap-2">
                <svg className="w-3 h-3 sm:w-4 sm:h-4 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
                Joining Date
              </p>
              <p className="text-base sm:text-lg text-gray-900 font-semibold">{employee?.joiningDate}</p>
            </div>

            {/* Team */}
            <div className="bg-white p-4 sm:p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
              <p className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-2 flex items-center gap-2">
                <svg className="w-3 h-3 sm:w-4 sm:h-4 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                </svg>
                Team
              </p>
              <p className="text-base sm:text-lg text-gray-900 font-semibold break-words">{employee?.team}</p>
            </div>

            {/* Department */}
            <div className="bg-white p-4 sm:p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
              <p className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-2 flex items-center gap-2">
                <svg className="w-3 h-3 sm:w-4 sm:h-4 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                  <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z" />
                </svg>
                Department
              </p>
              <p className="text-base sm:text-lg text-gray-900 font-semibold break-words">{employee?.department}</p>
            </div>

            {/* Phone Number */}
            <div className="bg-white p-4 sm:p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
              <p className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-2 flex items-center gap-2">
                <svg className="w-3 h-3 sm:w-4 sm:h-4 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                </svg>
                Phone Number
              </p>
              <p className="text-base sm:text-lg text-gray-900 font-semibold">{employee?.phoneNumber}</p>
            </div>

            {/* Email */}
            <div className="bg-white p-4 sm:p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
              <p className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-2 flex items-center gap-2">
                <svg className="w-3 h-3 sm:w-4 sm:h-4 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
                Email
              </p>
              <p className="text-base sm:text-lg text-gray-900 font-semibold break-all">{employee?.mailId}</p>
            </div>

            {/* Account Number */}
            <div className="bg-white p-4 sm:p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
              <p className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-2 flex items-center gap-2">
                <svg className="w-3 h-3 sm:w-4 sm:h-4 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                  <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                </svg>
                Account Number
              </p>
              <p className="text-base sm:text-lg text-gray-900 font-semibold break-words">{employee?.accountNumber}</p>
            </div>

            {/* IFSC Code */}
            <div className="bg-white p-4 sm:p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
              <p className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-2 flex items-center gap-2">
                <svg className="w-3 h-3 sm:w-4 sm:h-4 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                IFSC Code
              </p>
              <p className="text-base sm:text-lg text-gray-900 font-semibold">{employee?.ifscCode}</p>
            </div>

          </div>
        </div>
      </div>

      {/* Print Button Section */}
      <div className="flex justify-end pt-6 sm:pt-8 md:pt-10 print:hidden">
        <button
          onClick={handlePrint}
          className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold text-sm sm:text-base rounded-xl shadow-lg hover:shadow-xl hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 flex items-center justify-center gap-2 transform hover:scale-105"
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          <span className="hidden xs:inline">Print / Download PDF</span>
          <span className="xs:hidden">Print PDF</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen to-slate-900 py-6 sm:py-8 md:py-12 px-3 sm:px-4 md:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="mb-6 sm:mb-8 print:hidden">
          <div className="text-center mt-[15%] sm:mt-[20%] mb-6 sm:mb-8">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-2 sm:mb-3 px-2">
              Employee Search Portal
            </h1>
            <p className="text-gray-300 text-base sm:text-lg px-2">
              Find and manage employee information
            </p>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white shadow-2xl rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 border border-gray-100 backdrop-blur-sm bg-opacity-95">
          {/* Search Bar */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6 sm:mb-8 print:hidden">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                <svg className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Enter Employee ID..."
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-4 border-2 border-gray-200 rounded-xl text-sm sm:text-base text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-300 bg-gray-50 hover:bg-white"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSearch(searchId);
                }}
              />
            </div>
         <button
    onClick={() => handleSearch(searchId)}
    className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-lime-600 to-green-600 text-white font-semibold text-sm sm:text-base rounded-xl hover:from-lime-700 hover:to-green-700 transition-all duration-300 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none flex items-center justify-center gap-2"
    disabled={loading}
>
    {loading && !employee ? (
        <>
            <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Searching...
        </>
    ) : (
        <>
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Search
        </>
    )}
</button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 sm:mb-6 p-4 sm:p-5 bg-gradient-to-r from-red-50 to-rose-50 border-l-4 border-red-500 rounded-lg print:hidden shadow-sm">
              <div className="flex items-center gap-2 sm:gap-3">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-red-700 text-sm sm:text-base font-semibold">{error}</p>
              </div>
            </div>
          )}

          {/* Employee Details */}
          {employee && <RenderEmployeeDetails />}
        </div>
      </div>
    </div>
  );
};

// Next.js App Router Page component
const page = () => {
  return (
    <EmployeeListPage />
  )
}

export default page;