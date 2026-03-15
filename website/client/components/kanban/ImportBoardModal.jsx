'use client';
import { useState, useRef } from 'react';
import Modal from '../ui/Modal';

const AI_PROMPT = `I want to import a Kanban board into 'Notban'. Please generate a JSON object representing the board with the following structure:
{
  "board": { 
    "name": "Board Name", 
    "description": "Board Description" 
  },
  "columns": [
    {
      "name": "Column Name",
      "order": 0,
      "cards": [
        { 
          "title": "Task Title", 
          "description": "Task Description", 
          "priority": "medium", 
          "order": 0 
        }
      ]
    }
  ]
}
Please replace the values with actual data for a [TOPIC] board.`;

export default function ImportBoardModal({ isOpen, onClose, onImport }) {
    const [jsonText, setJsonText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);
    const fileInputRef = useRef(null);

    const handleCopyPrompt = () => {
        navigator.clipboard.writeText(AI_PROMPT);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                // Pre-validate JSON if possible, or just set it to text area
                const content = event.target.result;
                JSON.parse(content); // Test if valid
                setJsonText(content);
                setError('');
            } catch (err) {
                setError('Invalid JSON file format.');
            }
        };
        reader.readAsText(file);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!jsonText.trim()) {
            setError('Please paste JSON or upload a file.');
            return;
        }

        setIsSubmitting(true);
        setError('');
        try {
            const data = JSON.parse(jsonText);
            await onImport(data);
            setJsonText('');
            onClose();
        } catch (err) {
            setError(err.message || 'Invalid JSON format. Please check your input.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Import Board">
            <div className="space-y-6">
                {/* Instructions Section */}
                <div className="bg-surface-raised/50 border border-border-subtle rounded-xl p-4 space-y-3">
                    <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent"></span>
                        Instructions
                    </h3>
                    <ul className="text-xs text-text-secondary space-y-2 list-disc pl-4">
                        <li>Upload a previously exported <code className="text-accent">.json</code> file.</li>
                        <li>Or paste a JSON object matching the Notban board schema.</li>
                        <li>Use the AI Prompt button to get a template for your favorite LLM.</li>
                    </ul>
                    
                    <button
                        onClick={handleCopyPrompt}
                        className="w-full mt-2 py-2 px-3 bg-surface-overlay border border-border-subtle rounded-lg text-xs font-semibold text-text-primary hover:border-accent hover:bg-accent/5 transition-all flex items-center justify-center gap-2"
                    >
                        {copied ? '✓ Prompt Copied!' : '📋 Copy AI Prompt Template'}
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* File Upload Section */}
                    <div>
                        <label className="block text-xs font-semibold text-text-muted uppercase mb-2">
                            Upload File
                        </label>
                        <div 
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full border-2 border-dashed border-border-subtle rounded-xl p-6 text-center cursor-pointer hover:border-accent hover:bg-accent/5 transition-all group"
                        >
                            <input
                                type="file"
                                accept=".json"
                                onChange={handleFileChange}
                                className="hidden"
                                ref={fileInputRef}
                            />
                            <p className="text-sm text-text-muted group-hover:text-text-primary transition-colors">
                                Click to browse or drag & drop JSON file
                            </p>
                            <p className="text-[10px] text-text-muted mt-1 uppercase tracking-widest font-bold">
                                Max size: 5MB
                            </p>
                        </div>
                    </div>

                    {/* JSON Paste Section */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-semibold text-text-muted uppercase">
                                Paste JSON Content
                            </label>
                            {jsonText && (
                                <button 
                                    type="button"
                                    onClick={() => setJsonText('')}
                                    className="text-[10px] text-accent hover:underline uppercase font-bold"
                                >
                                    Clear
                                </button>
                            )}
                        </div>
                        <textarea
                            value={jsonText}
                            onChange={(e) => setJsonText(e.target.value)}
                            placeholder='{ "board": { ... }, "columns": [ ... ] }'
                            className="w-full bg-surface-overlay border border-border-default rounded-md px-3 py-2 text-sm text-text-primary font-mono focus:outline-none focus:border-accent min-h-[150px] resize-none transition-colors"
                        />
                        {error && <p className="mt-1 text-xs text-red-400 font-medium">{error}</p>}
                    </div>

                    {/* Submit Actions */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || !jsonText.trim()}
                            className="bg-accent hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-2.5 rounded-lg transition-all text-sm font-bold shadow-lg shadow-accent/20"
                        >
                            {isSubmitting ? 'Importing...' : 'Confirm Import'}
                        </button>
                    </div>
                </form>
            </div>
        </Modal>
    );
}
