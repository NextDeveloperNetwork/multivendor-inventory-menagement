'use client';

import { useState } from 'react';
import { bulkCreateProducts } from '@/app/actions/inventory';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Upload, FileText } from 'lucide-react';
import { toast } from 'sonner';

export default function BulkUploadDialog() {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [fileName, setFileName] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);

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
                <DialogContent className="max-w-md p-0 overflow-hidden rounded-[2rem] border-none shadow-2xl">
                    <div className="bg-black p-8 text-white">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-3">
                                <Upload className="text-blue-500" /> Mass Ingestion
                            </DialogTitle>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Import Bulk Asset Data</p>
                        </DialogHeader>
                    </div>
                    <form onSubmit={handleSubmit} className="p-8 bg-white space-y-6">
                        <div className="space-y-4">
                            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center gap-4 hover:bg-slate-50 transition-colors cursor-pointer relative group">
                                <input
                                    type="file"
                                    name="file"
                                    accept=".csv"
                                    required
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    onChange={handleFileChange}
                                />
                                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                                    <FileText size={32} />
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-bold text-slate-900">{fileName || "Drop CSV file or Click"}</p>
                                    <p className="text-xs text-slate-400 font-medium mt-1">name, sku, price, etc.</p>
                                </div>
                            </div>

                            <div className="bg-slate-50 p-4 rounded-xl">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Required Columns</h4>
                                <p className="text-xs font-mono text-slate-600">name, sku, price</p>
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-3 mb-2">Optional Columns</h4>
                                <p className="text-xs font-mono text-slate-600">barcode, description, cost, initial_stock</p>
                            </div>
                        </div>

                        <button disabled={loading} type="submit" className="w-full h-16 bg-black text-white rounded-2xl font-bold uppercase tracking-widest hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-30">
                            {loading ? 'Processing...' : 'Start Import Sequence'}
                        </button>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
