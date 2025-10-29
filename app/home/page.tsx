"use client"
import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";

const HomePage: React.FC = () => {
  const [showEmployeePopup, setShowEmployeePopup] = useState(false);

  const roles = [
    {
      name: "Admin",
      href: "/admin",
      image: "/admin.jpg",
    },
    {
      name: "Manager",
      href: "/manager",
      image: "/manager.jpg",
    },
    {
      name: "Employees",
      href: "/employees",
      image: "/employee.jpg",
    },
  ];

  return (
    <div className="relative w-[95%] sm:w-[92%] md:w-[90%] ml-[2.5%] sm:ml-[4%] md:ml-[5%] h-[75vh] xs:h-[70vh] sm:h-[65vh] md:h-[60vh] mt-[35%] xs:mt-[30%] sm:mt-[22%] md:mt-[15%] overflow-hidden rounded-xl sm:rounded-2xl">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute top-0 left-0 w-full h-full object-cover z-0"
        src="/team.mp4"
      />

      <div className="absolute top-0 left-0 w-full h-full bg-black/50 z-10"></div>

      <div className="relative z-20 flex flex-col justify-between h-full px-3 xs:px-4 sm:px-5 md:px-6 py-3 xs:py-3.5 sm:py-4 md:py-4">
        <div className="text-center mt-1 sm:mt-1.5 md:mt-2">
          <h2 className="text-xl xs:text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-1.5 sm:mb-2 px-2">
            Lemonpay Smarter Team Management
          </h2>
          <div className="flex justify-center">
            <div className="w-48 xs:w-60 sm:w-72 md:w-80 h-0.5 sm:h-1 bg-gradient-to-r round-2xl from-transparent via-yellow-400 to-transparent rounded-full"></div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 xs:gap-3.5 sm:gap-4 md:gap-6 h-full items-center">
          {roles.map((role) => (
            <div key={role.name}>
              {role.name === "Employees" ? (
                <div
                  onClick={() => setShowEmployeePopup(true)}
                  className="relative group rounded-xl sm:rounded-2xl shadow-xl flex flex-col items-center justify-center transition-transform duration-300 cursor-pointer p-2 xs:p-2.5 sm:p-3 h-32 xs:h-36 sm:h-40 md:h-48 hover:scale-105 overflow-hidden"
                >
                  <Image
                    src={role.image}
                    alt={role.name}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-110 object-center"
                  />

                  <div className="absolute inset-0 bg-black/70 transition-opacity duration-300 group-hover:bg-black/60"></div>

                  <div className="relative z-10 flex flex-col items-center justify-center w-full h-full">
                    <h3 className="text-lg xs:text-xl sm:text-2xl font-bold text-white mb-1.5 sm:mb-2 text-shadow-lg">
                      {role.name}
                    </h3>

                    <button className="px-3 xs:px-3.5 sm:px-4 py-1.5 xs:py-2 text-white rounded-full text-xs xs:text-sm font-semibold transition-all duration-300 border border-white/50 backdrop-blur-sm 
                                       bg-white/10 hover:bg-white/20 shadow-lg hover:shadow-xl">
                      Enter Portal
                    </button>
                  </div>
                </div>
              ) : (
                <Link href={role.href} passHref>
                  <div className="relative group rounded-xl sm:rounded-2xl shadow-xl flex flex-col items-center justify-center transition-transform duration-300 cursor-pointer p-2 xs:p-2.5 sm:p-3 h-32 xs:h-36 sm:h-40 md:h-48 hover:scale-105 overflow-hidden">
                    <Image
                      src={role.image}
                      alt={role.name}
                      fill
                      className={`object-cover transition-transform duration-300 group-hover:scale-110 
                                  ${role.name === "Manager" ? "object-top" : "object-center"}`}
                    />

                    <div className="absolute inset-0 bg-black/70 transition-opacity duration-300 group-hover:bg-black/60"></div>

                    <div className="relative z-10 flex flex-col items-center justify-center w-full h-full">
                      <h3 className="text-lg xs:text-xl sm:text-2xl font-bold text-white mb-1.5 sm:mb-2 text-shadow-lg">
                        {role.name}
                      </h3>

                      <button className="px-3 xs:px-3.5 sm:px-4 py-1.5 xs:py-2 text-white rounded-full text-xs xs:text-sm font-semibold transition-all duration-300 border border-white/50 backdrop-blur-sm 
                                         bg-white/10 hover:bg-white/20 shadow-lg hover:shadow-xl">
                        Enter Portal
                      </button>
                    </div>
                  </div>
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Popup Modal */}
      {showEmployeePopup && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowEmployeePopup(false)}
        >
          <div
            className="bg-white rounded-xl sm:rounded-2xl shadow-2xl p-5 xs:p-6 sm:p-7 md:p-8 w-[95%] xs:w-[90%] sm:w-[85%] md:w-[90%] max-w-[360px] xs:max-w-[380px] sm:max-w-sm transform transition-all" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-4 xs:mb-5 sm:mb-6">
              <h3 className="text-xl xs:text-2xl font-bold text-gray-800 mb-1.5 sm:mb-2">
                Employee Portal
              </h3>
              <p className="text-sm xs:text-base text-gray-600">Choose an action to continue</p>
            </div>

            <div className="flex flex-col gap-3 xs:gap-3.5 sm:gap-4">
              <Link href="/employees" className="mx-auto max-w-xs w-full">
                <button className="w-full px-4 xs:px-5 sm:px-6 py-3 xs:py-3.5 sm:py-4 bg-white text-black rounded-lg xs:rounded-xl text-base xs:text-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-2xl hover:scale-105 border border-gray-200">
                  Create New Task
                </button>
              </Link>

              <Link href="/employees/edit-task" className="mx-auto max-w-xs w-full">
                <button className="w-full px-4 xs:px-5 sm:px-6 py-3 xs:py-3.5 sm:py-4 bg-white text-black rounded-lg xs:rounded-xl text-base xs:text-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-2xl hover:scale-105 border border-gray-200">
                  Create (Subtasks) / Edit Tasks
                </button>
              </Link>

            
              <button
                onClick={() => setShowEmployeePopup(false)}
                className="mx-auto w-full max-w-[100px] px-3 py-2.5 xs:py-3 bg-red-500 text-white rounded-lg xs:rounded-xl text-sm xs:text-base font-semibold transition-all duration-300 shadow-lg hover:shadow-2xl hover:scale-105 border border-red-500 hover:bg-red-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;