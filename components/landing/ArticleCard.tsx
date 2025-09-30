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
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300">
      {/* Article Image */}
      <div className="mb-4">
        <Image
          src={image}
          alt={title}
          width={300}
          height={200}
          className="w-full h-36 rounded-t-lg"
        />
      </div>
      
      {/* Content */}
      <div className="space-y-3 p-6">
        <h3 className="text-lg font-bold text-[#223256]">{title}</h3>
        <p className="text-sm text-[#223256] leading-relaxed">{description}</p>
        
        {/* Read More Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onReadMore}
          className="bg-white border border-[#223256] text-[#223256] hover:bg-[#223256] hover:text-white transition-all duration-300 px-8 py-3 rounded-md font-semibold flex items-center space-x-2"
        >
          <span>Read more</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
