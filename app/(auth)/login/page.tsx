"use client";

import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { type User, type Provider } from "@supabase/supabase-js";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const supabase = createClient();

  useEffect(() => {
    // 현재 로그인 상태 확인 (리다이렉트 없이)
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUser(user);
      setIsLoading(false);
    });
  }, [supabase]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-gray-600">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            캘리뷰에 로그인
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            체험단 통합 검색과 일정 관리를 시작하세요
          </p>
        </div>

        {currentUser && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <p className="text-sm text-blue-800">
              이미 로그인되어 있습니다.
            </p>
            <button
              onClick={() => router.push("/")}
              className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              메인으로 이동 →
            </button>
          </div>
        )}

        <div className="mt-8 space-y-4">
          <LoginButton provider="google" disabled={!!currentUser} />
          <LoginButton provider="naver" disabled={!!currentUser} />
        </div>

        <p className="mt-6 text-center text-xs text-gray-500">
          로그인 시{" "}
          <a href="/terms" className="text-blue-600 hover:text-blue-500">
            이용약관
          </a>
          과{" "}
          <a href="/privacy" className="text-blue-600 hover:text-blue-500">
            개인정보처리방침
          </a>
          에 동의하게 됩니다.
        </p>
      </div>
    </div>
  );
}

function LoginButton({ provider, disabled = false }: { provider: "google" | "naver"; disabled?: boolean }) {
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  const handleLogin = async () => {
    if (disabled) return;

    setIsLoading(true);

    // 네이버 로그인은 직접 구현한 API로 리다이렉트
    if (provider === "naver") {
      window.location.href = "/api/auth/naver/connect";
      return;
    }

    // 구글 로그인은 Supabase OAuth 사용
    const { error } = await supabase.auth.signInWithOAuth({
      provider: provider as Provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      console.error("로그인 오류:", error);
      alert("로그인 중 오류가 발생했습니다. 다시 시도해주세요.");
      setIsLoading(false);
    }
  };

  type ProviderInfo = {
    name: string;
    bgColor: string;
    textColor: string;
    icon: string;
    borderColor?: string;
  };

  const providerInfo: Record<string, ProviderInfo> = {
    google: {
      name: "구글",
      bgColor: "bg-white hover:bg-gray-50",
      textColor: "text-gray-700",
      icon: "G",
      borderColor: "border-gray-300",
    },
    naver: {
      name: "네이버",
      bgColor: "bg-[#03C75A] hover:bg-[#02B350]",
      textColor: "text-white",
      icon: "N",
    },
  };

  const info = providerInfo[provider];

  return (
    <button
      onClick={handleLogin}
      disabled={isLoading || disabled}
      className={`w-full flex items-center justify-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${info.bgColor} ${info.textColor} ${provider === "google" ? `border ${info.borderColor}` : ""} shadow-sm disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {isLoading ? (
        <span className="text-sm">로딩 중...</span>
      ) : (
        <>
          <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${provider === "naver" ? "bg-white text-[#03C75A]" : "bg-gray-200"}`}>
            {info.icon}
          </span>
          {info.name}로 시작하기
        </>
      )}
    </button>
  );
}

