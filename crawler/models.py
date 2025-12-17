from __future__ import annotations

from dataclasses import dataclass
from typing import Optional, Literal


SiteName = Literal[
    "reviewnote", "revu", "dinnerqueen", "gangnam", "reviewplace", "seoulouba", "modooexperience", "pavlovu",
    "stylec", "modan", "myinfluencer", "chuble", "real_review", "dinodan"
]


@dataclass
class Campaign:
    """공통 캠페인 스키마.

    Phase 2에서는 크롤링/저장용 최소 필드만 정의한다.
    """

    title: str
    url: str
    site_name: SiteName
    category: Optional[str] = None
    deadline: Optional[str] = None  # ISO 날짜 문자열 (YYYY-MM-DD) 권장
    location: Optional[str] = None
    image_url: Optional[str] = None  # 메인 썸네일 이미지 URL
    channel: Optional[str] = None  # 채널 정보 (인스타, 블로그, 클립, 릴스 등)
    type: Optional[str] = None  # 캠페인 유형 (visit, delivery, reporter 등)
    review_deadline_days: Optional[int] = None  # 리뷰 기간 (일수)
    recruit_count: Optional[int] = None  # 모집인원
    applicant_count: Optional[int] = None  # 신청자수

