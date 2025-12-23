'use client';

import { useState } from 'react';
import { AdminSidebar } from '@/components/AdminSidebar';
import { Menu, Store } from 'lucide-react';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="flex min-h-screen bg-slate-50/50">
            <AdminSidebar isOpen={isOpen} setIsOpen={setIsOpen} />

            <main className="flex-1 lg:ml-80 min-h-screen transition-all duration-300">
                {/* Responsive Header for Mobile */}
                <div className="lg:hidden sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                            <Store size={20} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-black text-slate-900 tracking-tight leading-none uppercase">Nexus Admin</span>
                            <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-1">Core Console</span>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsOpen(true)}
                        className="w-10 h-10 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-slate-500 hover:text-blue-600 transition-colors shadow-sm"
                    >
                        <Menu size={20} />
                    </button>
                </div>

                <div className="p-4 lg:p-12 max-w-[1600px] mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
