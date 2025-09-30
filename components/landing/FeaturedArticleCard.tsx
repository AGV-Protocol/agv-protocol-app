import React from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

interface FeaturedArticleCardProps {
  image: string;
  title: string;
  description: string;
  onReadMore: () => void;
}

export const FeaturedArticleCard: React.FC<FeaturedArticleCardProps> = ({ 
  image, 
  title, 
  description, 
  onReadMore 
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6 bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300">
      {/* Article Image */}
      <div className="flex-1 w-full sm:w-auto">
        <Image
          src={image}
          alt={title}
          width={200}
          height={150}
          className="w-full object-cover rounded-l-sm"
        />
      </div>
      
      {/* Content */}
      <div className="flex-1 space-y-4 p-6">
        <h3 className="text-lg sm:text-xl font-bold text-[#223256]">{title}</h3>
        <p className="text-sm text-[#223256] leading-relaxed">{description}</p>
        
        {/* Read More Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onReadMore}
          className="bg-white border border-[#223256] text-[#223256] hover:bg-[#223256] hover:text-white transition-all duration-300 px-8 py-3 rounded-md font-semibold flex items-center space-x-2"
        >
          <span>Read More</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
