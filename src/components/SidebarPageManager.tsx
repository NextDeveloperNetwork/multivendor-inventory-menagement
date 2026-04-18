'use client';

import { useState, useEffect } from 'react';
import { Settings2, Search } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

export interface SidebarMenuGroup {
    label: string;
    items: {
        href: string;
        label: string;
        icon: React.ElementType;
    }[];
}

interface SidebarPageManagerProps {
    menuGroups: SidebarMenuGroup[];
    hiddenPages: string[];
    togglePageVisibility: (href: string) => void;
    isCollapsed?: boolean;
}

export function SidebarPageManager({
    menuGroups,
    hiddenPages,
    togglePageVisibility,
    isCollapsed
}: SidebarPageManagerProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const filteredGroups = menuGroups.map(group => ({
        ...group,
        items: group.items.filter(item =>
            item.label.toLowerCase().includes(searchQuery.toLowerCase())
        )
    })).filter(group => group.items.length > 0);

    if (!mounted) {
        return (
            <button
                className={`flex items-center gap-3 rounded-xl text-sm font-semibold transition-all w-full
                    ${isCollapsed ? 'px-0 py-2.5 justify-center' : 'px-3 py-2.5'} 
                    text-slate-600 border border-transparent opacity-60`}
                disabled
            >
                <Settings2 size={18} strokeWidth={2} className="text-slate-400 shrink-0" />
                {!isCollapsed && <span className="truncate">Manage Menu Pages</span>}
            </button>
        );
    }

    return (
        <Dialog>
            <DialogTrigger asChild>
                <button
                    title="Manage Pages"
                    className={`flex items-center gap-3 rounded-xl text-sm font-semibold transition-all w-full
                        ${isCollapsed ? 'px-0 py-2.5 justify-center' : 'px-3 py-2.5'} 
                        text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent`}
                >
                    <Settings2 size={18} strokeWidth={2} className="text-slate-400 group-hover:text-slate-600 shrink-0" />
                    {!isCollapsed && <span className="truncate">Manage Menu Pages</span>}
                </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-white border-slate-200 p-0 overflow-hidden shadow-2xl rounded-2xl">
                <DialogHeader className="p-6 pb-4 border-b border-slate-100 bg-slate-50/50">
                    <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <Settings2 className="w-5 h-5 text-blue-600" />
                        Customize Navigation
                    </DialogTitle>
                    <p className="text-sm text-slate-500 mt-1">
                        Turn off pages you don&apos;t use to keep your sidebar clean and focused.
                    </p>
                    
                    <div className="relative mt-4">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Search pages..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium placeholder:font-normal"
                        />
                    </div>
                </DialogHeader>

                <ScrollArea className="h-[400px]">
                    <div className="p-4 space-y-6">
                        {filteredGroups.map((group) => (
                            <div key={group.label} className="space-y-3">
                                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2">
                                    {group.label}
                                </h4>
                                <div className="space-y-1">
                                    {group.items.map((item) => {
                                        const Icon = item.icon;
                                        const isHidden = hiddenPages.includes(item.href);
                                        
                                        return (
                                            <div
                                                key={item.href}
                                                className={`flex items-center justify-between p-2.5 rounded-xl transition-all cursor-pointer border
                                                    ${isHidden 
                                                        ? 'bg-slate-50 border-slate-100 opacity-60 hover:opacity-100' 
                                                        : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                                                    }`}
                                                onClick={() => togglePageVisibility(item.href)}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-lg ${isHidden ? 'bg-slate-200 text-slate-500' : 'bg-blue-50 text-blue-600'}`}>
                                                        <Icon size={16} strokeWidth={2} />
                                                    </div>
                                                    <div>
                                                        <p className={`text-sm font-semibold ${isHidden ? 'text-slate-500' : 'text-slate-900'}`}>
                                                            {item.label}
                                                        </p>
                                                        <p className="text-[11px] text-slate-400 font-medium">
                                                            {isHidden ? 'Hidden' : 'Visible'}
                                                        </p>
                                                    </div>
                                                </div>
                                                
                                                <button
                                                    className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors duration-200
                                                        ${isHidden ? 'bg-slate-200' : 'bg-blue-500'}`}
                                                >
                                                    <div className={`w-4 h-4 rounded-full bg-white transition-all duration-200 shadow-sm
                                                        ${isHidden ? 'translate-x-0' : 'translate-x-4'}`}
                                                    />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                        
                        {filteredGroups.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                                <Search size={32} className="mb-3 opacity-20" />
                                <p className="text-sm">No pages found matching &quot;{searchQuery}&quot;</p>
                            </div>
                        )}
                    </div>
                </ScrollArea>
                
                <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
                    <DialogTrigger asChild>
                        <button className="px-5 py-2 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900/20">
                            Done
                        </button>
                    </DialogTrigger>
                </div>
            </DialogContent>
        </Dialog>
    );
}
