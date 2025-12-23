'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { deleteSale } from '@/app/actions/sales';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function DeleteSaleButton({ id }: { id: string }) {
    const [isDeleting, setIsDeleting] = useState(false);
    const router = useRouter();

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this sale? Inventory will be reverted.')) {
            return;
        }

        setIsDeleting(true);
        try {
            const result = await deleteSale(id);
            if (result.success) {
                toast.success('Sale deleted and inventory reverted');
                router.refresh();
            } else {
                toast.error(result.error);
            }
        } catch (error) {
            toast.error('An unexpected error occurred');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <button
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleDelete();
            }}
            disabled={isDeleting}
            className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
            title="Delete Sale"
        >
            <Trash2 size={16} className={isDeleting ? 'animate-pulse' : ''} />
        </button>
    );
}
