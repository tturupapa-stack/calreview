"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import Link from "next/link";
import { validateFile, MAX_FILE_SIZE } from "@/constants/file-upload";

const contactSchema = z.object({
  name: z.string().min(1, "이름을 입력해주세요").max(50, "이름은 50자 이하여야 합니다"),
  email: z.string().email("올바른 이메일 형식이 아닙니다"),
  phone: z.string().optional(),
  inquiryType: z.enum(["general", "technical", "partnership", "program_request", "other"]),
  subject: z.string().min(1, "제목을 입력해주세요").max(100, "제목은 100자 이하여야 합니다"),
  content: z.string().min(10, "내용은 최소 10자 이상 입력해주세요"),
  file: z.any().optional(), // File은 optional로 처리
});

type ContactFormData = z.infer<typeof contactSchema>;

interface InquiryType {
  value: string;
  label: string;
  icon: string;
}

interface ContactFormProps {
  inquiryTypes: readonly InquiryType[];
}

export function ContactForm({ inquiryTypes }: ContactFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      inquiryType: "general",
    },
  });

  const selectedInquiryType = watch("inquiryType");
  const selectedTypeInfo = inquiryTypes.find((t) => t.value === selectedInquiryType);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 파일 검증
      const validation = validateFile(file);
      if (!validation.valid) {
        toast.error(validation.error || "파일 검증에 실패했습니다");
        e.target.value = ""; // 파일 선택 초기화
        return;
      }
      setSelectedFile(file);
      setValue("file", file);
    } else {
      setSelectedFile(null);
      setValue("file", undefined);
    }
  };

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);

    try {
      // 현재 사용자 정보 가져오기
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // 파일 업로드 (있는 경우)
      let attachmentUrl: string | null = null;
      let attachmentFilename: string | null = null;

      if (selectedFile) {
        const fileExt = selectedFile.name.split(".").pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `inquiries/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("inquiries")
          .upload(filePath, selectedFile, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          throw new Error("파일 업로드 실패: " + uploadError.message);
        }

        // Public URL 생성 (비공개 버킷이므로 signed URL 필요할 수 있음)
        // 일단 publicUrl을 사용하되, 나중에 signed URL로 변경 가능
        const {
          data: { publicUrl },
        } = supabase.storage.from("inquiries").getPublicUrl(filePath);

        attachmentUrl = publicUrl;
        attachmentFilename = selectedFile.name;
      }

      // 문의 데이터 저장
      const { error: insertError } = await supabase.from("inquiries").insert({
        user_id: user?.id || null,
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        inquiry_type: data.inquiryType,
        subject: data.subject,
        content: data.content,
        attachment_url: attachmentUrl,
        attachment_filename: attachmentFilename,
        status: "pending",
      });

      if (insertError) {
        throw new Error("문의 제출 실패: " + insertError.message);
      }

      toast.success("문의가 성공적으로 제출되었습니다. 빠른 시일 내에 답변드리겠습니다.");
      reset();
      setSelectedFile(null);
      router.refresh();
    } catch (error: any) {
      console.error("문의 제출 오류:", error);
      toast.error(error.message || "문의 제출 중 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* 이름 */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          이름 <span className="text-red-500">*</span>
        </label>
        <input
          id="name"
          type="text"
          {...register("name")}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          placeholder="홍길동"
        />
        {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>}
      </div>

      {/* 이메일 */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          이메일 <span className="text-red-500">*</span>
        </label>
        <input
          id="email"
          type="email"
          {...register("email")}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          placeholder="example@email.com"
        />
        {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>}
      </div>

      {/* 전화번호 */}
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
          전화번호 <span className="text-gray-400 text-xs">(선택)</span>
        </label>
        <input
          id="phone"
          type="tel"
          {...register("phone")}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          placeholder="010-1234-5678"
        />
        {errors.phone && <p className="mt-1 text-sm text-red-500">{errors.phone.message}</p>}
      </div>

      {/* 문의 유형 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          문의 유형 <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {inquiryTypes.map((type) => (
            <label
              key={type.value}
              className={`flex items-center gap-2 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                selectedInquiryType === type.value
                  ? "border-primary bg-primary/5"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <input
                type="radio"
                value={type.value}
                {...register("inquiryType")}
                className="sr-only"
              />
              <span className="text-xl">{type.icon}</span>
              <span className="text-sm font-medium">{type.label}</span>
            </label>
          ))}
        </div>
        {errors.inquiryType && (
          <p className="mt-1 text-sm text-red-500">{errors.inquiryType.message}</p>
        )}
      </div>

      {/* 제목 */}
      <div>
        <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
          제목 <span className="text-red-500">*</span>
        </label>
        <input
          id="subject"
          type="text"
          {...register("subject")}
          maxLength={100}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          placeholder="문의 제목을 입력해주세요"
        />
        <div className="flex justify-between mt-1">
          {errors.subject && <p className="text-sm text-red-500">{errors.subject.message}</p>}
          <p className="text-xs text-gray-400 ml-auto">
            {watch("subject")?.length || 0}/100
          </p>
        </div>
      </div>

      {/* 내용 */}
      <div>
        <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
          내용 <span className="text-red-500">*</span>
        </label>
        <textarea
          id="content"
          {...register("content")}
          rows={8}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
          placeholder="문의 내용을 상세히 입력해주세요 (최소 10자)"
        />
        <div className="flex justify-between mt-1">
          {errors.content && <p className="text-sm text-red-500">{errors.content.message}</p>}
          <p className="text-xs text-gray-400 ml-auto">
            {watch("content")?.length || 0}자
          </p>
        </div>
      </div>

      {/* 파일 첨부 */}
      <div>
        <label htmlFor="file" className="block text-sm font-medium text-gray-700 mb-1">
          파일 첨부{" "}
          <span className="text-gray-400 text-xs">
            (선택, 최대 {MAX_FILE_SIZE / (1024 * 1024)}MB)
          </span>
        </label>
        <input
          id="file"
          type="file"
          accept=".jpg,.jpeg,.png,.pdf,.hwp"
          onChange={handleFileChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
        />
        {selectedFile && (
          <p className="mt-2 text-sm text-gray-600">
            선택된 파일: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
          </p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          jpg, png, pdf, hwp 파일만 업로드 가능합니다
        </p>
      </div>

      {/* 제출 버튼 */}
      <div className="pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-primary text-white py-3 px-6 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <svg
                className="animate-spin h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              제출 중...
            </>
          ) : (
            "문의 제출"
          )}
        </button>
      </div>
    </form>
  );
}
