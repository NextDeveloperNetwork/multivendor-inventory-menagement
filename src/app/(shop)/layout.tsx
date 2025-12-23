import { ShopSidebar } from '@/components/ShopSidebar';

export default function ShopLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen bg-slate-50">
            <ShopSidebar />
            <main className="flex-1 ml-80 min-h-screen">
                {children}
            </main>
        </div>
    );
}
