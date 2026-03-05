'use client';

import { useState, useEffect } from 'react';
import { Activity, Loader2, MessageSquare, CheckCircle2, User, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function GlobalLogsPage() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            const res = await fetch('/api/admin/logs');
            const data = await res.json();
            if (data.success) setLogs(data.logs);
        } catch (err) {
            console.error('Failed to fetch logs');
        } finally {
            setLoading(false);
        }
    };

    const getLogIcon = (type) => {
        if (type === 'status_change') return <CheckCircle2 className="w-4 h-4 text-blue-600" />;
        if (type === 'assigned') return <User className="w-4 h-4 text-purple-600" />;
        return <MessageSquare className="w-4 h-4 text-green-600" />;
    };

    if (loading) return <div className="flex h-64 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Activity className="w-7 h-7 text-blue-600" />
                    System Activity Logs
                </h1>
                <p className="text-gray-500 mt-1">Real-time feed of all team interactions and lead updates.</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                {logs.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">No activity recorded yet.</div>
                ) : (
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-medium">
                            <tr>
                                <th className="px-6 py-4">Date & Time</th>
                                <th className="px-6 py-4">Team Member</th>
                                <th className="px-6 py-4">Action</th>
                                <th className="px-6 py-4">Target Lead</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {logs.map(log => (
                                <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                                    {/* Timestamp */}
                                    <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                                        {new Date(log.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </td>

                                    {/* User */}
                                    <td className="px-6 py-4 font-medium text-gray-900">
                                        {log.user_name || 'System'}
                                    </td>

                                    {/* Action Description */}
                                    <td className="px-6 py-4">
                                        <div className="flex items-start gap-3">
                                            <div className="mt-0.5 p-1.5 rounded-full bg-gray-50 border border-gray-100 shrink-0">
                                                {getLogIcon(log.action_type)}
                                            </div>
                                            <div>
                                                {log.action_type === 'status_change' && (
                                                    <div className="text-gray-600">
                                                        Changed status from <span className="font-medium text-gray-800">{log.old_status}</span> <ArrowRight className="inline w-3 h-3 mx-1" /> <span className="font-medium text-blue-600">{log.new_status}</span>
                                                    </div>
                                                )}
                                                {log.action_type === 'assigned' && (
                                                    <div className="text-gray-600">{log.note}</div>
                                                )}
                                                {log.action_type === 'note_added' && (
                                                    <div className="text-gray-600 italic">"{log.note}"</div>
                                                )}
                                            </div>
                                        </div>
                                    </td>

                                    {/* Target Lead Link */}
                                    <td className="px-6 py-4">
                                        {log.lead_id ? (
                                            <Link
                                                href={`/dashboard/leads/${log.lead_id}`}
                                                className="text-blue-600 hover:text-blue-800 font-medium hover:underline flex items-center gap-1"
                                            >
                                                {log.lead_name}
                                            </Link>
                                        ) : (
                                            <span className="text-gray-400">Deleted Lead</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}