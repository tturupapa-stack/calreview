"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface CalendarEvent {
  id: string;
  date: string;
  type: "visit" | "deadline";
  title: string;
  applicationId: string;
  campaignId: string;
  isInGoogleCalendar: boolean;
}

interface CalendarProps {
  events: CalendarEvent[];
}

export function Calendar({ events }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // 해당 월의 첫날과 마지막 날
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  // 달력 시작일 (이전 달 포함)
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay());

  // 달력 종료일 (다음 달 포함)
  const endDate = new Date(lastDay);
  endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()));

  // 날짜 배열 생성
  const dates: Date[] = [];
  const current = new Date(startDate);
  while (current <= endDate) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  // 날짜별 이벤트 맵
  const eventsByDate: Record<string, CalendarEvent[]> = {};
  events.forEach((event) => {
    if (!eventsByDate[event.date]) {
      eventsByDate[event.date] = [];
    }
    eventsByDate[event.date].push(event);
  });

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          {year}년 {month + 1}월
        </h2>
        <div className="flex gap-2">
          <button
            onClick={prevMonth}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            aria-label="이전 달"
          >
            <svg
              className="w-5 h-5 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          >
            오늘
          </button>
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            aria-label="다음 달"
          >
            <svg
              className="w-5 h-5 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {["일", "월", "화", "수", "목", "금", "토"].map((day, index) => (
          <div
            key={day}
            className={`text-center text-sm font-medium py-2 ${
              index === 0 ? "text-red-600" : index === 6 ? "text-blue-600" : "text-gray-700"
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* 날짜 그리드 */}
      <div className="grid grid-cols-7 gap-2">
        {dates.map((date) => {
          const dateStr = date.toISOString().split("T")[0];
          const dayEvents = eventsByDate[dateStr] || [];
          const isCurrentMonth = date.getMonth() === month;
          const isToday = date.getTime() === today.getTime();
          const isWeekend = date.getDay() === 0 || date.getDay() === 6;

          return (
            <div
              key={dateStr}
              className={`min-h-[80px] p-2 border rounded-lg ${
                isCurrentMonth ? "bg-white" : "bg-gray-50"
              } ${isToday ? "border-blue-500 border-2" : "border-gray-200"} ${
                dayEvents.length > 0 ? "cursor-pointer hover:bg-gray-50" : ""
              } transition-colors`}
              onClick={() => dayEvents.length > 0 && setSelectedDate(dateStr)}
            >
              <div
                className={`text-sm font-medium mb-1 ${
                  !isCurrentMonth
                    ? "text-gray-400"
                    : isToday
                    ? "text-blue-600 font-bold"
                    : isWeekend && date.getDay() === 0
                    ? "text-red-600"
                    : isWeekend
                    ? "text-blue-600"
                    : "text-gray-900"
                }`}
              >
                {date.getDate()}
              </div>

              {/* 이벤트 표시 */}
              <div className="space-y-1">
                {dayEvents.slice(0, 2).map((event) => (
                  <div
                    key={event.id}
                    className={`text-xs px-1.5 py-0.5 rounded truncate ${
                      event.type === "visit"
                        ? "bg-green-100 text-green-800"
                        : "bg-orange-100 text-orange-800"
                    }`}
                    title={event.title}
                  >
                    {event.type === "visit" ? "📍" : "📝"} {event.title.slice(0, 8)}
                    {event.title.length > 8 ? "..." : ""}
                  </div>
                ))}
                {dayEvents.length > 2 && (
                  <div className="text-xs text-gray-500 text-center">
                    +{dayEvents.length - 2}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 범례 */}
      <div className="mt-6 flex items-center justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-100 border border-green-200 rounded"></div>
          <span className="text-gray-600">방문일</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-orange-100 border border-orange-200 rounded"></div>
          <span className="text-gray-600">리뷰 마감일</span>
        </div>
      </div>

      {/* 선택된 날짜의 이벤트 상세 모달 */}
      {selectedDate && eventsByDate[selectedDate] && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedDate(null)}
        >
          <div
            className="bg-white rounded-lg p-6 max-w-md w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {new Date(selectedDate).toLocaleDateString("ko-KR", {
                  month: "long",
                  day: "numeric",
                })}
                의 일정
              </h3>
              <button
                onClick={() => setSelectedDate(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-3">
              {eventsByDate[selectedDate].map((event) => (
                <div
                  key={event.id}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">
                        {event.type === "visit" ? "📍" : "📝"}
                      </span>
                      <span className="font-medium text-gray-900">
                        {event.type === "visit" ? "방문일" : "리뷰 마감일"}
                      </span>
                    </div>
                    {event.isInGoogleCalendar && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        📅 캘린더 연동
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 mb-3">{event.title}</p>
                  <Link
                    href={`/campaign/${event.campaignId}`}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    상세 보기 →
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

