'use client';

import AddLeadModal from '@/app/components/AddLeadModal';
import { ExternalLink, Loader2, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function ClientLeadsPage() {
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [userRole, setUserRole] = useState(null);
    const router = useRouter();

    useEffect(() => {
        fetch('/api/auth/me').then(r => r.json()).then(d => {
            if (d.user) setUserRole(d.user.role);
        });
        fetchLeads();
    }, []);

    const fetchLeads = async () => {
        try {
            const res = await fetch('/api/leads?type=Client');
            const data = await res.json();
            if (data.success) setLeads(data.leads);
        } catch (err) {
            console.error('Failed to fetch client leads');
        } finally {
            setLoading(false);
        }
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
                    <h1 className="text-2xl font-bold text-gray-900">Client Leads</h1>
                    <p className="text-gray-500 mt-1">Manage leads for 3vltn Business and Trerenew.</p>
                </div>

                {(userRole === 'admin' || userRole === 'marketing') && (
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 bg-gray-900 hover:bg-black text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-md"
                    >
                        <Plus className="w-5 h-5" />
                        Add Client Lead
                    </button>
                )}
            </div>

            {/* Table */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden mt-6">
                {loading ? (
                    <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
                ) : leads.length === 0 ? (
                    <div className="py-20 text-center text-gray-500">No client leads found.</div>
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

                                        {/* Post Snippet & Link */}
                                        <td className="px-6 py-4">
                                            {lead.content ? (
                                                <div className="text-sm text-gray-900 truncate max-w-[250px]">
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
            </div>

            <AddLeadModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                initialType="Client" // <--- Defaults to Client options in the dropdown
                onLeadAdded={(newLead) => setLeads([newLead, ...leads])}
            />
        </div>
    );
}