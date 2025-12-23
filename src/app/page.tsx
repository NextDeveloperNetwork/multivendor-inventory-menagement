import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function Home() {
    const session = await getServerSession(authOptions);

    if (session) {
        if (session.user.role === 'ADMIN') {
            redirect('/admin');
        } else {
            redirect('/shop');
        }
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 relative overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                <div className="absolute -top-1/4 -left-1/4 w-[800px] h-[800px] bg-blue-100/50 rounded-full blur-[120px]"></div>
                <div className="absolute -bottom-1/4 -right-1/4 w-[800px] h-[800px] bg-emerald-100/50 rounded-full blur-[120px]"></div>
            </div>

            <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
                <div className="w-20 h-20 bg-blue-600 rounded-[2rem] flex items-center justify-center mx-auto mb-10 shadow-2xl shadow-blue-200 animate-bounce-subtle">
                    <span className="text-white text-3xl font-black">N</span>
                </div>

                <h1 className="text-5xl md:text-7xl font-black text-slate-900 leading-[1.1] tracking-tight mb-8">
                    Modern Operations<br />
                    <span className="text-blue-600">Perfectly Synchronized</span>
                </h1>

                <p className="text-lg md:text-xl text-slate-500 font-medium mb-12 max-w-2xl mx-auto leading-relaxed">
                    Effectively manage warehouses, terminal branches, and global logistics with the Nexus integrated ecosystem.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <Link href="/login" className="w-full sm:w-auto px-10 py-4 bg-slate-900 text-white rounded-2xl font-black shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95 uppercase tracking-widest text-sm">
                        Enter Terminal
                    </Link>
                    <Link href="/register" className="w-full sm:w-auto px-10 py-4 bg-white text-slate-900 border border-slate-200 rounded-2xl font-black shadow-lg shadow-slate-100 hover:bg-slate-50 transition-all active:scale-95 uppercase tracking-widest text-sm">
                        Apply for Access
                    </Link>
                </div>

                <div className="mt-20 pt-10 border-t border-slate-200/50 flex flex-wrap justify-center gap-8 md:gap-16">
                    <div className="text-center">
                        <div className="text-2xl font-black text-slate-900">100%</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Real-time Sync</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-black text-slate-900">Zero</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Data Latency</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-black text-slate-900">Global</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Multi-Node Mesh</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
