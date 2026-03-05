'use client';

import { useState, useEffect } from 'react';
import { UserCheck, UserX, Clock, ShieldCheck, Loader2 } from 'lucide-react';

export default function AdminApprovalsPage() {
    const [pendingUsers, setPendingUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null); // tracks which user ID is being processed

    useEffect(() => {
        fetchPendingUsers();
    }, []);

    const fetchPendingUsers = async () => {
        try {
            const res = await fetch('/api/admin/users/pending');
            const data = await res.json();
            if (data.success) {
                // Initialize local state for role selection
                const usersWithRoles = data.users.map(u => ({ ...u, selectedRole: 'sales' }));
                setPendingUsers(usersWithRoles);
            }
        } catch (err) {
            console.error('Failed to fetch users');
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (userId, action, role = null) => {
        setActionLoading(userId);
        try {
            const res = await fetch('/api/admin/users/approve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, action, role })
            });
            const data = await res.json();

            if (data.success) {
                // Remove user from the list locally to update UI instantly
                setPendingUsers(prev => prev.filter(u => u.id !== userId));
            } else {
                alert(data.error);
            }
        } catch (err) {
            alert('An error occurred.');
        } finally {
            setActionLoading(null);
        }
    };

    const handleRoleChange = (userId, newRole) => {
        setPendingUsers(prev => prev.map(u =>
            u.id === userId ? { ...u, selectedRole: newRole } : u
        ));
    };

    if (loading) {
        return <div className="flex h-64 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
    }

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <ShieldCheck className="w-7 h-7 text-blue-600" />
                        Access Approvals
                    </h1>
                    <p className="text-gray-500 mt-1">Review and assign roles to new team members.</p>
                </div>
                <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {pendingUsers.length} Pending Requests
                </div>
            </div>

            {pendingUsers.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center shadow-sm">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <UserCheck className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">You're all caught up!</h3>
                    <p className="text-gray-500 mt-1">There are no pending account requests at the moment.</p>
                </div>
            ) : (
                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-medium">
                            <tr>
                                <th className="px-6 py-4">Name</th>
                                <th className="px-6 py-4">Email</th>
                                <th className="px-6 py-4">Requested On</th>
                                <th className="px-6 py-4">Assign Role</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {pendingUsers.map(user => (
                                <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-gray-900">{user.name}</td>
                                    <td className="px-6 py-4 text-gray-500">{user.email}</td>
                                    <td className="px-6 py-4 text-gray-500">
                                        {new Date(user.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <select
                                            value={user.selectedRole}
                                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                            className="bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 outline-none"
                                        >
                                            <option value="sales">Sales Representative</option>
                                            <option value="marketing">Marketing Team</option>
                                            <option value="admin">Administrator</option>
                                        </select>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleAction(user.id, 'reject')}
                                                disabled={actionLoading === user.id}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                                title="Reject User"
                                            >
                                                <UserX className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => handleAction(user.id, 'approve', user.selectedRole)}
                                                disabled={actionLoading === user.id}
                                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm disabled:opacity-70"
                                            >
                                                {actionLoading === user.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
                                                Approve
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}