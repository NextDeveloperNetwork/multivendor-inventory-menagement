import { ShoppingBag } from 'lucide-react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function SalesManagerPage() {
    const session = await getServerSession(authOptions);
    if (!session?.user || ((session.user as any).role !== 'SALES_MANAGER' && (session.user as any).role !== 'ADMIN')) {
        redirect('/login');
    }

    return (
        <div className="space-y-6 fade-in max-w-7xl mx-auto p-6">
            {/* Header */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                        <ShoppingBag size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">Sales Workspace</h1>
                        <p className="text-sm text-slate-400 font-medium">Sales Management Console</p>
                    </div>
                </div>
            </div>

            {/* Empty Clean Content */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-16 text-center">
                <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 mx-auto mb-4">
                    <ShoppingBag size={28} />
                </div>
                <h2 className="text-lg font-bold text-slate-900">Sales Workspace</h2>
                <p className="text-sm text-slate-400 max-w-md mx-auto mt-1">
                    Select a section from the navigation menu to manage sales operations.
                </p>
            </div>
        </div>
    );
}
