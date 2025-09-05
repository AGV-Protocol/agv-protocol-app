"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function PageLoading() {
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleStart = () => setIsLoading(true);
    const handleComplete = () => setIsLoading(false);

    // Listen for route changes
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function(...args) {
      handleStart();
      originalPushState.apply(history, args);
      setTimeout(handleComplete, 100);
    };

    history.replaceState = function(...args) {
      handleStart();
      originalReplaceState.apply(history, args);
      setTimeout(handleComplete, 100);
    };

    return () => {
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
    };
  }, []);

  if (!isLoading) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <div className="h-1 bg-primary/20">
        <div 
          className="h-full bg-primary transition-all duration-300 ease-out animate-pulse"
          style={{
            width: "100%",
            background: "linear-gradient(90deg, transparent, hsl(var(--primary)), transparent)",
            animation: "shimmer 1.5s infinite"
          }}
        />
      </div>
      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
