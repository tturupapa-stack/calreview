export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-white/50 backdrop-blur-sm mt-20">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-center md:text-left">
            <h3 className="font-heading font-bold text-lg text-primary">Cally</h3>
            <p className="text-sm text-gray-500 mt-1">
              Find the perfect campaign for your influence.
            </p>
          </div>
          <div className="flex gap-6 text-sm text-gray-500">
            <a href="#" className="hover:text-primary transition-colors">이용약관</a>
            <a href="#" className="hover:text-primary transition-colors">개인정보처리방침</a>
            <a href="#" className="hover:text-primary transition-colors">문의하기</a>
          </div>
        </div>
        <div className="border-t border-border/40 mt-8 pt-8 text-center text-xs text-gray-400">
          © 2025 Cally. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
