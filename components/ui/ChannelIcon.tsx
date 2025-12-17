import Image from "next/image";

interface ChannelIconProps {
    channel: string;
    size?: number;
    className?: string;
}

// 채널별 아이콘 매핑
const CHANNEL_ICONS: Record<string, { src: string; alt: string }> = {
    블로그: { src: "/icons/naver_blog.png", alt: "네이버 블로그" },
    인스타: { src: "/icons/instagram.png", alt: "인스타그램" },
    릴스: { src: "/icons/instagram_reels.png", alt: "인스타그램 릴스" },
    유튜브: { src: "/icons/youtube.png", alt: "유튜브" },
    쇼츠: { src: "/icons/youtube_shorts.png", alt: "유튜브 쇼츠" },
    틱톡: { src: "/icons/tiktok.png", alt: "틱톡" },
    클립: { src: "/icons/naver_clip.png", alt: "네이버 클립" },
};

export function ChannelIcon({ channel, size = 16, className = "" }: ChannelIconProps) {
    const normalizedChannel = channel.toLowerCase();

    // 채널 키워드 매칭
    let iconInfo: { src: string; alt: string } | null = null;

    if (normalizedChannel.includes("블로그")) {
        iconInfo = CHANNEL_ICONS["블로그"];
    } else if (normalizedChannel.includes("릴스")) {
        // 릴스를 인스타보다 먼저 체크 (릴스도 인스타 포함할 수 있음)
        iconInfo = CHANNEL_ICONS["릴스"];
    } else if (normalizedChannel.includes("인스타")) {
        iconInfo = CHANNEL_ICONS["인스타"];
    } else if (normalizedChannel.includes("쇼츠")) {
        // 쇼츠를 유튜브보다 먼저 체크
        iconInfo = CHANNEL_ICONS["쇼츠"];
    } else if (normalizedChannel.includes("유튜브")) {
        iconInfo = CHANNEL_ICONS["유튜브"];
    } else if (normalizedChannel.includes("틱톡")) {
        iconInfo = CHANNEL_ICONS["틱톡"];
    } else if (normalizedChannel.includes("클립")) {
        iconInfo = CHANNEL_ICONS["클립"];
    } else if (normalizedChannel.includes("기자단")) {
        // 기자단은 SVG 아이콘 사용
        return (
            <svg
                width={size}
                height={size}
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className={className}
            >
                <title>기자단</title>
                <rect width="24" height="24" rx="5" fill="#4B5563" />
                <path d="M14 17H7V15H14V17ZM17 13H7V11H17V13ZM17 9H7V7H17V9Z" fill="white" />
            </svg>
        );
    }

    // 매칭된 아이콘이 있으면 이미지 표시
    if (iconInfo) {
        return (
            <div style={{ width: size, height: size }} className={`relative ${className}`}>
                <Image
                    src={iconInfo.src}
                    alt={iconInfo.alt}
                    fill
                    className="object-contain"
                    sizes={`${size}px`}
                    unoptimized
                />
            </div>
        );
    }

    // 기본 폴백: 빈 원 아이콘
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <circle cx="12" cy="12" r="10" strokeWidth="2" />
        </svg>
    );
}
