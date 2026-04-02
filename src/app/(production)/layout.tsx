'use client';

import { useState } from 'react';
import { ProductionSidebar } from '@/components/ProductionSidebar';
import { Menu, Activity } from 'lucide-react';

export default function ProductionLayout({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="flex bg-slate-50 min-h-screen">
            <ProductionSidebar isOpen={isOpen} setIsOpen={setIsOpen} />

            <main className="flex-1 lg:ml-[280px] min-w-0 transition-all duration-300">
                <div className="lg:hidden sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-indigo-200">
                            <Activity size={20} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-black text-slate-900 leading-tight">Rregjistri prodhimit</span>
                            <span className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">Menaxheri i prodhimit</span>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsOpen(true)}
                        className="w-10 h-10 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-slate-500 hover:text-indigo-600 transition-colors"
                    >
                        <Menu size={20} />
                    </button>
                </div>

                <div className="p-4 md:p-8 max-w-[1600px] mx-auto min-h-screen">
                    {children}
                </div>
            </main>
        </div>
    );
}
