'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { deleteWarehouse } from '@/app/actions/warehouse';
import { toast } from 'sonner';

export default function DeleteWarehouseButton({ id }: { id: string }) {
    const [loading, setLoading] = useState(false);

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this warehouse? This can only be done if it is empty.')) {
            return;
        }

        setLoading(true);
        const result = await deleteWarehouse(id);

        if (result.success) {
            toast.success('Warehouse purged successfully');
        } else {
            toast.error(result.error);
        }
        setLoading(false);
    };

    return (
        <button
            onClick={handleDelete}
            disabled={loading}
            className="p-3.5 text-blue-200 hover:text-red-500 bg-white rounded-xl shadow-sm border border-blue-50 transition-all disabled:opacity-50"
            title="Purge Node"
        >
            <Trash2 size={20} className={loading ? 'animate-pulse' : ''} />
        </button>
    );
}
