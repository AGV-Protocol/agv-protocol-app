import React from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

interface ArticleCardProps {
  image: string;
  title: string;
  description: string;
  onReadMore: () => void;
}

export const ArticleCard: React.FC<ArticleCardProps> = ({ 
  image, 
  title, 
  description, 
  onReadMore 
}) => {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300 h-full flex flex-col">
      {/* Article Image */}
      <div className="mb-3 sm:mb-4">
        <Image
          src={image}
          alt={title}
          width={300}
          height={200}
          className="w-full h-32 sm:h-36 rounded-t-lg object-cover"
        />
      </div>
      
      {/* Content */}
      <div className="space-y-2 sm:space-y-3 p-4 sm:p-6 flex-1 flex flex-col">
        <h3 className="text-sm sm:text-base lg:text-lg font-bold text-[#223256] line-clamp-2">{title}</h3>
        <p className="text-xs sm:text-sm text-[#223256] leading-relaxed line-clamp-3 flex-1">{description}</p>
        
        {/* Read More Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onReadMore}
          className="bg-white border border-[#223256] text-[#223256] hover:bg-[#223256] hover:text-white transition-all duration-300 px-4 sm:px-6 lg:px-8 py-2 sm:py-3 rounded-md font-semibold flex items-center space-x-2 text-xs sm:text-sm mt-auto"
        >
          <span>Read more</span>
          <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
        </Button>
      </div>
    </div>
  );
};
