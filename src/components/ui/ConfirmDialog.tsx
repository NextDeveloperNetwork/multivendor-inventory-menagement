'use client';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning';
}

export function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'danger'
}: ConfirmDialogProps) {
    const handleConfirm = () => {
        onConfirm();
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md p-0 overflow-hidden rounded-3xl border-none shadow-2xl">
                <div className={`px-8 py-6 ${variant === 'danger' ? 'bg-red-50' : 'bg-amber-50'} border-b ${variant === 'danger' ? 'border-red-100' : 'border-amber-100'}`}>
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl ${variant === 'danger' ? 'bg-red-500' : 'bg-amber-500'} flex items-center justify-center text-white shadow-lg ${variant === 'danger' ? 'shadow-red-200' : 'shadow-amber-200'}`}>
                            <AlertTriangle size={24} />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-black text-slate-900 tracking-tight">
                                {title}
                            </DialogTitle>
                        </div>
                    </div>
                </div>

                <div className="p-8 bg-white">
                    <DialogDescription className="text-slate-600 font-medium text-sm leading-relaxed">
                        {description}
                    </DialogDescription>

                    <div className="mt-8 flex gap-4">
                        <button
                            onClick={onClose}
                            className="flex-1 h-12 px-6 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-all text-sm"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={handleConfirm}
                            className={`flex-1 h-12 px-6 ${variant === 'danger' ? 'bg-red-500 hover:bg-red-600' : 'bg-amber-500 hover:bg-amber-600'} text-white rounded-xl font-bold transition-all shadow-lg ${variant === 'danger' ? 'shadow-red-500/20' : 'shadow-amber-500/20'} text-sm`}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
