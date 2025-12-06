import { UserMenu } from "@/components/features/UserMenu";
import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between mx-auto px-4 sm:px-8 max-w-7xl">
        <Link href="/" className="flex items-center space-x-2 no-underline text-foreground">
          <span className="text-xl font-bold font-heading">
            캘리뷰
          </span>
        </Link>
        <nav className="flex items-center gap-6">
          <Link href="/search" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary no-underline">
            검색
          </Link>
          <UserMenu />
        </nav>
      </div>
    </header>
  );
}
