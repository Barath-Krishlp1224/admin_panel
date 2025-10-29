"use client"
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, UserPlus, ClipboardList, BarChart3 } from 'lucide-react';

const ManagerPage: React.FC = () => {
  const router = useRouter();
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const handleViewEmployees = () => {
    router.push('/manager/view-list');
  };

  const handleAddEmployee = () => {
    router.push('/manager/new-emp');
  };

  const handleViewEmployeeTasks = () => {
    router.push('/view-task');
  };

  const handleViewPerformance = () => {
    router.push('/employeetasks');
  };

  const cards = [
    {
      id: 'view',
      title: 'View Employee List',
      icon: Users,
      onClick: handleViewEmployees,
    },
    {
      id: 'add',
      title: 'Add New Employee',
      icon: UserPlus,
      onClick: handleAddEmployee,
    },
    {
      id: 'tasks',
      title: 'View Employee Tasks',
      icon: ClipboardList,
      onClick: handleViewEmployeeTasks,
    },
    {
      id: 'performance',
      title: 'View Employee Performance',
      icon: BarChart3,
      onClick: handleViewPerformance,
    },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-6xl w-full">
        <h1 className="text-5xl font-bold text-white mb-4 text-center">Manager Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map((card, index) => {
            const Icon = card.icon;
            const isHovered = hoveredCard === card.id;
            
            return (
              <div
                key={card.id}
                className="relative group"
                style={{
                  animation: `slideUp 0.6s ease-out ${index * 0.15}s both`
                }}
                onMouseEnter={() => setHoveredCard(card.id)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <button
                  onClick={card.onClick}
                  className="w-full h-52 bg-white rounded-xl p-8 border border-gray-200 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 text-left relative overflow-hidden flex flex-col" // Changed h-64 to h-52
                >
                  {/* Animated background on hover */}
                  <div 
                    className="absolute inset-0 bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  />
                  
                  <div className="relative z-10">
                    {/* Icon with animation */}
                    <div className={`w-14 h-14 bg-black rounded-lg flex items-center justify-center mb-4 transition-all duration-300 ${isHovered ? 'scale-110 rotate-3' : ''}`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    
                    {/* Title */}
                    <h3 className="text-xl font-bold text-black mb-2 group-hover:text-gray-900 transition-colors">
                      {card.title}
                    </h3>
                    
                    {/* Animated arrow indicator */}
                    <div className={`mt-4 flex items-center text-black font-medium text-sm transition-all duration-300 ${isHovered ? 'translate-x-2' : ''}`}>
                      <span>Open</span>
                      <svg 
                        className="w-4 h-4 ml-2" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                  
                  {/* Decorative corner accent */}
                  <div className="absolute top-0 right-0 w-20 h-20 bg-black opacity-5 rounded-bl-full transform translate-x-10 -translate-y-10 group-hover:translate-x-8 group-hover:-translate-y-8 transition-transform duration-300" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
      
      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default ManagerPage;