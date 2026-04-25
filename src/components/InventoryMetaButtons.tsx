'use client';

import { useState } from 'react';
import { Tag, Ruler } from 'lucide-react';
import { CatalogMetaDialog } from '@/components/CatalogMetaDialog';

export function InventoryMetaButtons() {
    const [open, setOpen] = useState<'categories' | 'units' | null>(null);

    return (
        <>
            <button
                onClick={() => setOpen('categories')}
                className="h-10 px-4 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl font-semibold text-sm flex items-center gap-2 transition-colors backdrop-blur"
            >
                <Tag size={15} /> Categories
            </button>
            <button
                onClick={() => setOpen('units')}
                className="h-10 px-4 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl font-semibold text-sm flex items-center gap-2 transition-colors backdrop-blur"
            >
                <Ruler size={15} /> Units
            </button>

            {open && (
                <CatalogMetaDialog
                    open={!!open}
                    onClose={() => setOpen(null)}
                    defaultMode={open}
                />
            )}
        </>
    );
}
