import React from "react";
import Image from "next/image";
interface ValueCardProps {
  icon: string;
  title: string;
  description: string;
}

export const ValueCard: React.FC<ValueCardProps> = ({ icon: Icon, title, description }) => {
  return (
    <div className="flex flex-col items-center justify-content-center gap-8 space-x-4 p-6 bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300">
      {/* Icon Circle */}
      <div className="flex-shrink-0 w-12 h-12 border-2 border-[#223256] rounded-full flex items-center justify-center">
        <Image src={Icon} alt={title} width={24} height={24} className="w-6 h-6 text-white" />
      </div>
      
      {/* Content */}
      <div className="flex-1 space-y-2 text-center">
        <h3 className="text-lg font-bold text-[#223256]">{title}</h3>
        <p className="text-sm text-[#223256] leading-relaxed">{description}</p>
      </div>
    </div>
  );
};
