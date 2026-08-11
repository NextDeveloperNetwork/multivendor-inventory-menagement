import { Activity } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
    return (
        <div className="space-y-6 fade-in max-w-7xl mx-auto">
            {/* Header */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                        <Activity size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">Dashboard</h1>
                        <p className="text-sm text-slate-400 font-medium">Management Console</p>
                    </div>
                </div>
            </div>

            {/* Empty Clean Content */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-16 text-center">
                <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 mx-auto mb-4">
                    <Activity size={28} />
                </div>
                <h2 className="text-lg font-bold text-slate-900">Dashboard Workspace</h2>
                <p className="text-sm text-slate-400 max-w-md mx-auto mt-1">
                    Select an operation from the navigation sidebar to manage system assets and workflows.
                </p>
            </div>
        </div>
    );
}
