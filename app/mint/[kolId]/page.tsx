"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function MintWithKOLPage({ params }: { params: { kolId: string } }) {
  const router = useRouter();
  const { kolId } = params;

  useEffect(() => {
    // Redirect to mint page with the KOL ID as a query parameter
    if (kolId) {
      router.replace(`/mint?kolId=${kolId}`);
    } else {
      // If no KOL ID, redirect to regular mint page
      router.replace("/mint");
    }
  }, [kolId, router]);

  // Show loading while redirecting
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#223256] via-[#223256] to-[#223256] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-white text-lg">Redirecting to mint page...</p>
      </div>
    </div>
  );
}
