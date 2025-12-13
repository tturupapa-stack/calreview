"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Bookmark, CheckCircle, Calendar, ArrowRight, ArrowDown, CheckCircle2, MapPin, Clock, ExternalLink } from "lucide-react";

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
            Cally 서비스 이용 가이드
          </h1>
          <p className="text-xl text-gray-600">
            체험단 검색부터 일정 관리까지, 단계별로 쉽게 따라해보세요
          </p>
        </div>

        {/* 서비스 이용가이드 인포그라피 */}
        <div className="max-w-6xl mx-auto mb-16">
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 border-2 border-gray-100">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-3">
                어떻게 사용하나요?
              </h2>
              <p className="text-gray-600">
                아래 가이드를 따라 단계별로 이용해보세요
              </p>
            </div>

            {/* 단계별 가이드 인포그라피 */}
            <div className="space-y-8">
              {/* Step 1: 체험단 검색 */}
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="flex-1 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border-2 border-blue-200 shadow-md">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                      1
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <Search className="w-6 h-6 text-blue-600" />
                        <h3 className="text-xl font-bold text-gray-900">체험단 검색</h3>
                      </div>
                      <p className="text-gray-700 mb-4">
                        검색 페이지에서 원하는 체험단을 찾아보세요. 여러 사이트의 체험단을 한 번에 검색할 수 있습니다.
                      </p>
                      <div className="bg-white rounded-lg p-4 mb-3 border border-blue-200">
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                          <Search className="w-4 h-4" />
                          <span className="font-medium">검색 예시</span>
                        </div>
                        <div className="space-y-1 text-sm">
                          <div className="text-gray-700">• "강남 맛집 체험단"</div>
                          <div className="text-gray-700">• "뷰티 제품 배송형"</div>
                          <div className="text-gray-700">• "마감임박 숙박"</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-blue-600">
                        <ExternalLink className="w-4 h-4" />
                        <span>검색 페이지로 이동</span>
                      </div>
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-8 h-8 text-blue-600 hidden md:block flex-shrink-0" />
                <ArrowDown className="w-8 h-8 text-blue-600 block md:hidden flex-shrink-0 my-2" />
              </div>

              {/* Step 2: 북마크 저장 */}
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="flex-1 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border-2 border-purple-200 shadow-md">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                      2
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <Bookmark className="w-6 h-6 text-purple-600" />
                        <h3 className="text-xl font-bold text-gray-900">북마크 저장</h3>
                      </div>
                      <p className="text-gray-700 mb-4">
                        관심있는 체험단을 북마크에 저장하세요. 나중에 쉽게 찾아볼 수 있습니다.
                      </p>
                      <div className="bg-white rounded-lg p-4 mb-3 border border-purple-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">체험단 카드</span>
                          <button className="p-2 hover:bg-purple-50 rounded-lg transition-colors">
                            <Bookmark className="w-5 h-5 text-purple-600 fill-purple-600" />
                          </button>
                        </div>
                        <div className="text-xs text-gray-500">북마크 버튼 클릭</div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-purple-600">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>북마크에 저장되었습니다</span>
                      </div>
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-8 h-8 text-purple-600 hidden md:block flex-shrink-0" />
                <ArrowDown className="w-8 h-8 text-purple-600 block md:hidden flex-shrink-0 my-2" />
              </div>

              {/* Step 3: 신청 및 선정 */}
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="flex-1 bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border-2 border-green-200 shadow-md">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                      3
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                        <h3 className="text-xl font-bold text-gray-900">신청 및 선정</h3>
                      </div>
                      <p className="text-gray-700 mb-4">
                        체험단에 신청하고, 당첨되면 선정 상태로 변경하세요. 리뷰 마감일이 자동으로 계산됩니다.
                      </p>
                      <div className="bg-white rounded-lg p-4 mb-3 border border-green-200">
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-gray-700">원본 사이트에서 신청</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="text-gray-700">당첨 시 '선정' 버튼 클릭</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-green-600" />
                            <span className="text-gray-700">리뷰 마감일 자동 계산</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-green-600">
                        마이페이지 → 내 체험단에서 관리
                      </div>
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-8 h-8 text-green-600 hidden md:block flex-shrink-0" />
                <ArrowDown className="w-8 h-8 text-green-600 block md:hidden flex-shrink-0 my-2" />
              </div>

              {/* Step 4: 캘린더 연동 */}
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="flex-1 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border-2 border-orange-200 shadow-md">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-orange-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                      4
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <Calendar className="w-6 h-6 text-orange-600" />
                        <h3 className="text-xl font-bold text-gray-900">캘린더 연동</h3>
                      </div>
                      <p className="text-gray-700 mb-4">
                        구글 캘린더와 연동하면 선정된 체험단의 방문일과 리뷰 마감일이 자동으로 등록됩니다.
                      </p>
                      <div className="bg-white rounded-lg p-4 mb-3 border border-orange-200">
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-orange-600" />
                            <span className="text-gray-700">설정 페이지에서 구글 캘린더 연결</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                            <span className="text-gray-700">선정 시 자동으로 일정 등록</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-orange-600">
                        설정 → 구글 캘린더 연동
                      </div>
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-8 h-8 text-orange-600 hidden md:block flex-shrink-0" />
                <ArrowDown className="w-8 h-8 text-orange-600 block md:hidden flex-shrink-0 my-2" />
              </div>

              {/* Step 5: 일정 관리 */}
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="flex-1 bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl p-6 border-2 border-pink-200 shadow-md">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-pink-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                      5
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <MapPin className="w-6 h-6 text-pink-600" />
                        <h3 className="text-xl font-bold text-gray-900">일정 관리</h3>
                      </div>
                      <p className="text-gray-700 mb-4">
                        마이페이지에서 모든 체험단 일정을 한눈에 확인하고 관리하세요. 마감 임박 알림도 받을 수 있습니다.
                      </p>
                      <div className="bg-white rounded-lg p-4 mb-3 border border-pink-200">
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-pink-600" />
                            <span className="text-gray-700">캘린더 뷰로 전체 일정 확인</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-red-500" />
                            <span className="text-gray-700">D-3 이하 체험단 자동 강조</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-pink-600" />
                            <span className="text-gray-700">방문 예정일 입력 및 관리</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-pink-600">
                        마이페이지 → 내 체험단 → 캘린더 뷰
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-12 text-center">
              <Link
                href={currentUser ? "/search" : "/login"}
                className="inline-block px-10 py-4 bg-blue-600 text-white text-lg font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg"
              >
                {currentUser ? "체험단 검색하러 가기 →" : "지금 시작하기 →"}
              </Link>
            </div>
          </div>
        </div>

        {/* 주요 기능 요약 */}
        <div className="max-w-4xl mx-auto mb-16">
          <div className="bg-gradient-to-br from-primary/5 to-secondary rounded-2xl shadow-lg p-8 border-2 border-primary/20">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              핵심 기능
            </h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-4 text-center">
                <div className="text-2xl mb-2">🔍</div>
                <div className="font-semibold text-gray-900 mb-1">통합 검색</div>
                <div className="text-sm text-gray-600">여러 사이트 한 번에</div>
              </div>
              <div className="bg-white rounded-lg p-4 text-center">
                <div className="text-2xl mb-2">⭐</div>
                <div className="font-semibold text-gray-900 mb-1">북마크</div>
                <div className="text-sm text-gray-600">관심 체험단 저장</div>
              </div>
              <div className="bg-white rounded-lg p-4 text-center">
                <div className="text-2xl mb-2">📅</div>
                <div className="font-semibold text-gray-900 mb-1">캘린더 연동</div>
                <div className="text-sm text-gray-600">일정 자동 등록</div>
              </div>
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
