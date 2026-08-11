import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getCountArticles, getActiveCountSession } from '@/app/actions/articleCounting';
import { getInventoryRequests } from '@/app/actions/salesOps';
import { sanitizeData } from '@/lib/utils';
import SalesManagerRequestsUI from '@/components/SalesManagerRequestsUI';

export const dynamic = 'force-dynamic';

export default async function SalesRequestsPage() {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        redirect('/login');
    }

    const [articles, countingSession, rawRequests] = await Promise.all([
        getCountArticles(),
        getActiveCountSession(),
        getInventoryRequests()
    ]);

    const sanitizedArticles = sanitizeData(articles);
    const sanitizedSession = sanitizeData(countingSession);
    const sanitizedRequests = sanitizeData(rawRequests);

    return (
        <SalesManagerRequestsUI
            articles={sanitizedArticles}
            session={sanitizedSession}
            myRequests={sanitizedRequests}
            userName={session.user.name || 'Sales Manager'}
        />
    );
}
