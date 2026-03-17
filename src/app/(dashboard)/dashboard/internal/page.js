'use client';

import AddLeadModal from '@/app/components/AddLeadModal';
import { ChevronLeft, ChevronRight, ExternalLink, Loader2, Plus, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function InternalLeadsPage() {
    const router = useRouter();

    // Data States
    const [leads, setLeads] = useState([]);
    const [salesReps, setSalesReps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [userRole, setUserRole] = useState(null);

    // Filter & Pagination States
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filters, setFilters] = useState({
        search: '',
        status: '',
        category: '',
        platform: '',
        assigned_to: ''
    });

    useEffect(() => {
        fetch('/api/auth/me').then(r => r.json()).then(d => {
            if (d.user) setUserRole(d.user.role);
        });
    }, []);

    useEffect(() => {
        fetchLeads();
    }, [page, filters.status, filters.category, filters.platform, filters.assigned_to]);

    const fetchLeads = async () => {
        setLoading(true);
        try {
            // Build the query string dynamically for INTERNAL leads
            const queryParams = new URLSearchParams({ type: 'Internal', page });
            Object.entries(filters).forEach(([key, value]) => {
                if (value) queryParams.append(key, value);
            });

            const res = await fetch(`/api/leads?${queryParams.toString()}`);
            const data = await res.json();

            if (data.success) {
                setLeads(data.leads);
                if (data.salesReps) setSalesReps(data.salesReps);
                setTotalPages(data.pagination.totalPages);
            }
        } catch (err) {
            console.error('Failed to fetch internal leads');
        } finally {
            setLoading(false);
        }
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setPage(1);
        fetchLeads();
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'New': return 'bg-blue-100 text-blue-800';
            case 'Contacted': return 'bg-yellow-100 text-yellow-800';
            case 'Interested': return 'bg-green-100 text-green-800';
            case 'Closed': return 'bg-purple-100 text-purple-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6">

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Internal Leads</h1>
                    <p className="text-gray-500 mt-1">Manage leads for the Internal AI Agency.</p>
                </div>

                {(userRole === 'admin' || userRole === 'marketing') && (
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 bg-gray-900 hover:bg-black text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-md"
                    >
                        <Plus className="w-5 h-5" />
                        Add Internal Lead
                    </button>
                )}
            </div>

            {/* FILTER BAR */}
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col lg:flex-row gap-4">

                <form onSubmit={handleSearchSubmit} className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search names, emails, or posts..."
                        value={filters.search}
                        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    />
                </form>

                <div className="flex flex-wrap gap-3">
                    <select
                        value={filters.category}
                        onChange={(e) => { setFilters({ ...filters, category: e.target.value }); setPage(1); }}
                        className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm text-gray-700 font-medium"
                    >
                        <option value="">All Categories</option>
                        <option value="AI Automation">AI Automation</option>
                        <option value="General">General Inquiries</option>
                    </select>

                    <select
                        value={filters.platform}
                        onChange={(e) => { setFilters({ ...filters, platform: e.target.value }); setPage(1); }}
                        className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm text-gray-700 font-medium"
                    >
                        <option value="">All Platforms</option>
                        <option value="reddit">Reddit</option>
                        <option value="facebook">Facebook</option>
                        <option value="twitter">X (Twitter)</option>
                    </select>

                    <select
                        value={filters.status}
                        onChange={(e) => { setFilters({ ...filters, status: e.target.value }); setPage(1); }}
                        className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm text-gray-700 font-medium"
                    >
                        <option value="">All Statuses</option>
                        <option value="New">New</option>
                        <option value="Contacted">Contacted</option>
                        <option value="Follow-up">Follow-up</option>
                        <option value="Closed">Closed</option>
                    </select>

                    {userRole !== 'sales' && (
                        <select
                            value={filters.assigned_to}
                            onChange={(e) => { setFilters({ ...filters, assigned_to: e.target.value }); setPage(1); }}
                            className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm text-gray-700 font-medium"
                        >
                            <option value="">All Reps</option>
                            {salesReps.map(rep => (
                                <option key={rep.id} value={rep.id}>{rep.name}</option>
                            ))}
                        </select>
                    )}
                </div>
            </div>

            {/* Table */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden mt-6">
                {loading ? (
                    <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
                ) : leads.length === 0 ? (
                    <div className="py-20 text-center text-gray-500">No leads found matching your criteria.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-medium">
                                <tr>
                                    <th className="px-6 py-4">Lead Info</th>
                                    <th className="px-6 py-4">Category</th>
                                    <th className="px-6 py-4 w-1/3">Scraped Post</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Assigned To</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {leads.map(lead => (
                                    <tr
                                        key={lead.id}
                                        onClick={() => router.push(`/dashboard/leads/${lead.id}`)}
                                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                                    >
                                        <td className="px-6 py-4">
                                            <p className="font-semibold text-gray-900">{lead.name}</p>
                                            <p className="text-gray-500 text-xs">{lead.company || lead.email}</p>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-700">{lead.category}</td>

                                        {/* Post Snippet & Link with stopPropagation */}
                                        <td className="px-6 py-4">
                                            {lead.content ? (
                                                <div className="text-sm text-gray-900 truncate max-w-62.5">
                                                    "{lead.content}"
                                                </div>
                                            ) : (
                                                <span className="text-gray-400 italic text-sm">Added manually</span>
                                            )}
                                            {lead.url && (
                                                <a
                                                    href={lead.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="text-xs text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center mt-1 font-medium transition-colors"
                                                >
                                                    View Source <ExternalLink className="w-3 h-3 ml-1" />
                                                </a>
                                            )}
                                        </td>

                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(lead.status)}`}>
                                                {lead.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500">
                                            {lead.assignee_name || <span className="text-gray-400 italic">Unassigned</span>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* PAGINATION FOOTER */}
                {!loading && totalPages > 1 && (
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
            </div>

            <AddLeadModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                initialType="Internal"
                onLeadAdded={() => fetchLeads()}
            />
        </div>
    );
}