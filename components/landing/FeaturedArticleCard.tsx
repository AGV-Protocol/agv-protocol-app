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
    <div className="flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-6 p-6 bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300">
      {/* Article Image */}
      <div className="flex-shrink-0 w-full sm:w-auto">
        <Image
          src={image}
          alt={title}
          width={200}
          height={150}
          className="w-full sm:w-48 h-48 sm:h-36 object-cover rounded-lg"
        />
      </div>
      
      {/* Content */}
      <div className="flex-1 space-y-4">
        <h3 className="text-lg sm:text-xl font-bold text-[#223256]">{title}</h3>
        <p className="text-sm text-[#223256] leading-relaxed">{description}</p>
        
        {/* Read More Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onReadMore}
          className="p-0 h-auto text-[#223256] hover:text-[#223256]/80 font-medium flex items-center space-x-1 transition-colors duration-300"
        >
          <span>Read More</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
