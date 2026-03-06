'use client';

import { useState, useEffect } from 'react';
import { Filter, Loader2, CheckCircle2, XCircle, ExternalLink, ChevronLeft, ChevronRight, Zap } from 'lucide-react';

export default function StagingQueuePage() {
    const [leads, setLeads] = useState([]);
    const [salesReps, setSalesReps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);

    // Pagination State
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Assignment State (Tracks which rep is selected for which lead)
    const [assignments, setAssignments] = useState({});

    useEffect(() => {
        fetchStagingLeads(page);
    }, [page]);

    const fetchStagingLeads = async (pageNumber) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/scraper/results?page=${pageNumber}`);
            const data = await res.json();
            if (data.success) {
                setLeads(data.leads);
                setSalesReps(data.salesReps);
                setTotalPages(data.pagination.totalPages || 1);
            }
        } catch (err) {
            console.error('Failed to fetch staging leads');
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (leadId, action) => {
        setActionLoading(leadId);
        try {
            const assignedTo = assignments[leadId] || null;

            const res = await fetch('/api/scraper/approve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ scrapedLeadId: leadId, action, assignedTo })
            });

            const data = await res.json();
            if (data.success) {
                // Remove the processed lead from the UI instantly
                setLeads(prev => prev.filter(l => l.id !== leadId));
            } else {
                alert(data.error);
            }
        } catch (err) {
            alert('Action failed.');
        } finally {
            setActionLoading(null);
        }
    };

    if (loading && leads.length === 0) {
        return <div className="flex h-64 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6">

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Filter className="w-7 h-7 text-blue-600" />
                        Lead Qualification Queue
                    </h1>
                    <p className="text-gray-500 mt-1">Review hot leads from the scraper before pushing to the CRM.</p>
                </div>
            </div>

            {leads.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center shadow-sm">
                    <Zap className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">Queue is empty</h3>
                    <p className="text-gray-500 mt-1">No pending leads. Run the scraper to find more.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {leads.map(lead => (
                        <div key={lead.id} className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden flex flex-col md:flex-row">

                            {/* Left Side: Content & Draft */}
                            <div className="p-6 md:w-2/3 border-b md:border-b-0 md:border-r border-gray-100">
                                <div className="flex items-center gap-3 mb-4">
                                    <span className="px-3 py-1 bg-gray-100 text-gray-800 text-xs font-bold rounded-full uppercase tracking-wider">
                                        {lead.platform}
                                    </span>
                                    <span className="px-3 py-1 bg-red-50 text-red-700 text-xs font-bold rounded-full uppercase tracking-wider flex items-center">
                                        <Zap className="w-3 h-3 mr-1" /> HOT {lead.intent}
                                    </span>
                                    <a href={lead.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center ml-auto">
                                        View Post <ExternalLink className="w-4 h-4 ml-1" />
                                    </a>
                                </div>

                                <h3 className="font-semibold text-gray-900 mb-2">@{lead.author_name}</h3>
                                <div className="bg-gray-50 p-4 rounded-xl text-sm text-gray-700 italic border border-gray-100 mb-4 max-h-32 overflow-y-auto">
                                    "{lead.content}"
                                </div>

                                {lead.outreach_draft && (
                                    <div>
                                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">AI Outreach Draft</h4>
                                        <p className="text-sm text-gray-800 bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                                            {lead.outreach_draft}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Right Side: Approval Actions */}
                            <div className="p-6 md:w-1/3 bg-gray-50 flex flex-col justify-center space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Assign to Sales Rep:</label>
                                    <select
                                        value={assignments[lead.id] || ''}
                                        onChange={(e) => setAssignments({ ...assignments, [lead.id]: e.target.value })}
                                        className="w-full bg-white border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-blue-500 outline-none p-3 shadow-sm"
                                    >
                                        <option value="">Do not assign yet</option>
                                        {salesReps.map(rep => <option key={rep.id} value={rep.id}>{rep.name}</option>)}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-3 pt-2">
                                    <button
                                        onClick={() => handleAction(lead.id, 'reject')}
                                        disabled={actionLoading === lead.id}
                                        className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-200 hover:bg-red-50 hover:text-red-700 hover:border-red-200 text-gray-700 rounded-xl font-medium transition-colors text-sm disabled:opacity-50"
                                    >
                                        {actionLoading === lead.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                                        Discard
                                    </button>
                                    <button
                                        onClick={() => handleAction(lead.id, 'approve')}
                                        disabled={actionLoading === lead.id}
                                        className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors shadow-md text-sm disabled:opacity-70"
                                    >
                                        {actionLoading === lead.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                        Approve
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between bg-white px-6 py-4 rounded-2xl border border-gray-200 shadow-sm">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                            >
                                <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                            </button>
                            <span className="text-sm text-gray-700">
                                Page <span className="font-semibold">{page}</span> of <span className="font-semibold">{totalPages}</span>
                            </span>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                            >
                                Next <ChevronRight className="w-4 h-4 ml-1" />
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}