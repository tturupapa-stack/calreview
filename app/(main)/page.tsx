import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Search, Calendar, CheckCircle } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center space-y-10 py-24 px-4 text-center md:py-32 relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background" />

        <div className="space-y-4 max-w-3xl">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl font-heading">
            체험단 통합 검색 <span className="text-primary">캘리뷰</span>
          </h1>
          <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
            여러 체험단 사이트를 한 곳에서 검색하고, <br className="hidden sm:inline" />
            당첨된 일정은 구글 캘린더에 자동으로 등록하세요.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 min-w-[300px] justify-center">
          <Button asChild size="lg" className="h-12 px-8 text-lg shadow-lg shadow-primary/25">
            <Link href="/search">
              지금 시작하기
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="h-12 px-8 text-lg">
            <Link href="/premium">
              서비스 소개
            </Link>
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16 max-w-7xl">
        <div className="grid gap-8 md:grid-cols-3">
          <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
            <CardHeader>
              <Search className="w-10 h-10 text-primary mb-4" />
              <CardTitle>통합 검색</CardTitle>
              <CardDescription>
                7개 이상의 주요 체험단 사이트를 <br />
                한 곳에서 실시간으로 검색하세요.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
            <CardHeader>
              <CheckCircle className="w-10 h-10 text-primary mb-4" />
              <CardTitle>신청 관리</CardTitle>
              <CardDescription>
                내가 신청한 체험단을 한눈에 파악하고 <br />
                선정 여부를 효율적으로 관리합니다.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
            <CardHeader>
              <Calendar className="w-10 h-10 text-primary mb-4" />
              <CardTitle>캘린더 연동</CardTitle>
              <CardDescription>
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
