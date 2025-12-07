
"use client";

import Image from "next/image";
import { useState } from "react";

interface SiteLogoProps {
    site: string;
    siteName?: string; // Optional human-readable name for fallback/alt
    className?: string;
    size?: number; // Approximate size in px (logos are usually wide, so this affects height)
}

// Logo URL Mapping
const SiteLogoUrl: Record<string, string> = {
    seoulouba: "/images/logos/seoulouba.png",
    reviewplace: "/images/logos/reviewplace.png",
    reviewnote: "https://logo.clearbit.com/reviewnote.co.kr",
    dinnerqueen: "/images/logos/dinnerqueen.png",
    modooexperience: "/images/logos/modooexperience.png",
    pavlovu: "/images/logos/pavlovu.png",
    gangnam: "https://www.google.com/s2/favicons?domain=xn--939au0g4vj8sq.net&sz=64", // Fallback for Gangnam
};

// Logo specific visual adjustments (Optical Sizing)
const LogoStyle: Record<string, { scale: number; translateY: number }> = {
    seoulouba: { scale: 1.0, translateY: 0 }, // Reset scale to avoid overwhelming text
    reviewplace: { scale: 1.0, translateY: 0 }, // Reset scale
    modooexperience: { scale: 1.1, translateY: 1 },
    reviewnote: { scale: 1.0, translateY: 0 },
    dinnerqueen: { scale: 1.0, translateY: 0 },
    pavlovu: { scale: 1.0, translateY: 0 },
    gangnam: { scale: 1.0, translateY: 0 },
};

export function SiteLogo({ site, siteName, className = "", size = 24 }: SiteLogoProps) {
    const [error, setError] = useState(false);

    const logoUrl = SiteLogoUrl[site];
    const name = siteName || site;
    const style = LogoStyle[site] || { scale: 1.0, translateY: 0 };

    if (error || !logoUrl) {
        return (
            // Fallback text badge
            <span className={`text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded inline-block ${className}`}>
                {name}
            </span>
        );
    }

    return (
        <div
            className={`relative inline-flex items-center justify-start ${className}`}
            style={{ height: size }}
        >
            <Image
                src={logoUrl}
                alt={`${name} 로고`}
                height={size * 2}
                width={size * 10}
                className="object-contain object-left"
                style={{
                    height: '100%',
                    width: 'auto',
                    transform: `scale(${style.scale}) translateY(${style.translateY}px)`,
                    transformOrigin: 'left center'
                }}
                onError={() => setError(true)}
                unoptimized
            />
        </div>
    );
}

