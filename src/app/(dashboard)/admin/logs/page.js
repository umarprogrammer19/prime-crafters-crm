'use client';

import { useState, useEffect } from 'react';
import { Activity, Loader2, MessageSquare, CheckCircle2, User, ArrowRight, Filter, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function GlobalLogsPage() {
    const [logs, setLogs] = useState([]);
    const [teamUsers, setTeamUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters & Pagination
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filters, setFilters] = useState({ userId: '', actionType: '' });

    useEffect(() => {
        fetchLogs();
    }, [page, filters.userId, filters.actionType]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams({ page });
            if (filters.userId) queryParams.append('userId', filters.userId);
            if (filters.actionType) queryParams.append('actionType', filters.actionType);

            const res = await fetch(`/api/admin/logs?${queryParams.toString()}`);
            const data = await res.json();

            if (data.success) {
                setLogs(data.logs);
                if (data.users) setTeamUsers(data.users);
                setTotalPages(data.pagination.totalPages);
            }
        } catch (err) {
            console.error('Failed to fetch logs');
        } finally {
            setLoading(false);
        }
    };

    const handleExportCSV = () => {
        const queryParams = new URLSearchParams();
        if (filters.userId) queryParams.append('userId', filters.userId);
        if (filters.actionType) queryParams.append('actionType', filters.actionType);

        // Hit the export API route to trigger the browser download
        window.location.href = `/api/admin/logs/export?${queryParams.toString()}`;
    };

    const getLogIcon = (type) => {
        if (type === 'status_change') return <CheckCircle2 className="w-4 h-4 text-blue-600" />;
        if (type === 'assigned') return <User className="w-4 h-4 text-purple-600" />;
        return <MessageSquare className="w-4 h-4 text-green-600" />;
    };

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-6">

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Activity className="w-7 h-7 text-blue-600" />
                        Activity Reports
                    </h1>
                    <p className="text-gray-500 mt-1">Audit trail of all team interactions, assignments, and updates.</p>
                </div>

                <button
                    onClick={handleExportCSV}
                    className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-5 py-2.5 rounded-xl font-medium transition-all shadow-sm"
                >
                    <Download className="w-4 h-4 text-blue-600" />
                    Export Filtered CSV
                </button>
            </div>

            {/* FILTER BAR */}
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-wrap gap-4 items-center">
                <Filter className="w-5 h-5 text-gray-400 ml-2" />
                <span className="text-sm font-medium text-gray-700 mr-2">Filter By:</span>

                <select
                    value={filters.userId}
                    onChange={(e) => { setFilters({ ...filters, userId: e.target.value }); setPage(1); }}
                    className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm text-gray-700 font-medium"
                >
                    <option value="">All Team Members</option>
                    {teamUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>

                <select
                    value={filters.actionType}
                    onChange={(e) => { setFilters({ ...filters, actionType: e.target.value }); setPage(1); }}
                    className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm text-gray-700 font-medium"
                >
                    <option value="">All Action Types</option>
                    <option value="status_change">Status Changes</option>
                    <option value="note_added">Notes & AI Drafts</option>
                    <option value="assigned">Lead Assignments</option>
                </select>
            </div>

            {/* DATA TABLE */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex h-64 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
                ) : logs.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">No activity recorded for these filters.</div>
                ) : (
                    <>
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-medium">
                                <tr>
                                    <th className="px-6 py-4">Date & Time</th>
                                    <th className="px-6 py-4">Team Member</th>
                                    <th className="px-6 py-4">Action Detail</th>
                                    <th className="px-6 py-4">Target Lead</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {logs.map(log => (
                                    <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                                            {new Date(log.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </td>

                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            {log.user_name || 'System'}
                                        </td>

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
                                                        <div className="text-gray-600 italic line-clamp-2" title={log.note}>"{log.note}"</div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>

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

                        {/* PAGINATION */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between bg-gray-50 px-6 py-4 border-t border-gray-200">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 transition-colors"
                                >
                                    <ChevronLeft className="w-4 h-4 mr-1" /> Prev
                                </button>
                                <span className="text-sm text-gray-600 font-medium">
                                    Page {page} of {totalPages}
                                </span>
                                <button
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 transition-colors"
                                >
                                    Next <ChevronRight className="w-4 h-4 ml-1" />
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}