import { UserMenu } from "@/components/features/UserMenu";
import Link from "next/link";
import { Sparkles } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80 transition-all duration-300 shadow-sm">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="relative">
            <Sparkles className="w-5 h-5 text-primary absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="text-xl font-heading font-bold tracking-tight text-primary transition-all group-hover:text-primary/80 group-hover:scale-105">
              Cally
            </span>
          </div>
        </Link>
        <nav className="flex items-center gap-6">
          <Link 
            href="/search" 
            className="text-sm font-medium text-muted-foreground transition-all hover:text-primary no-underline relative group"
          >
            검색
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
          </Link>
          <UserMenu />
        </nav>
      </div>
    </header>
  );
}
