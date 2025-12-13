"use client";

import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import Image from "next/image";

export function UserMenu() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("로그아웃 오류:", error);
      alert("로그아웃 중 오류가 발생했습니다.");
    } else {
      router.push("/");
      router.refresh();
    }
  };

  if (isLoading) {
    return (
      <div className="w-8 h-8 rounded-full bg-gray-200"></div>
    );
  }

  if (!user) {
    return (
      <a
        href="/login"
        className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium no-underline hover:bg-blue-700 transition-colors"
      >
        로그인
      </a>
    );
  }

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button className="flex items-center gap-2 rounded-full p-1 cursor-pointer hover:bg-gray-100 transition-colors">
        {user.user_metadata?.avatar_url ? (
          <Image
            src={user.user_metadata.avatar_url}
            alt={user.user_metadata?.name || "사용자"}
            width={32}
            height={32}
            className="rounded-full"
          />
        ) : (
          <div className="flex w-8 h-8 items-center justify-center rounded-full bg-blue-600 text-white text-sm font-medium">
            {user.user_metadata?.name?.[0] || user.email?.[0] || "U"}
          </div>
        )}
        <span className="text-sm text-gray-700 max-w-[100px] truncate">
          {user.user_metadata?.name || user.email}
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full pt-2 w-48 z-50">
          <div className="rounded-md bg-white shadow-lg border border-gray-200 overflow-hidden py-1">
            <a
              href="/my/campaigns"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 no-underline"
            >
              체험단 관리
            </a>
            <a
              href="/settings"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 no-underline"
            >
              설정
            </a>
            <button
              onClick={handleLogout}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 bg-transparent border-none cursor-pointer"
            >
              로그아웃
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
