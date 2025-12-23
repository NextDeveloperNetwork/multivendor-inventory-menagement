'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteTransfer } from '@/app/actions/transfer';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface DeleteTransferButtonProps {
    id: string;
}

export default function DeleteTransferButton({ id }: DeleteTransferButtonProps) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleDelete = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this transfer and revert inventory counts?')) return;

        setLoading(true);
        const result = await deleteTransfer(id);

        if (result.success) {
            toast.success('Transfer deleted and inventory reverted');
            router.refresh();
        } else {
            toast.error(result.error || 'Failed to delete transfer');
        }
        setLoading(false);
    };

    return (
        <button
            onClick={handleDelete}
            disabled={loading}
            className="p-3 rounded-xl bg-slate-50 text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all border border-slate-100 hover:border-red-100 disabled:opacity-50"
            title="Purge & Rollback"
        >
            <Trash2 size={20} className={loading ? 'animate-pulse' : ''} />
        </button>
    );
}
