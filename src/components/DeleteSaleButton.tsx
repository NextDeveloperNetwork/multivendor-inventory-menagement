'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { deleteSale } from '@/app/actions/sales';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { ConfirmDialog } from './ui/ConfirmDialog';

export default function DeleteSaleButton({ id }: { id: string }) {
    const [loading, setLoading] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const router = useRouter();

    const handleDelete = async () => {
        setLoading(true);
        try {
            const result = await deleteSale(id);
            if (result.success) {
                toast.success('Sale deleted and inventory restored');
                router.refresh();
            } else {
                toast.error(result.error || 'Failed to delete sale');
            }
        } catch (error) {
            toast.error('An unexpected error occurred');
        }
        setLoading(false);
    };

    return (
        <>
            <button
                onClick={() => setShowConfirm(true)}
                disabled={loading}
                className="p-3.5 text-blue-200 hover:text-red-500 bg-white rounded-xl shadow-sm border border-blue-50 transition-all disabled:opacity-50"
                title="Delete Sale"
            >
                <Trash2 size={20} className={loading ? 'animate-pulse' : ''} />
            </button>

            <ConfirmDialog
                isOpen={showConfirm}
                onClose={() => setShowConfirm(false)}
                onConfirm={handleDelete}
                title="Delete Sale"
                description="Are you sure you want to delete this sale? The inventory will be reverted and this action cannot be undone."
                confirmText="Delete Sale"
                variant="danger"
            />
        </>
    );
}
