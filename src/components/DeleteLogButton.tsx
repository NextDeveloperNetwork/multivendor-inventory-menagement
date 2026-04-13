'use client';

import React, { useState } from 'react';
import { Trash2, Loader2 } from 'lucide-react';
import { deleteProductionLog } from '@/app/actions/production';

export function DeleteLogButton({ id }: { id: string }) {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to cancel and remove this production record?')) return;
        
        setIsDeleting(true);
        try {
            const res = await deleteProductionLog(id);
            if (!res.success) {
                alert(res.error || 'Failed to delete');
                setIsDeleting(false);
            }
        } catch (err) {
            alert('An error occurred');
            setIsDeleting(false);
        }
    };

    return (
        <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all disabled:opacity-50"
            title="Delete Log"
        >
            {isDeleting ? <Loader2 size={16} className="animate-spin text-rose-500" /> : <Trash2 size={16} />}
        </button>
    );
}
