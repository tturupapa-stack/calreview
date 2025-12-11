"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ContactForm } from "@/components/features/ContactForm";
import { Header } from "@/components/ui/Header";
import { Footer } from "@/components/ui/Footer";

const inquiryTypes = [
  { value: "general", label: "일반 문의", icon: "💬" },
  { value: "technical", label: "기술 지원", icon: "🔧" },
  { value: "partnership", label: "파트너십 문의", icon: "🤝" },
  { value: "program_request", label: "프로그램 등록 요청", icon: "📝" },
  { value: "other", label: "기타", icon: "📌" },
] as const;

export default function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">문의하기</h1>
          <p className="text-gray-600">
            궁금한 점이나 제안사항이 있으시면 언제든지 문의해주세요.
            <br />
            빠른 시일 내에 답변드리겠습니다.
          </p>
        </div>

        <ContactForm inquiryTypes={inquiryTypes} />

        <div className="mt-12 pt-8 border-t border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">자주 묻는 질문</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900 mb-1">Q. 프로그램 등록은 어떻게 하나요?</h3>
              <p className="text-sm text-gray-600">
                문의 유형에서 "프로그램 등록 요청"을 선택하시고, 프로그램 정보와 연락처를 남겨주세요.
                검토 후 연락드리겠습니다.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-1">Q. 답변은 얼마나 걸리나요?</h3>
              <p className="text-sm text-gray-600">
                일반 문의는 1-2일 내, 기술 지원은 2-3일 내 답변드립니다.
                긴급한 경우 이메일로 별도 연락 부탁드립니다.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-1">Q. 파트너십 문의는 어떻게 하나요?</h3>
              <p className="text-sm text-gray-600">
                "파트너십 문의"를 선택하시고, 회사 정보와 협업 제안 내용을 작성해주세요.
                담당자가 검토 후 연락드리겠습니다.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
