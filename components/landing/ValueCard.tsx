import React from "react";
import { LucideIcon } from "lucide-react";

interface ValueCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export const ValueCard: React.FC<ValueCardProps> = ({ icon: Icon, title, description }) => {
  return (
    <div className="flex items-start space-x-4 p-6 bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300">
      {/* Icon Circle */}
      <div className="flex-shrink-0 w-12 h-12 bg-[#3399FF] rounded-full flex items-center justify-center">
        <Icon className="w-6 h-6 text-white" />
      </div>
      
      {/* Content */}
      <div className="flex-1 space-y-2">
        <h3 className="text-lg font-bold text-[#223256]">{title}</h3>
        <p className="text-sm text-[#223256] leading-relaxed">{description}</p>
      </div>
    </div>
  );
};
