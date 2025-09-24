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
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300">
      {/* Article Image */}
      <div className="mb-4">
        <Image
          src={image}
          alt={title}
          width={300}
          height={200}
          className="w-full h-48 object-cover rounded-lg"
        />
      </div>
      
      {/* Content */}
      <div className="space-y-3">
        <h3 className="text-lg font-bold text-[#223256]">{title}</h3>
        <p className="text-sm text-[#223256] leading-relaxed">{description}</p>
        
        {/* Read More Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onReadMore}
          className="p-0 h-auto text-[#223256] hover:text-[#223256]/80 font-medium flex items-center space-x-1 transition-colors duration-300"
        >
          <span>Read more</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
