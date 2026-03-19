'use client';

import { useState } from 'react';
import { bulkCreateProducts } from '@/app/actions/inventory';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Upload, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface BulkUploadDialogProps {
    selectedBusinessId: string | null;
}

export default function BulkUploadDialog({ selectedBusinessId }: BulkUploadDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [fileName, setFileName] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);
        if (selectedBusinessId) {
            formData.append('businessId', selectedBusinessId);
        }

        try {
            const result = await bulkCreateProducts(formData);
            if (result.success && result.results) {
                const { success, failed, errors } = result.results;
                if (failed === 0) {
                    toast.success(`Successfully added ${success} products!`);
                    setOpen(false);
                    // Reset file input if needed or just close
                } else {
                    toast.warning(`Added ${success} products. ${failed} failed.`);
                    if (errors.length > 0) {
                        console.error('Bulk upload errors:', errors);
                        // Show first few errors
                        toast.error(`Errors: ${errors.slice(0, 3).join(', ')}${errors.length > 3 ? '...' : ''}`);
                    }
                }
            } else {
                toast.error(result.error || 'Failed to upload');
            }
        } catch (err) {
            toast.error('An unexpected error occurred');
        } finally {
            setLoading(false);
            setFileName(null);
            // Optionally reset form if staying open, but we usually close on success
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFileName(file.name);
        } else {
            setFileName(null);
        }
    };

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="h-16 px-10 bg-white text-black border-2 border-black rounded-2xl font-bold shadow-xl shadow-blue-500/5 hover:bg-slate-50 transition-all active:scale-[0.98] flex items-center gap-4 uppercase tracking-[0.2em] text-xs"
            >
                <Upload size={24} /> Bulk CSV Import
            </button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-md p-0 overflow-hidden rounded-2xl border border-slate-200 shadow-2xl flex flex-col bg-white">
                    <DialogHeader className="bg-white px-10 py-8 border-b border-slate-100 flex-row items-center justify-between space-y-0 shrink-0">
                        <div className="flex items-center gap-6">
                            <div className="w-14 h-14 bg-slate-50 border-2 border-slate-100 rounded-2xl flex items-center justify-center text-slate-900 shadow-sm">
                                <Upload size={28} strokeWidth={1.5} />
                            </div>
                            <div>
                                <DialogTitle className="text-slate-900 font-serif text-3xl tracking-tight leading-none uppercase italic">
                                    Data Ingestion
                                </DialogTitle>
                                <div className="flex items-center gap-3 mt-2">
                                    <span className="text-slate-400 text-[10px] uppercase tracking-[0.2em] font-black italic">Mass Asset Synchronization</span>
                                </div>
                            </div>
                        </div>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="p-10 bg-white space-y-8">
                        <div className="space-y-6">
                            <div className="border border-slate-200 bg-slate-50/50 rounded-2xl p-10 flex flex-col items-center justify-center gap-6 hover:bg-white hover:border-slate-400 transition-all cursor-pointer relative group shadow-sm overflow-hidden">
                                <div className="absolute inset-0 bg-slate-900 opacity-0 group-hover:opacity-[0.02] transition-opacity" />
                                <input
                                    type="file"
                                    name="file"
                                    accept=".csv"
                                    required
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    onChange={handleFileChange}
                                />
                                <div className="w-20 h-20 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all shadow-md">
                                    <FileText size={32} strokeWidth={1.5} />
                                </div>
                                <div className="text-center space-y-2">
                                    <p className="text-sm font-black text-slate-900 uppercase italic tracking-tight">{fileName || "Deploy CSV Manifest"}</p>
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] italic">Drop file_node or Click to source</p>
                                </div>
                            </div>

                            <div className="bg-slate-50 border border-slate-100 p-6 rounded-2xl space-y-6">
                                <div className="space-y-2">
                                    <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2 italic">
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-900" /> Essential Columns
                                    </h4>
                                    <p className="text-[11px] font-black text-slate-900 font-mono tracking-tighter uppercase pl-3.5">name, sku, price</p>
                                </div>
                                <div className="space-y-2">
                                    <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2 italic">
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-200" /> Optional Metadata
                                    </h4>
                                    <p className="text-[11px] font-black text-slate-400 font-mono tracking-tighter uppercase pl-3.5">barcode, cost, description, initial_stock</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-4">
                            <button 
                                disabled={loading} 
                                type="submit" 
                                className="w-full h-16 bg-slate-900 hover:bg-black text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs transition-all active:scale-95 disabled:opacity-30 shadow-xl shadow-slate-900/10 flex items-center justify-center gap-3"
                            >
                                {loading ? (
                                    <><div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> Ingesting_Loadout...</>
                                ) : (
                                    <><Upload size={20} /> Execute Import Sequence</>
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors italic w-full py-2 text-center"
                            >
                                Abort_Ingestion
                            </button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

        </>
    );
}
