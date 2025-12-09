import { UserMenu } from "@/components/features/UserMenu";
import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 transition-all duration-300">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <span className="text-xl font-heading font-bold tracking-tight text-primary transition-colors group-hover:text-primary/80">
            Cally
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
