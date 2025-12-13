/**
 * Google Analytics 4 통합
 * 사용자 행동 추적 및 전환 퍼널 분석
 */

declare global {
  interface Window {
    dataLayer: any[];
    gtag?: (...args: any[]) => void;
  }
}

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID;

// Google Analytics 초기화
export function initGA() {
  if (typeof window === 'undefined' || !GA_MEASUREMENT_ID) return;
  
  // gtag 스크립트 로드
  const script = document.createElement('script');
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  script.async = true;
  document.head.appendChild(script);
  
  window.dataLayer = window.dataLayer || [];
  function gtag(...args: any[]) {
    window.dataLayer.push(args);
  }
  gtag('js', new Date());
  gtag('config', GA_MEASUREMENT_ID);
  
  (window as any).gtag = gtag;
}

// 이벤트 추적
export function trackEvent(
  eventName: string,
  params?: Record<string, any>
) {
  if (typeof window === 'undefined' || !(window as any).gtag) return;
  
  (window as any).gtag('event', eventName, params);
}

// 핵심 이벤트 정의
export const events = {
  search: (query: string, filters?: Record<string, any>) => {
    trackEvent('search', {
      search_term: query,
      filters: filters ? JSON.stringify(filters) : undefined,
    });
  },
  
  campaign_click: (campaignId: string, position: number) => {
    trackEvent('campaign_click', {
      campaign_id: campaignId,
      position,
    });
  },
  
  bookmark_add: (campaignId: string) => {
    trackEvent('bookmark_add', { campaign_id: campaignId });
  },
  
  bookmark_remove: (campaignId: string) => {
    trackEvent('bookmark_remove', { campaign_id: campaignId });
  },
  
  selection_mark: (applicationId: string) => {
    trackEvent('selection_mark', { application_id: applicationId });
  },
  
  calendar_sync: (applicationId: string) => {
    trackEvent('calendar_sync', { application_id: applicationId });
  },
  
  original_site_click: (campaignId: string, source: string) => {
    trackEvent('original_site_click', {
      campaign_id: campaignId,
      source,
    });
  },
};

// 전환 퍼널 추적
export function trackConversionFunnel(step: string, data?: any) {
  trackEvent('conversion_funnel', {
    step,
    ...data,
  });
}
