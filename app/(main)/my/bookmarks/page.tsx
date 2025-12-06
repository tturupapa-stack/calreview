"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function BookmarksRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace("/my/campaigns");
  }, [router]);

  return (
    <div className="bg-gray-50 min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-600">페이지 이동 중...</p>
      </div>
    </div>
  );
}
