import { LucideIcon } from 'lucide-react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    hover?: boolean;
}

export function Card({ children, className = '', hover = true }: CardProps) {
    return (
        <div className={`bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm ${hover ? 'transition-all duration-300 hover:border-blue-600/50 hover:shadow-xl hover:shadow-blue-900/5 hover:-translate-y-1' : ''} ${className}`}>
            {children}
        </div>
    );
}

export function CardHeader({
    children,
    className = '',
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return <div className={`px-6 py-5 bg-white border-b border-slate-100 ${className}`}>{children}</div>;
}

export function CardTitle({
    children,
    className = '',
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return <h3 className={`text-xs font-bold tracking-widest text-slate-500 uppercase ${className}`}>{children}</h3>;
}

export function CardContent({
    children,
    className = '',
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return <div className={`p-6 ${className}`}>{children}</div>;
}

export function CardValue({
    value,
    trend,
    trendUp,
    icon: Icon,
}: {
    value: string | number;
    trend?: string;
    trendUp?: boolean;
    icon?: LucideIcon;
}) {
    return (
        <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
                <div className="text-3xl font-black text-slate-900 tracking-tight">{value}</div>

                {Icon && (
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-blue-600">
                        <Icon className="w-6 h-6" />
                    </div>
                )}
            </div>

            {trend && (
                <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full ${trendUp ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                        {trendUp ? '↑' : '↓'} {trend}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Variance Delta</span>
                </div>
            )}
        </div>
    );
}
