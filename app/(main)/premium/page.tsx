"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function PremiumPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setCurrentUser(user);
      setIsLoading(false);
    };

    checkUser();
  }, [supabase]);

  if (isLoading) {
    return (
      <div className="bg-background min-h-screen">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="text-center">로딩 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* 헤더 */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            체험단 일정 관리의 새로운 기준
          </h1>
          <p className="text-xl text-gray-600">
            검색부터 캘린더 연동까지, 모든 기능을 이용하세요
          </p>
        </div>

        {/* 제공 기능 */}
        <div className="max-w-4xl mx-auto mb-16">
          <div className="bg-gradient-to-br from-primary/5 to-secondary rounded-2xl shadow-xl p-10 border-2 border-primary/20">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-3">
                캘리뷰의 모든 기능
              </h2>
              <p className="text-gray-600">
                체험단 관리에 필요한 모든 것
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 bg-white rounded-lg p-4">
                <svg
                  className="w-6 h-6 text-blue-600 mt-0.5 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <span className="text-gray-900 font-semibold block">
                    4개 사이트 통합 검색
                  </span>
                  <span className="text-sm text-gray-600">
                    스마트 검색 + 제목 검색
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-white rounded-lg p-4">
                <svg
                  className="w-6 h-6 text-blue-600 mt-0.5 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <span className="text-gray-900 font-semibold block">
                    무제한 북마크
                  </span>
                  <span className="text-sm text-gray-600">
                    개수 제한 없음
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-white rounded-lg p-4 border-2 border-blue-300">
                <svg
                  className="w-6 h-6 text-blue-600 mt-0.5 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <span className="text-gray-900 font-semibold block">
                    구글 캘린더 자동 연동 ⭐
                  </span>
                  <span className="text-sm text-gray-600">
                    일정 자동 등록
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-white rounded-lg p-4 border-2 border-blue-300">
                <svg
                  className="w-6 h-6 text-blue-600 mt-0.5 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <span className="text-gray-900 font-semibold block">
                    일정 캘린더 뷰 ⭐
                  </span>
                  <span className="text-sm text-gray-600">
                    마이페이지 통합 관리
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-white rounded-lg p-4 border-2 border-blue-300">
                <svg
                  className="w-6 h-6 text-blue-600 mt-0.5 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <span className="text-gray-900 font-semibold block">
                    마감 임박 알림 ⭐
                  </span>
                  <span className="text-sm text-gray-600">
                    D-3 이하 강조 표시
                  </span>
                </div>
              </div>

            </div>

            <div className="mt-8 text-center">
              <Link
                href={currentUser ? "/search" : "/login"}
                className="inline-block px-10 py-4 bg-blue-600 text-white text-lg font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg"
              >
                {currentUser ? "체험단 검색하러 가기 →" : "지금 시작하기 →"}
              </Link>
            </div>
          </div>
        </div>

        {/* 로드맵 */}
        <div className="bg-white rounded-2xl shadow-sm p-10 mb-12">
          <h3 className="text-3xl font-bold text-gray-900 mb-2 text-center">
            앞으로의 계획
          </h3>
          <p className="text-center text-gray-600 mb-8">
            사용자가 늘어나면 더 좋은 서비스로 발전합니다
          </p>

          <div className="space-y-6 max-w-3xl mx-auto">
            {/* Phase 1 */}
            <div className="flex gap-6">
              <div className="flex-shrink-0 bg-primary/10 p-3 rounded-lg">
                <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="block text-primary font-bold mt-1">Phase 1</span>
              </div>
              <div className="flex-1 bg-blue-50 rounded-lg p-6 border-2 border-blue-200">
                <h4 className="font-bold text-gray-900 mb-2">
                  ✅ 사용자 확보 (현재)
                </h4>
                <p className="text-gray-700 mb-3">
                  검색, 북마크, 캘린더 연동 등 모든 기능 제공
                </p>
                <p className="text-sm text-gray-600">
                  목표: 활성 사용자 5,000명
                </p>
              </div>
            </div>

            {/* Phase 2 */}
            <div className="flex gap-6">
              <div className="flex-shrink-0 w-32 text-center">
                <div className="inline-block bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-bold">
                  Phase 2
                </div>
                <p className="text-sm text-gray-600 mt-2">6~12개월</p>
              </div>
              <div className="flex-1 bg-gray-50 rounded-lg p-6 border border-gray-200">
                <h4 className="font-bold text-gray-900 mb-2">기능 확장</h4>
                <p className="text-gray-700 mb-3">
                  사용자가 늘어나면 더 많은 기능 추가
                </p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• 사이트별 인기 체험단 추천</li>
                  <li>• AI 맞춤 추천 체험단</li>
                  <li>• 더 많은 사이트 추가</li>
                </ul>
                <p className="text-sm text-gray-600 mt-2">
                  목표: 사용자 10,000명
                </p>
              </div>
            </div>

            {/* Phase 3 */}
            <div className="flex gap-6">
              <div className="flex-shrink-0 w-32 text-center">
                <div className="inline-block bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-bold">
                  Phase 3
                </div>
                <p className="text-sm text-gray-600 mt-2">12개월~</p>
              </div>
              <div className="flex-1 bg-gray-50 rounded-lg p-6 border border-gray-200">
                <h4 className="font-bold text-gray-900 mb-2">
                  플랫폼 고도화
                </h4>
                <p className="text-gray-700 mb-3">
                  광고주와 리뷰어를 직접 연결하는 플랫폼
                </p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• 광고주 셀프 캠페인 등록</li>
                  <li>• 신뢰도 기반 리뷰어 매칭</li>
                  <li>• 통합 중개 플랫폼</li>
                </ul>
                <p className="text-sm text-gray-600 mt-2">
                  목표: 사용자 30,000명
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="bg-white rounded-2xl shadow-sm p-10">
          <h3 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            자주 묻는 질문
          </h3>

          <div className="space-y-6 max-w-3xl mx-auto">
            <div className="border-b border-gray-200 pb-6">
              <h4 className="font-bold text-gray-900 mb-3 text-lg">
                Q. 구글 캘린더가 없어도 사용할 수 있나요?
              </h4>
              <p className="text-gray-700">
                A. 네! 구글 캘린더 연동은 선택 사항입니다.
                검색, 북마크, 신청 관리 기능은 캘린더 없이도 모두 이용하실 수 있습니다.
              </p>
            </div>

            <div className="border-b border-gray-200 pb-6">
              <h4 className="font-bold text-gray-900 mb-3 text-lg">
                Q. 회원가입이 필요한가요?
              </h4>
              <p className="text-gray-700">
                A. 검색은 로그인 없이도 가능합니다. 북마크, 신청 관리, 캘린더 연동 기능은
                로그인이 필요합니다. 카카오, 구글, 네이버 계정으로 간편하게 가입하실 수 있습니다.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-gray-900 mb-3 text-lg">
                Q. 어떻게 운영되나요?
              </h4>
              <p className="text-gray-700">
                A. 현재는 성장에 집중하고 있으며, 향후 사용자가 늘어나면
                광고나 중개 플랫폼으로 발전할 계획입니다.
                변화가 있을 때는 미리 공지하고 사용자 의견을 반영하겠습니다.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        {!currentUser && (
          <div className="mt-16 text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              지금 바로 시작하세요
            </h3>
            <p className="text-gray-600 mb-6">
              간편한 소셜 로그인으로 시작하기
            </p>
            <Link
              href="/login"
              className="inline-block px-10 py-4 bg-blue-600 text-white text-lg font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg"
            >
              시작하기 →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
