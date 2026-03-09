'use client';

import { useState, useEffect } from 'react';
import { Users, ShieldAlert, Loader2, CheckCircle2, Plus } from 'lucide-react';
import AddUserModal from '@/app/components/AddUserModal'; // <--- NEW IMPORT

export default function AdminUsersPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false); // <--- MODAL STATE

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await fetch('/api/admin/users');
            const data = await res.json();
            if (data.success) setUsers(data.users);
        } catch (err) {
            console.error('Failed to fetch users');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateUser = async (userId, newRole, newStatus) => {
        setActionLoading(userId);
        try {
            const res = await fetch('/api/admin/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, role: newRole, status: newStatus })
            });
            const data = await res.json();

            if (data.success) {
                setUsers(users.map(u =>
                    u.id === userId ? { ...u, role: newRole || u.role, status: newStatus || u.status } : u
                ));
            } else {
                alert(data.error);
            }
        } catch (err) {
            alert('An error occurred.');
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) return <div className="flex h-64 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-6">

            {/* Header with Add Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Users className="w-7 h-7 text-blue-600" />
                        Team Management
                    </h1>
                    <p className="text-gray-500 mt-1">Manage existing users, change roles, or revoke access.</p>
                </div>

                {/* NEW ADD BUTTON */}
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 bg-gray-900 hover:bg-black text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-md"
                >
                    <Plus className="w-5 h-5" />
                    Add User
                </button>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-medium">
                        <tr>
                            <th className="px-6 py-4">User</th>
                            <th className="px-6 py-4">Role</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {users.map(user => (
                            <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-4">
                                    <p className="font-medium text-gray-900">{user.name}</p>
                                    <p className="text-gray-500 text-xs">{user.email}</p>
                                </td>

                                <td className="px-6 py-4">
                                    <select
                                        value={user.role}
                                        onChange={(e) => handleUpdateUser(user.id, e.target.value, null)}
                                        disabled={actionLoading === user.id}
                                        className="bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-blue-500 block w-full p-2 outline-none capitalize"
                                    >
                                        <option value="sales">Sales</option>
                                        <option value="marketing">Marketing</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </td>

                                <td className="px-6 py-4">
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center w-max gap-1 ${user.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                        }`}>
                                        {user.status === 'approved' ? <CheckCircle2 className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
                                        <span className="capitalize">{user.status}</span>
                                    </span>
                                </td>

                                <td className="px-6 py-4 text-right">
                                    {user.status === 'approved' ? (
                                        <button
                                            onClick={() => handleUpdateUser(user.id, null, 'rejected')}
                                            disabled={actionLoading === user.id}
                                            className="text-red-600 hover:text-red-800 font-medium text-xs bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors"
                                        >
                                            {actionLoading === user.id ? 'Updating...' : 'Revoke Access'}
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleUpdateUser(user.id, null, 'approved')}
                                            disabled={actionLoading === user.id}
                                            className="text-green-600 hover:text-green-800 font-medium text-xs bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-lg transition-colors"
                                        >
                                            {actionLoading === user.id ? 'Updating...' : 'Restore Access'}
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* NEW MODAL INJECTION */}
            <AddUserModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onUserAdded={(newUser) => setUsers([newUser, ...users])} // Instantly updates the table
            />
        </div>
    );
}