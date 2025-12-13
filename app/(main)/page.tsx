import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Search, Calendar, CheckCircle, Sparkles } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center space-y-10 py-24 px-4 text-center md:py-32 relative overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 -z-10">
          <Image
            src="/images/hero-background.png"
            alt="Hero background"
            fill
            className="object-cover opacity-30"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-background/50 to-background" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
        </div>

        {/* Floating decorative elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-primary/10 rounded-full blur-xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-32 h-32 bg-primary/5 rounded-full blur-2xl animate-pulse delay-1000" />

        <div className="space-y-6 max-w-3xl relative z-10">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-6 h-6 text-primary animate-pulse" />
            <span className="text-sm font-medium text-primary/80 bg-primary/10 px-3 py-1 rounded-full">
              체험단 통합 플랫폼
            </span>
          </div>
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl font-heading animate-in fade-in slide-in-from-bottom-4 duration-1000">
            체험단 통합 검색{" "}
            <span className="text-primary bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Cally
            </span>
          </h1>
          <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl leading-relaxed animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-200">
            여러 체험단 사이트를 한 곳에서 검색하고, <br className="hidden sm:inline" />
            당첨된 일정은 구글 캘린더에 자동으로 등록하세요.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 min-w-[300px] justify-center relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
          <Button asChild size="lg" className="h-12 px-8 text-lg shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all hover:scale-105">
            <Link href="/search">
              지금 시작하기
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="h-12 px-8 text-lg hover:bg-primary/5 hover:border-primary/30 transition-all">
            <Link href="/premium">
              서비스 소개
            </Link>
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20 max-w-7xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold font-heading mb-3">주요 기능</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            체험단 관리를 더 쉽고 효율적으로 만들어주는 강력한 기능들
          </p>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          <Card className="border-border/50 bg-background/80 backdrop-blur-sm hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-2 transition-all duration-300 group">
            <CardHeader>
              <div className="relative w-16 h-16 mb-4 mx-auto">
                <Image
                  src="/images/icon-search.png"
                  alt="통합 검색 아이콘"
                  fill
                  className="object-contain group-hover:scale-110 transition-transform duration-300"
                />
              </div>
              <CardTitle className="text-center">통합 검색</CardTitle>
              <CardDescription className="text-center">
                7개 이상의 주요 체험단 사이트를 <br />
                한 곳에서 실시간으로 검색하세요.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-border/50 bg-background/80 backdrop-blur-sm hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-2 transition-all duration-300 group">
            <CardHeader>
              <div className="relative w-16 h-16 mb-4 mx-auto">
                <Image
                  src="/images/icon-check.png"
                  alt="신청 관리 아이콘"
                  fill
                  className="object-contain group-hover:scale-110 transition-transform duration-300"
                />
              </div>
              <CardTitle className="text-center">신청 관리</CardTitle>
              <CardDescription className="text-center">
                내가 신청한 체험단을 한눈에 파악하고 <br />
                선정 여부를 효율적으로 관리합니다.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-border/50 bg-background/80 backdrop-blur-sm hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-2 transition-all duration-300 group">
            <CardHeader>
              <div className="relative w-16 h-16 mb-4 mx-auto">
                <Image
                  src="/images/icon-calendar.png"
                  alt="캘린더 연동 아이콘"
                  fill
                  className="object-contain group-hover:scale-110 transition-transform duration-300"
                />
              </div>
              <CardTitle className="text-center">캘린더 연동</CardTitle>
              <CardDescription className="text-center">
                리뷰 마감일과 방문 일정을 <br />
                구글 캘린더에 자동으로 등록해 드립니다.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>
    </div>
  );
}
