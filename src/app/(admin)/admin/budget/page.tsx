import { getBudgets } from '@/app/actions/finance';
import BudgetInterface from '@/components/budget/BudgetInterface';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function BudgetPage() {
    const session = await getServerSession(authOptions);
    const budgets = await getBudgets();
    
    const userRole = session?.user?.role || 'FINANCE_VIEWER';

    return (
        <BudgetInterface 
            initialBudgets={budgets as any} 
            userRole={userRole}
        />
    );
}
