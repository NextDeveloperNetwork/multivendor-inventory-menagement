import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getCountArticles } from '@/app/actions/articleCounting';
import { getInventoryRequests } from '@/app/actions/salesOps';
import { sanitizeData } from '@/lib/utils';
import AdminSalesRequestsUI from '@/components/AdminSalesRequestsUI';

export const dynamic = 'force-dynamic';

export default async function AdminSalesRequestsPage() {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
        redirect('/login');
    }

    const [rawRequests, articles] = await Promise.all([
        getInventoryRequests(),
        getCountArticles()
    ]);

    const sanitizedRequests = sanitizeData(rawRequests);
    const sanitizedArticles = sanitizeData(articles);

    return (
        <AdminSalesRequestsUI
            requests={sanitizedRequests}
            articles={sanitizedArticles}
        />
    );
}
