'use client';

import { useState } from 'react';
import { PostalClientSidebar } from '@/components/PostalClientSidebar';
import { Menu, Navigation } from 'lucide-react';

export default function PostalClientLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <div className="flex min-h-screen bg-slate-50/50 font-sans">
            <PostalClientSidebar 
                isOpen={isOpen} 
                setIsOpen={setIsOpen}
                isCollapsed={isCollapsed}
                setIsCollapsed={setIsCollapsed}
            />
            <main className={`flex-1 min-h-screen transition-all duration-300 ${isCollapsed ? 'lg:ml-20' : 'lg:ml-80'}`}>
                {/* Responsive Header for Mobile */}
                <div className="lg:hidden sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-blue-200">
                            <Navigation size={18} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-900 leading-none">Postal Client</span>
                            <span className="text-[10px] text-slate-500 font-medium mt-0.5">Remote Console</span>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsOpen(true)}
                        className="w-9 h-9 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center text-slate-500 hover:text-blue-600 transition-colors shadow-sm"
                    >
                        <Menu size={18} />
                    </button>
                </div>

                <div className="w-full transition-all duration-300">
                    {children}
                </div>
            </main>
        </div>
    );
}
