'use client';

import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';

export default function AddUserModal({ isOpen, onClose, onUserAdded }) {
    const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'sales' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/admin/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await res.json();

            if (data.success) {
                onUserAdded(data.user);
                onClose();
                setFormData({ name: '', email: '', password: '', role: 'sales' });
            } else {
                setError(data.error || 'Failed to create user');
            }
        } catch (err) {
            setError('A network error occurred.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className="flex justify-between items-center p-6 border-b border-gray-100">
                    <h3 className="text-xl font-bold text-gray-900">Add New Team Member</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">{error}</div>}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <input required type="text" placeholder="John Doe" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                        <input required type="email" placeholder="john@primecrafters.com" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Temporary Password</label>
                        <input required type="text" minLength="6" placeholder="Secure password" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Assign Role</label>
                        <select className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}>
                            <option value="sales">Sales Representative</option>
                            <option value="marketing">Marketing Team</option>
                            <option value="admin">Administrator</option>
                        </select>
                    </div>

                    <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 mt-6">
                        <button type="button" onClick={onClose} className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-50 rounded-xl transition-colors">Cancel</button>
                        <button type="submit" disabled={loading} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors flex items-center shadow-md disabled:opacity-70">
                            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : 'Create User'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}