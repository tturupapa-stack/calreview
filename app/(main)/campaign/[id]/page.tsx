import { createClient } from "@/lib/supabase-server";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { BookmarkButton } from "@/components/features/BookmarkButton";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CampaignDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: campaign, error } = await supabase
    .from("campaigns")
    .select("*")
    .eq("id", id)
    .eq("is_active", true)
    .single();

  if (error || !campaign) {
    notFound();
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href="/search"
          className="text-sm text-blue-600 hover:text-blue-700 mb-4 inline-block"
        >
          ← 검색 결과로 돌아가기
        </Link>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {(campaign.thumbnail_url || campaign.image_url) && (
            <div className="relative w-full h-64 sm:h-96 bg-gray-200">
              <Image
                src={campaign.thumbnail_url || campaign.image_url || ""}
                alt={campaign.title}
                fill
                className="object-cover"
                sizes="100vw"
                priority
              />
            </div>
          )}

          <div className="p-6 sm:p-8">
            <div className="flex items-start justify-between mb-4">
              <div>
                <span className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded">
                  {campaign.source === "reviewnote" && "리뷰노트"}
                  {campaign.source === "dinnerqueen" && "디너의여왕"}
                  {campaign.source === "gangnam" && "강남맛집"}
                  {campaign.source === "reviewplace" && "리뷰플레이스"}
                  {campaign.source === "seoulouba" && "서울오빠"}
                  {campaign.source === "modooexperience" && "모두의체험단"}
                  {campaign.source === "pavlovu" && "파블로"}
                </span>
              </div>
              {campaign.deadline && (
                <span className="text-sm font-medium text-red-600">
                  {campaign.deadline}
                </span>
              )}
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-6">
              {campaign.title}
            </h1>

            {/* 원본 사이트 버튼 - 상단으로 이동 */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
              <a
                href={campaign.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 rounded-md bg-blue-600 px-6 py-4 text-center text-base font-bold text-white hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                원본 사이트에서 신청하기
              </a>
              <BookmarkButton 
                campaignId={campaign.id}
                sourceUrl={campaign.source_url}
              />
            </div>

            {campaign.description && (
              <p className="text-gray-700 mb-6 whitespace-pre-line">
                {campaign.description}
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {campaign.category && (
                <div>
                  <span className="text-sm font-medium text-gray-500">카테고리</span>
                  <p className="text-gray-900">{campaign.category}</p>
                </div>
              )}
              {(campaign.region || campaign.location) && (
                <div>
                  <span className="text-sm font-medium text-gray-500">지역</span>
                  <p className="text-gray-900">{campaign.region || campaign.location}</p>
                </div>
              )}
              {campaign.channel && (
                <div>
                  <span className="text-sm font-medium text-gray-500">채널</span>
                  <p className="text-gray-900">{campaign.channel}</p>
                </div>
              )}
              {campaign.type && (
                <div>
                  <span className="text-sm font-medium text-gray-500">유형</span>
                  <p className="text-gray-900">
                    {campaign.type === "visit" && "방문형"}
                    {campaign.type === "delivery" && "배송형"}
                    {campaign.type === "reporter" && "기자단"}
                  </p>
                </div>
              )}
              {campaign.application_deadline && (
                <div>
                  <span className="text-sm font-medium text-gray-500">신청 마감일</span>
                  <p className="text-gray-900">
                    {new Date(campaign.application_deadline).toLocaleDateString("ko-KR")}
                  </p>
                </div>
              )}
              {campaign.review_deadline_days && (
                <div>
                  <span className="text-sm font-medium text-gray-500">리뷰 기간</span>
                  <p className="text-gray-900">{campaign.review_deadline_days}일</p>
                  <p className="text-xs text-gray-500 mt-1">
                    선정일 기준 {campaign.review_deadline_days}일 이내 리뷰 작성
                  </p>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

