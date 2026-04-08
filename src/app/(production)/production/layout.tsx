import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function ProductionLayout({ children }: { children: React.ReactNode }) {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;

    if (!user || user.role !== 'PRODUCTION_MANAGER') {
        redirect('/login');
    }

    return (
        <div className="min-h-screen bg-slate-100">
            {children}
        </div>
    );
}
