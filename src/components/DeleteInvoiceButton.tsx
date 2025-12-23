'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { deleteInvoice } from '@/app/actions/invoice';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { ConfirmDialog } from './ui/ConfirmDialog';

export default function DeleteInvoiceButton({ id }: { id: string }) {
    const [loading, setLoading] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const router = useRouter();

    const handleDelete = async () => {
        setLoading(true);
        const result = await deleteInvoice(id);

        if (result.success) {
            toast.success('Invoice deleted successfully');
            router.refresh();
        } else {
            toast.error(result.error);
        }
        setLoading(false);
    };

    return (
        <>
            <button
                onClick={() => setShowConfirm(true)}
                disabled={loading}
                className="p-3.5 text-blue-200 hover:text-red-500 bg-white rounded-xl shadow-sm border border-blue-50 transition-all disabled:opacity-50"
                title="Delete Invoice"
            >
                <Trash2 size={20} className={loading ? 'animate-pulse' : ''} />
            </button>

            <ConfirmDialog
                isOpen={showConfirm}
                onClose={() => setShowConfirm(false)}
                onConfirm={handleDelete}
                title="Delete Invoice"
                description="Are you sure you want to delete this invoice? This will remove the record from the ledger and cannot be undone."
                confirmText="Delete Invoice"
                variant="danger"
            />
        </>
    );
}
