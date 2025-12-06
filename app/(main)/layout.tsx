import { Header } from "@/components/ui/Header";
import { Footer } from "@/components/ui/Footer";

export default function MainLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
        </>
    );
}
