'use client';

import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';

export default function AddLeadModal({ isOpen, onClose, onLeadAdded, initialType = 'Internal' }) {
    const [formData, setFormData] = useState({
        name: '', company: '', email: '', phone: '', source: '',
        type: initialType, category: ''
    });
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('/api/leads', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await res.json();

            if (data.success) {
                onLeadAdded(data.lead);
                onClose();
                // Reset form
                setFormData({ name: '', company: '', email: '', phone: '', source: '', type: initialType, category: '' });
            } else {
                alert(data.error);
            }
        } catch (err) {
            alert('Failed to create lead.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden">
                <div className="flex justify-between items-center p-6 border-b border-gray-100">
                    <h3 className="text-xl font-bold text-gray-900">Add New Lead</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name</label>
                            <input required type="text" className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                            <input type="text" className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" value={formData.company} onChange={e => setFormData({ ...formData, company: e.target.value })} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input type="email" className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                            <input type="text" className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                            <select className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                                <option value="Internal">Internal</option>
                                <option value="Client">Client</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                            <select required className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                                <option value="">Select...</option>
                                {formData.type === 'Internal' ? (
                                    <>
                                        <option value="AI Automation">AI Automation</option>
                                        <option value="HVAC">HVAC</option>
                                        <option value="Domain Selling">Domain Selling</option>
                                    </>
                                ) : (
                                    <>
                                        <option value="3vltn Business">3vltn Business</option>
                                        <option value="Trerenew">Trerenew</option>
                                    </>
                                )}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
                            <input type="text" placeholder="e.g. Facebook" className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" value={formData.source} onChange={e => setFormData({ ...formData, source: e.target.value })} />
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                        <button type="button" onClick={onClose} className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-50 rounded-xl transition-colors">Cancel</button>
                        <button type="submit" disabled={loading} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors flex items-center shadow-lg shadow-blue-500/20 disabled:opacity-70">
                            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : 'Save Lead'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}