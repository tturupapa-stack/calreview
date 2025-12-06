import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="container flex flex-col items-center justify-between gap-4 py-10 md:h-24 md:flex-row md:py-0 mx-auto px-4 sm:px-8 max-w-7xl">
        <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
          &copy; {new Date().getFullYear()} 캘리뷰. All rights reserved.
        </p>
        <div className="flex gap-4">
          <Link
            href="/privacy"
            className="text-sm font-medium text-muted-foreground underline-offset-4 hover:underline"
          >
            개인정보처리방침
          </Link>
          <Link
            href="/terms"
            className="text-sm font-medium text-muted-foreground underline-offset-4 hover:underline"
          >
            이용약관
          </Link>
        </div>
      </div>
    </footer>
  );
}
