'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteInvoice } from '@/app/actions/invoice';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface DeleteInvoiceButtonProps {
    id: string;
}

export default function DeleteInvoiceButton({ id }: DeleteInvoiceButtonProps) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleDelete = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this invoice? This will remove the record from the ledger.')) return;

        setLoading(true);
        const result = await deleteInvoice(id);

        if (result.success) {
            toast.success('Invoice deleted successfully');
            router.refresh();
        } else {
            toast.error(result.error || 'Failed to delete invoice');
        }
        setLoading(false);
    };

    return (
        <button
            onClick={handleDelete}
            disabled={loading}
            className="w-10 h-10 rounded-xl bg-slate-50 text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all border border-slate-100 hover:border-red-100 disabled:opacity-50"
            title="Purge Entry"
        >
            <Trash2 size={20} className={loading ? 'animate-pulse' : ''} />
        </button>
    );
}
