export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-gradient-to-b from-background to-background/95 backdrop-blur-sm mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left">
            <h3 className="font-heading font-bold text-xl text-primary mb-2">Cally</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              여러 체험단 사이트를 한 곳에서 검색하고,<br />
              당첨된 일정을 효율적으로 관리하세요.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <a 
              href="#" 
              className="text-muted-foreground hover:text-primary transition-colors relative group"
            >
              이용약관
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
            </a>
            <a 
              href="#" 
              className="text-muted-foreground hover:text-primary transition-colors relative group"
            >
              개인정보처리방침
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
            </a>
            <a 
              href="/contact" 
              className="text-muted-foreground hover:text-primary transition-colors relative group"
            >
              문의하기
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
            </a>
          </div>
        </div>
        <div className="border-t border-border/40 mt-8 pt-8 text-center">
          <p className="text-xs text-muted-foreground">
            © 2025 Cally. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
