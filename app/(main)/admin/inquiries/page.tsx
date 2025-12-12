"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import Link from "next/link";

interface Inquiry {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  inquiry_type: string;
  subject: string;
  content: string;
  attachment_url: string | null;
  attachment_filename: string | null;
  status: "pending" | "in_progress" | "completed";
  admin_response: string | null;
  admin_response_at: string | null;
  created_at: string;
  user_id: string | null;
}

const inquiryTypeLabels: Record<string, string> = {
  general: "일반 문의",
  technical: "기술 지원",
  partnership: "파트너십 문의",
  program_request: "프로그램 등록 요청",
  other: "기타",
};

const statusLabels: Record<string, string> = {
  pending: "미처리",
  in_progress: "처리중",
  completed: "완료",
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  in_progress: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
};

export default function AdminInquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [responseText, setResponseText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkAdmin = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      // 관리자 권한 체크 API 호출
      try {
        const response = await fetch("/api/admin/check");
        if (!response.ok) {
          throw new Error("관리자 권한 체크 실패");
        }
        const { isAdmin } = await response.json();

        if (!isAdmin) {
          toast.error("관리자 권한이 필요합니다");
          router.push("/");
          return;
        }
      } catch (error) {
        console.error("관리자 권한 체크 오류:", error);
        toast.error("관리자 권한 확인 중 오류가 발생했습니다");
        router.push("/");
        return;
      }

      setIsAuthorized(true);
      fetchInquiries();
    };

    checkAdmin();
  }, [router, supabase]);

  const fetchInquiries = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/admin/inquiries");
      if (!response.ok) {
        throw new Error("문의 내역 조회 실패");
      }
      const { inquiries } = await response.json();
      setInquiries(inquiries || []);
    } catch (error: any) {
      console.error("문의 내역 조회 오류:", error);
      toast.error("문의 내역을 불러오는 중 오류가 발생했습니다");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (inquiryId: string, newStatus: string) => {
    try {
      const response = await fetch("/api/admin/inquiries", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: inquiryId, status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("상태 변경 실패");
      }

      toast.success("상태가 변경되었습니다");
      fetchInquiries();
      if (selectedInquiry?.id === inquiryId) {
        const { inquiry } = await response.json();
        setSelectedInquiry(inquiry);
      }
    } catch (error: any) {
      console.error("상태 변경 오류:", error);
      toast.error("상태 변경 중 오류가 발생했습니다");
    }
  };

  const handleSubmitResponse = async () => {
    if (!selectedInquiry || !responseText.trim()) {
      toast.error("답변 내용을 입력해주세요");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/admin/inquiries", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedInquiry.id,
          admin_response: responseText,
          status: "completed",
        }),
      });

      if (!response.ok) {
        throw new Error("답변 저장 실패");
      }

      toast.success("답변이 저장되었습니다");
      setResponseText("");
      setSelectedInquiry(null);
      fetchInquiries();
    } catch (error: any) {
      console.error("답변 저장 오류:", error);
      toast.error("답변 저장 중 오류가 발생했습니다");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredInquiries = inquiries.filter((inquiry) => {
    if (filterStatus !== "all" && inquiry.status !== filterStatus) return false;
    if (filterType !== "all" && inquiry.inquiry_type !== filterType) return false;
    return true;
  });

  const stats = {
    total: inquiries.length,
    pending: inquiries.filter((i) => i.status === "pending").length,
    in_progress: inquiries.filter((i) => i.status === "in_progress").length,
    completed: inquiries.filter((i) => i.status === "completed").length,
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">권한을 확인하는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">문의 관리</h1>
          <p className="text-gray-600">사용자 문의 내역을 확인하고 답변할 수 있습니다.</p>
        </div>

        {/* 통계 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-sm text-gray-500">전체</div>
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-sm text-gray-500">미처리</div>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-sm text-gray-500">처리중</div>
            <div className="text-2xl font-bold text-blue-600">{stats.in_progress}</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-sm text-gray-500">완료</div>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          </div>
        </div>

        {/* 필터 */}
        <div className="bg-white rounded-lg p-4 shadow-sm mb-6">
          <div className="flex gap-4 flex-wrap">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">상태</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="all">전체</option>
                <option value="pending">미처리</option>
                <option value="in_progress">처리중</option>
                <option value="completed">완료</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">유형</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="all">전체</option>
                <option value="general">일반 문의</option>
                <option value="technical">기술 지원</option>
                <option value="partnership">파트너십 문의</option>
                <option value="program_request">프로그램 등록 요청</option>
                <option value="other">기타</option>
              </select>
            </div>
          </div>
        </div>

        {/* 문의 목록 */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">로딩 중...</div>
          ) : filteredInquiries.length === 0 ? (
            <div className="p-8 text-center text-gray-500">문의 내역이 없습니다</div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredInquiries.map((inquiry) => (
                <div
                  key={inquiry.id}
                  className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => setSelectedInquiry(inquiry)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded ${statusColors[inquiry.status]}`}
                        >
                          {statusLabels[inquiry.status]}
                        </span>
                        <span className="text-xs text-gray-500">
                          {inquiryTypeLabels[inquiry.inquiry_type]}
                        </span>
                      </div>
                      <h3 className="font-medium text-gray-900 mb-1">{inquiry.subject}</h3>
                      <p className="text-sm text-gray-600 line-clamp-2">{inquiry.content}</p>
                      <div className="mt-2 text-xs text-gray-500">
                        {inquiry.name} ({inquiry.email}) ·{" "}
                        {new Date(inquiry.created_at).toLocaleString("ko-KR")}
                      </div>
                    </div>
                    <div className="ml-4">
                      <select
                        value={inquiry.status}
                        onChange={(e) => handleStatusChange(inquiry.id, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="text-sm border border-gray-300 rounded px-2 py-1"
                      >
                        <option value="pending">미처리</option>
                        <option value="in_progress">처리중</option>
                        <option value="completed">완료</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      {/* 상세 모달 */}
      {selectedInquiry && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">문의 상세</h2>
                <button
                  onClick={() => {
                    setSelectedInquiry(null);
                    setResponseText("");
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">상태</label>
                  <div className="mt-1">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded ${statusColors[selectedInquiry.status]}`}
                    >
                      {statusLabels[selectedInquiry.status]}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">문의 유형</label>
                  <p className="mt-1 text-gray-900">
                    {inquiryTypeLabels[selectedInquiry.inquiry_type]}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">이름</label>
                  <p className="mt-1 text-gray-900">{selectedInquiry.name}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">이메일</label>
                  <p className="mt-1 text-gray-900">
                    <a
                      href={`mailto:${selectedInquiry.email}`}
                      className="text-primary hover:underline"
                    >
                      {selectedInquiry.email}
                    </a>
                  </p>
                </div>

                {selectedInquiry.phone && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">전화번호</label>
                    <p className="mt-1 text-gray-900">{selectedInquiry.phone}</p>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-gray-500">제목</label>
                  <p className="mt-1 text-gray-900">{selectedInquiry.subject}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">내용</label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                    <p className="text-gray-900 whitespace-pre-wrap">{selectedInquiry.content}</p>
                  </div>
                </div>

                {selectedInquiry.attachment_url && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">첨부 파일</label>
                    <div className="mt-1">
                      <a
                        href={selectedInquiry.attachment_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {selectedInquiry.attachment_filename || "파일 다운로드"}
                      </a>
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-gray-500">등록일</label>
                  <p className="mt-1 text-gray-900">
                    {new Date(selectedInquiry.created_at).toLocaleString("ko-KR")}
                  </p>
                </div>

                {selectedInquiry.admin_response && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">관리자 답변</label>
                    <div className="mt-1 p-3 bg-blue-50 rounded-lg">
                      <p className="text-gray-900 whitespace-pre-wrap">
                        {selectedInquiry.admin_response}
                      </p>
                      {selectedInquiry.admin_response_at && (
                        <p className="mt-2 text-xs text-gray-500">
                          답변일: {new Date(selectedInquiry.admin_response_at).toLocaleString("ko-KR")}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {!selectedInquiry.admin_response && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 mb-2 block">
                      답변 작성
                    </label>
                    <textarea
                      value={responseText}
                      onChange={(e) => setResponseText(e.target.value)}
                      rows={6}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                      placeholder="답변 내용을 입력해주세요"
                    />
                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={handleSubmitResponse}
                        disabled={isSubmitting || !responseText.trim()}
                        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? "저장 중..." : "답변 저장"}
                      </button>
                      <button
                        onClick={() => {
                          setSelectedInquiry(null);
                          setResponseText("");
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        취소
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
