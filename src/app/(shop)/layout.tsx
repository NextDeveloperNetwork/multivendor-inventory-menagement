'use client';

import { useState } from 'react';
import { ShopSidebar } from '@/components/ShopSidebar';
import { Menu, Store } from 'lucide-react';

export default function ShopLayout({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="flex min-h-screen bg-slate-50/50">
            <ShopSidebar isOpen={isOpen} setIsOpen={setIsOpen} />

            <main className="flex-1 lg:ml-72 min-h-screen transition-all duration-300">
                {/* Mobile Header */}
                <div className="lg:hidden sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                            <Store size={20} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-900 leading-tight">Shop Portal</span>
                            <span className="text-[10px] text-slate-400 font-medium">Store Management</span>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsOpen(true)}
                        className="w-10 h-10 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-slate-500 hover:text-indigo-600 transition-colors shadow-sm"
                    >
                        <Menu size={20} />
                    </button>
                </div>

                <div className="p-4 lg:p-10 max-w-[1600px] mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
