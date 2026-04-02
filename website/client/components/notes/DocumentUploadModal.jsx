'use client';
import { useState, useRef } from 'react';
import { X, Upload, File, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { fileApi } from '@/lib/api/fileApi';

export default function DocumentUploadModal({ isOpen, onClose, workspaceId, noteId, onUploadSuccess }) {
    const [isDragging, setIsDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [uploadedFile, setUploadedFile] = useState(null);
    const fileInputRef = useRef(null);

    if (!isOpen) return null;

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleUpload(files[0]);
        }
    };

    const handleFileSelect = (e) => {
        const files = e.target.files;
        if (files.length > 0) {
            handleUpload(files[0]);
        }
    };

    const handleUpload = async (file) => {
        setUploading(true);
        setError(null);
        setSuccess(false);

        try {
            const result = await fileApi.uploadFile(file, workspaceId, noteId);
            setSuccess(true);
            setUploadedFile(result);
            if (onUploadSuccess) onUploadSuccess(result);
            setTimeout(() => {
                onClose();
                // Reset state after closing
                setSuccess(false);
                setUploadedFile(null);
            }, 2000);
        } catch (err) {
            setError(err.message || 'Failed to upload file');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-surface-elevated border border-border-subtle w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-6 py-4 border-b border-border-subtle flex items-center justify-between bg-surface-base">
                    <h3 className="text-lg font-semibold text-text-primary">Upload Document</h3>
                    <button 
                        onClick={onClose}
                        className="p-1 rounded-full text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8">
                    {!success ? (
                        <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={cn(
                                "relative group cursor-pointer border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center space-y-4 transition-all duration-300",
                                isDragging 
                                    ? "border-accent bg-accent/5 scale-[1.02]" 
                                    : "border-border-default hover:border-accent/40 hover:bg-surface-hover",
                                uploading && "pointer-events-none opacity-60"
                            )}
                        >
                            <input 
                                type="file" 
                                ref={fileInputRef}
                                onChange={handleFileSelect}
                                className="hidden"
                                accept=".md,.markdown,text/markdown,*"
                            />

                            <div className={cn(
                                "w-16 h-16 rounded-full bg-surface-overlay flex items-center justify-center transition-transform duration-300 group-hover:scale-110",
                                isDragging ? "bg-accent/10 text-accent" : "text-text-muted group-hover:text-accent/60"
                            )}>
                                {uploading ? (
                                    <Loader2 className="w-8 h-8 animate-spin" />
                                ) : (
                                    <Upload className={cn("w-8 h-8", isDragging ? "animate-bounce" : "")} />
                                )}
                            </div>

                            <div className="text-center">
                                <p className="text-base font-medium text-text-primary">
                                    {uploading ? "Uploading..." : "Click or drag to upload"}
                                </p>
                                <p className="text-sm text-text-muted mt-1">
                                    Markdown or any freedom file (Max 10MB)
                                </p>
                            </div>

                            {isDragging && (
                                <div className="absolute inset-0 bg-accent/5 flex items-center justify-center rounded-xl">
                                    <p className="text-accent font-semibold text-lg">Drop to upload</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-6 space-y-4 animate-in zoom-in-90">
                            <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
                                <CheckCircle2 className="w-12 h-12" />
                            </div>
                            <div className="text-center">
                                <h4 className="text-xl font-bold text-text-primary">Upload Complete!</h4>
                                <p className="text-text-secondary mt-2 flex items-center justify-center gap-2">
                                    <File className="w-4 h-4" />
                                    {uploadedFile?.name}
                                </p>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3 animate-in slide-in-from-top-2">
                            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <p className="text-sm font-semibold text-red-400">Upload failed</p>
                                <p className="text-xs text-red-400/80 mt-1">{error}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-surface-overlay/50 border-t border-border-subtle flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={uploading}
                        className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    {!success && (
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            className="px-4 py-2 bg-accent hover:bg-accent/90 text-white rounded-lg text-sm font-semibold shadow-lg shadow-accent/20 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                        >
                            {uploading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Uploading...
                                </>
                            ) : (
                                'Select File'
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
