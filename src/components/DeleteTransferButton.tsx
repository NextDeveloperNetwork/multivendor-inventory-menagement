'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { deleteTransfer } from '@/app/actions/transfer';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { ConfirmDialog } from './ui/ConfirmDialog';

export default function DeleteTransferButton({ id }: { id: string }) {
    const [loading, setLoading] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const router = useRouter();

    const handleDelete = async () => {
        setLoading(true);
        const result = await deleteTransfer(id);

        if (result.success) {
            toast.success('Transfer deleted and inventory reverted');
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
                title="Delete Transfer"
            >
                <Trash2 size={20} className={loading ? 'animate-pulse' : ''} />
            </button>

            <ConfirmDialog
                isOpen={showConfirm}
                onClose={() => setShowConfirm(false)}
                onConfirm={handleDelete}
                title="Delete Transfer"
                description="Are you sure you want to delete this transfer? This will revert the inventory counts and cannot be undone."
                confirmText="Delete Transfer"
                variant="danger"
            />
        </>
    );
}
