'use client';

import { useState } from 'react';
import { UploadCloud, FileText, Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function CsvUploader() {
    const [file, setFile] = useState(null);
    const [category, setCategory] = useState('3VLT');
    const [isUploading, setIsUploading] = useState(false);
    const [result, setResult] = useState(null);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && selectedFile.type === 'text/csv') {
            setFile(selectedFile);
            setResult(null); // Clear old results
        } else {
            alert('Please select a valid .csv file');
            e.target.value = null; // Reset input
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file) return;

        setIsUploading(true);
        setResult(null);

        const reader = new FileReader();

        reader.onload = async (event) => {
            const text = event.target.result;
            const rows = text.split('\n');
            const headers = rows[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));

            const parsedLeads = [];

            for (let i = 1; i < rows.length; i++) {
                if (!rows[i].trim()) continue;

                // Advanced split that ignores commas inside quotes
                const values = rows[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.trim().replace(/^"|"$/g, ''));

                let leadObj = {};
                headers.forEach((header, index) => {
                    if (header.includes('name') || header.includes('user')) leadObj.name = values[index];
                    if (header.includes('email')) leadObj.email = values[index];
                    if (header.includes('url') || header.includes('link')) leadObj.url = values[index];
                    if (header.includes('content') || header.includes('post') || header.includes('text')) leadObj.content = values[index];
                });

                // Only push if we at least have a name or url
                if (leadObj.name || leadObj.url) {
                    leadObj.source = 'CSV Upload';
                    parsedLeads.push(leadObj);
                }
            }

            try {
                const res = await fetch('/api/leads/upload', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ leads: parsedLeads, category })
                });

                const data = await res.json();

                if (res.ok) {
                    setResult({ type: 'success', message: data.message });
                    setFile(null); // Clear file after success
                } else {
                    setResult({ type: 'error', message: data.error || 'Upload failed.' });
                }
            } catch (err) {
                setResult({ type: 'error', message: 'Network error occurred during upload.' });
            } finally {
                setIsUploading(false);
            }
        };

        reader.onerror = () => {
            setResult({ type: 'error', message: 'Failed to read the file.' });
            setIsUploading(false);
        };

        reader.readAsText(file);
    };

    return (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8 max-w-2xl mx-auto mt-8">
            <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <UploadCloud className="w-6 h-6 text-blue-600" />
                    Bulk Lead Import
                </h2>
                <p className="text-gray-500 text-sm mt-1">
                    Upload a CSV file containing your leads. Make sure your columns include headers like <b>Name, Email, URL, Content</b>.
                </p>
            </div>

            {result && (
                <div className={`mb-6 p-4 rounded-xl border flex items-center gap-3 ${result.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                    {result.type === 'success' ? <CheckCircle className="w-5 h-5 text-green-600" /> : <XCircle className="w-5 h-5 text-red-600" />}
                    <p className="font-medium text-sm">{result.message}</p>
                </div>
            )}

            <form onSubmit={handleUpload} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Assign to Category</label>
                    <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                        <option value="3VLT">3VLT (Domain Selling)</option>
                        <option value="Internal AI Agency">Internal AI Agency (AI SaaS)</option>
                        <option value="Trenew">Trenew (Roofing, Solar, HVAC)</option>
                    </select>
                </div>

                <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:bg-gray-50 transition-colors relative">
                    <input
                        type="file"
                        accept=".csv"
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        disabled={isUploading}
                    />

                    {!file ? (
                        <div className="flex flex-col items-center pointer-events-none">
                            <UploadCloud className="w-10 h-10 text-gray-400 mb-3" />
                            <p className="text-sm font-medium text-gray-700">Click or drag CSV file to upload</p>
                            <p className="text-xs text-gray-500 mt-1">Maximum file size 5MB</p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center pointer-events-none">
                            <FileText className="w-10 h-10 text-blue-500 mb-3" />
                            <p className="text-sm font-medium text-gray-900">{file.name}</p>
                            <p className="text-xs text-gray-500 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                        </div>
                    )}
                </div>

                <div className="flex justify-end pt-2">
                    <button
                        type="submit"
                        disabled={!file || isUploading}
                        className={`flex items-center px-6 py-2.5 rounded-xl font-medium text-white transition-all ${!file || isUploading ? 'bg-gray-300 cursor-not-allowed' : 'bg-gray-900 hover:bg-black shadow-lg hover:shadow-xl'}`}
                    >
                        {isUploading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            'Import Leads'
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}