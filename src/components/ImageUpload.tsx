'use client';

import { useState, useRef } from 'react';
import { Camera, Image as ImageIcon, Upload, X, Loader2, HelpCircle } from 'lucide-react';
import { uploadImage } from '@/app/actions/upload';
import { toast } from 'sonner';

interface ImageUploadProps {
    value?: string;
    onChange: (url: string) => void;
    label?: string;
    description?: string;
}

export default function ImageUpload({ value, onChange, label, description }: ImageUploadProps) {
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState(value || '');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Preview locally
        const localPreview = URL.createObjectURL(file);
        setPreview(localPreview);
        setUploading(true);

        const formData = new FormData();
        formData.append('file', file);

        const result = await uploadImage(formData);

        if (result.success && result.url) {
            onChange(result.url);
            setPreview(result.url);
            toast.success('Image synchronized to registry');
        } else {
            toast.error(result.error || 'Upload failed');
            setPreview(value || '');
        }
        setUploading(false);
    };

    const triggerFileSelect = () => fileInputRef.current?.click();
    const triggerCamera = () => cameraInputRef.current?.click();

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">{label || 'Visual Asset'}</label>
                <div className="group relative">
                    <HelpCircle size={14} className="text-slate-300 cursor-help hover:text-primary transition-colors" />
                    <div className="absolute bottom-full right-0 mb-3 w-56 p-4 bg-slate-900 text-white text-[9px] font-bold rounded-2xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-50 shadow-2xl border border-slate-800 translate-y-2 group-hover:translate-y-0">
                        {description || 'Capture original imagery via camera or upload from telemetry storage. URLs are also supported in the advanced field.'}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Preview & Action Card */}
                <div className="relative aspect-video md:aspect-square bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-100 overflow-hidden group/upload flex items-center justify-center">
                    {preview ? (
                        <>
                            <img src={preview} alt="Preview" className="w-full h-full object-cover transition-transform duration-700 group-hover/upload:scale-110" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/upload:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                <button type="button" onClick={() => { setPreview(''); onChange(''); }} className="p-3 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-xl text-white transition-all hover:scale-110">
                                    <X size={20} />
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="text-center space-y-3 opacity-20 group-hover/upload:opacity-40 transition-opacity p-6">
                            <ImageIcon size={48} className="mx-auto" />
                            <p className="text-[10px] font-black uppercase tracking-widest italic font-mono">No Signal</p>
                        </div>
                    )}

                    {uploading && (
                        <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center z-10">
                            <div className="text-center space-y-3">
                                <Loader2 size={32} className="animate-spin text-primary mx-auto" />
                                <p className="text-[10px] font-black text-primary uppercase tracking-widest animate-pulse">Synchronizing...</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Controls */}
                <div className="flex flex-col gap-3 justify-center">
                    <button
                        type="button"
                        onClick={triggerCamera}
                        className="flex items-center gap-4 p-5 bg-white border border-slate-100 rounded-2xl hover:bg-slate-50 transition-all hover:shadow-lg hover:shadow-slate-100 group shadow-sm active:scale-95"
                    >
                        <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-colors">
                            <Camera size={24} />
                        </div>
                        <div className="text-left">
                            <div className="text-sm font-black text-slate-900 uppercase italic tracking-tight">Camera Feed</div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Capture Immediate Reality</div>
                        </div>
                    </button>

                    <button
                        type="button"
                        onClick={triggerFileSelect}
                        className="flex items-center gap-4 p-5 bg-white border border-slate-100 rounded-2xl hover:bg-slate-50 transition-all hover:shadow-lg hover:shadow-slate-100 group shadow-sm active:scale-95"
                    >
                        <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                            <ImageIcon size={24} />
                        </div>
                        <div className="text-left">
                            <div className="text-sm font-black text-slate-900 uppercase italic tracking-tight">Access Gallery</div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Select From Local Archive</div>
                        </div>
                    </button>

                    <div className="relative mt-2">
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                            <Upload size={14} className="text-slate-300" />
                        </div>
                        <input
                            type="text"
                            value={preview.startsWith('/uploads/') ? '' : preview}
                            onChange={(e) => { setPreview(e.target.value); onChange(e.target.value); }}
                            className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] font-bold text-slate-900 placeholder:text-slate-300 focus:border-primary focus:bg-white outline-none transition-all italic font-mono"
                            placeholder="Direct Telemetry Stream (URL)..."
                        />
                    </div>
                </div>
            </div>

            {/* Hidden Inputs */}
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
            />
            <input
                type="file"
                ref={cameraInputRef}
                className="hidden"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
            />
        </div>
    );
}
