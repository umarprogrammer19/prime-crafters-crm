'use client';

import { useState, useEffect } from 'react';
import { Search, Loader2, Database, Globe, Twitter, MessageCircle } from 'lucide-react';

export default function ScraperControlPanel() {
    const [formData, setFormData] = useState({ platform: 'reddit', limit: 10, url: '', category: "3VLT" });
    const [isScraping, setIsScraping] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');
    const [result, setResult] = useState(null);

    const handleScrape = async (e) => {
        e.preventDefault();
        setIsScraping(true);
        setResult(null);

        // Simulate progress phases for UI feedback while the real API runs
        setStatusMessage('Initializing Scraper Engine...');

        const statusInterval = setInterval(() => {
            setStatusMessage(prev => {
                if (prev.includes('Initializing')) return `Connecting to ${formData.platform} via Apify...`;
                if (prev.includes('Connecting')) return 'Extracting raw posts...';
                if (prev.includes('Extracting')) return 'OpenAI is strictly analyzing intent...';
                return 'Finalizing hot leads...';
            });
        }, 4000);

        try {
            const res = await fetch('/api/scraper/run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await res.json();
            clearInterval(statusInterval);

            if (res.ok && data.success) {
                setResult({ type: 'success', message: data.message });
            } else {
                setResult({ type: 'error', message: data.error || 'Scraping failed.' });
            }
        } catch (error) {
            clearInterval(statusInterval);
            setResult({ type: 'error', message: 'Network error occurred.' });
        } finally {
            setIsScraping(false);
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto">

            {/* Full-Screen Blocking Loader */}
            {isScraping && (
                <div className="fixed inset-0 z-100 flex items-center justify-center bg-gray-900/80 backdrop-blur-md">
                    <div className="bg-white p-10 rounded-3xl shadow-2xl flex flex-col items-center max-w-sm w-full text-center transform transition-all">
                        <div className="relative mb-6">
                            <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-75"></div>
                            <div className="relative bg-white rounded-full p-4 shadow-sm border border-gray-100">
                                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                            </div>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Mining Hot Leads</h3>
                        <p className="text-gray-500 text-sm font-medium h-10 flex items-center justify-center">
                            {statusMessage}
                        </p>
                        {/* Indeterminate Progress Bar */}
                        <div className="w-full bg-gray-100 h-1.5 rounded-full mt-6 overflow-hidden relative">
                            <div className="bg-blue-600 h-full rounded-full absolute left-0 w-1/3 animate-[slide_1.5s_ease-in-out_infinite]"></div>
                        </div>
                        <p className="text-xs text-gray-400 mt-4">Please do not close this window.</p>
                    </div>
                </div>
            )}

            {/* Add keyframes for the progress bar directly in the component for ease */}
            <style dangerouslySetInnerHTML={{
                __html: `
        @keyframes slide {
          0% { left: -33%; }
          100% { left: 100%; }
        }
      `}} />

            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Database className="w-7 h-7 text-blue-600" />
                    Lead Scraper Engine
                </h1>
                <p className="text-gray-500 mt-1">Extract high-intent domain buyers and sellers from social media.</p>
            </div>

            {result && (
                <div className={`mb-8 p-4 rounded-xl border ${result.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                    <p className="font-medium flex items-center gap-2">
                        {result.type === 'success' ? '✅' : '❌'} {result.message}
                    </p>
                </div>
            )}

            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
                <form onSubmit={handleScrape} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Business Category</label>
                        <select
                            value={formData.category || '3VLT'}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="3VLT">3VLT (Domain Selling)</option>
                            <option value="Internal AI Agency">Internal AI Agency (AI SaaS)</option>
                            <option value="Trenew">Trenew (Roofing, Solar, HVAC)</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Target Platform</label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <PlatformButton
                                active={formData.platform === 'reddit'}
                                onClick={() => setFormData({ ...formData, platform: 'reddit' })}
                                icon={MessageCircle}
                                label="Reddit"
                            />
                            <PlatformButton
                                active={formData.platform === 'twitter'}
                                onClick={() => setFormData({ ...formData, platform: 'twitter' })}
                                icon={Twitter}
                                label="X (Twitter)"
                            />
                            <PlatformButton
                                active={formData.platform === 'facebook'}
                                onClick={() => setFormData({ ...formData, platform: 'facebook' })}
                                icon={Globe}
                                label="Facebook"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Number of Posts to Scan</label>
                            <select
                                value={formData.limit}
                                onChange={(e) => setFormData({ ...formData, limit: parseInt(e.target.value) })}
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                <option value={10}>10 Posts (Fastest)</option>
                                <option value={20}>20 Posts</option>
                                <option value={50}>50 Posts (Takes a while)</option>
                                <option value={100}>100 Posts (Heavy AI Usage)</option>
                            </select>
                            <p className="text-xs text-gray-500 mt-2">OpenAI will strictly evaluate each post.</p>
                        </div>

                        {formData.platform === 'facebook' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Facebook Group URL (Optional)</label>
                                <input
                                    type="url"
                                    placeholder="https://facebook.com/groups/..."
                                    value={formData.url}
                                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                                <p className="text-xs text-gray-500 mt-2">Leave blank to use default domain groups.</p>
                            </div>
                        )}
                    </div>

                    <div className="pt-4 border-t border-gray-100 flex justify-end">
                        <button
                            type="submit"
                            className="bg-gray-900 hover:bg-black text-white px-8 py-3 rounded-xl font-medium transition-colors flex items-center shadow-lg"
                        >
                            <Search className="w-5 h-5 mr-2" />
                            Initialize Scraper
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// Helper component for the platform selector
function PlatformButton({ active, onClick, icon: Icon, label }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${active
                ? 'border-blue-600 bg-blue-50 text-blue-700 font-semibold'
                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
        >
            <Icon className={`w-5 h-5 ${active ? 'text-blue-600' : 'text-gray-400'}`} />
            {label}
        </button>
    );
}