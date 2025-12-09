import Image from "next/image";

interface ChannelIconProps {
    channel: string;
    size?: number;
    className?: string;
}

export function ChannelIcon({ channel, size = 16, className = "" }: ChannelIconProps) {
    const normalizedChannel = channel.toLowerCase();
    let iconSrc = "";
    let altText = channel;

    // Icon mapping logic
    if (normalizedChannel.includes("블로그")) {
        // Return SVG directly for Blog to avoid background issues with the image
        return (
            <svg
                width={size}
                height={size}
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className={className}
            >
                <title>네이버 블로그</title>
                <rect width="24" height="24" rx="5" fill="#03C75A" />
                <path
                    d="M14.5 16H9.5C9.22 16 9 15.78 9 15.5V8.5C9 8.22 9.22 8 9.5 8H12.5C14.16 8 15.5 9.34 15.5 11C15.5 11.66 15.29 12.26 14.93 12.76C15.58 13.11 16 13.79 16 14.5C16 15.33 15.33 16 14.5 16ZM11 10V11.5H12.5C12.78 11.5 13 11.28 13 11C13 10.72 12.78 10.5 12.5 10.5H11ZM11 13.5V14H14C14.28 14 14.5 13.78 14.5 13.5C14.5 13.22 14.28 13 14 13H11V13.5Z"
                    fill="white"
                />
            </svg>
        );
    } else if (normalizedChannel.includes("인스타")) {
        iconSrc = "/icons/instagram.png";
        altText = "인스타그램";
    } else if (normalizedChannel.includes("릴스")) {
        iconSrc = "/icons/instagram_reels.png";
        altText = "인스타그램 릴스";
    } else if (normalizedChannel.includes("유튜브")) {
        iconSrc = "/icons/youtube.png";
        altText = "유튜브";
    } else if (normalizedChannel.includes("쇼츠")) {
        iconSrc = "/icons/youtube_shorts.png";
        altText = "유튜브 쇼츠";
    } else if (normalizedChannel.includes("틱톡")) {
        iconSrc = "/icons/tiktok.png";
        altText = "틱톡";
    } else if (normalizedChannel.includes("클립")) {
        iconSrc = "/icons/naver_clip.png";
        altText = "네이버 클립";
    } else if (normalizedChannel.includes("기자단")) {
        // Fallback for reporter as text/svg
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
    } else {
        // Default Fallback
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

    return (
        <div style={{ width: size, height: size }} className={`relative ${className}`}>
            <Image
                src={iconSrc}
                alt={altText}
                fill
                className="object-contain"
                sizes={`${size}px`}
                unoptimized
            />
        </div>
    );
}
