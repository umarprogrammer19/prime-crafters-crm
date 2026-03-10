'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft, Building2, Mail, Phone, Clock, User, MessageSquare, Loader2, CheckCircle2
} from 'lucide-react';
import Link from 'next/link';

const STATUS_OPTIONS = ['New', 'Contacted', 'Follow-up', 'Interested', 'Not Interested', 'Closed', 'File Work'];

export default function LeadDetailsPage({ params }) {
    // Unpack params using React.use() as required in latest Next.js versions for client components
    const unwrappedParams = use(params);
    const leadId = unwrappedParams.id;

    const router = useRouter();
    const [data, setData] = useState({ lead: null, activities: [], salesReps: [] });
    const [loading, setLoading] = useState(true);
    const [currentUserRole, setCurrentUserRole] = useState(null);

    // Action States
    const [newNote, setNewNote] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        fetch('/api/auth/me').then(r => r.json()).then(d => {
            if (d.user) setCurrentUserRole(d.user.role);
        });
        fetchLeadData();
    }, [leadId]);

    const fetchLeadData = async () => {
        try {
            const res = await fetch(`/api/leads/${leadId}`);
            if (!res.ok) {
                router.push('/dashboard/internal'); // Redirect if unauthorized/not found
                return;
            }
            const json = await res.json();
            if (json.success) setData(json);
        } catch (err) {
            console.error('Failed to fetch lead');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (newStatus) => {
        if (newStatus === data.lead.status) return;
        setActionLoading(true);
        await fetch(`/api/leads/${leadId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action_type: 'status_change', status: newStatus })
        });
        await fetchLeadData();
        setActionLoading(false);
    };

    const handleAssign = async (userId) => {
        setActionLoading(true);
        await fetch(`/api/leads/${leadId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action_type: 'assign', assigned_to: userId || null })
        });
        await fetchLeadData();
        setActionLoading(false);
    };

    const handleAddNote = async (e) => {
        e.preventDefault();
        if (!newNote.trim()) return;
        setActionLoading(true);
        await fetch(`/api/leads/${leadId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action_type: 'note_added', note: newNote })
        });
        setNewNote('');
        await fetchLeadData();
        setActionLoading(false);
    };

    if (loading) return <div className="flex justify-center p-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
    if (!data.lead) return null;

    const { lead, activities, salesReps } = data;

    return (
        <div className="max-w-6xl mx-auto space-y-6">

            {/* Top Navigation */}
            <Link href={lead.type === 'Internal' ? '/dashboard/internal' : '/dashboard/clients'} className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
                <ArrowLeft className="w-4 h-4 mr-1" /> Back to Leads
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* LEFT COLUMN: Lead Details & Actions */}
                <div className="lg:col-span-1 space-y-6">

                    {/* Info Card */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                        <h1 className="text-2xl font-bold text-gray-900">{lead.name}</h1>
                        <p className="text-blue-600 font-medium text-sm mb-6">{lead.category} • {lead.type}</p>

                        <div className="space-y-4">
                            {lead.company && (
                                <div className="flex items-center text-sm text-gray-600">
                                    <Building2 className="w-4 h-4 mr-3 text-gray-400" /> {lead.company}
                                </div>
                            )}
                            {lead.content && (
                                <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100 shadow-sm relative group">
                                    <div className="flex justify-between items-start mb-3">
                                        <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                                            Original Post Context
                                        </h3>
                                        {lead.url && (
                                            <a
                                                href={lead.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 bg-white border border-blue-200 hover:bg-blue-600 hover:text-white px-3 py-1.5 rounded-lg flex items-center text-xs font-medium transition-all shadow-sm"
                                            >
                                                Open Link <ExternalLink className="w-3 h-3 ml-1.5" />
                                            </a>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed italic">
                                        "{lead.content}"
                                    </p>
                                </div>
                            )}
                            {lead.email && (
                                <div className="flex items-center text-sm text-gray-600">
                                    <Mail className="w-4 h-4 mr-3 text-gray-400" />
                                    <a href={`mailto:${lead.email}`} className="text-blue-600 hover:underline">{lead.email}</a>
                                </div>
                            )}
                            {lead.phone && (
                                <div className="flex items-center text-sm text-gray-600">
                                    <Phone className="w-4 h-4 mr-3 text-gray-400" /> {lead.phone}
                                </div>
                            )}
                            <div className="flex items-center text-sm text-gray-600 pt-4 border-t border-gray-100">
                                <Clock className="w-4 h-4 mr-3 text-gray-400" /> Added {new Date(lead.created_at).toLocaleDateString()}
                            </div>
                        </div>
                    </div>

                    {/* Action Card (Status & Assignment) */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Lead Status</label>
                            <select
                                value={lead.status}
                                onChange={(e) => handleStatusChange(e.target.value)}
                                disabled={actionLoading}
                                className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none"
                            >
                                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>

                        {currentUserRole === 'admin' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Assigned Rep</label>
                                <select
                                    value={lead.assigned_to || ''}
                                    onChange={(e) => handleAssign(e.target.value)}
                                    disabled={actionLoading}
                                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none"
                                >
                                    <option value="">Unassigned</option>
                                    {salesReps.map(rep => <option key={rep.id} value={rep.id}>{rep.name}</option>)}
                                </select>
                            </div>
                        )}

                        {currentUserRole !== 'admin' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Assigned To</label>
                                <div className="flex items-center p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-600">
                                    <User className="w-4 h-4 mr-2" /> {lead.assignee_name || 'Unassigned'}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT COLUMN: Activity Timeline */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                        <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-blue-600" /> Activity History
                        </h2>

                        {/* Note Input */}
                        <form onSubmit={handleAddNote} className="mb-8">
                            <textarea
                                placeholder="Log a call, email, or internal note..."
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none h-24 mb-3 text-sm"
                                value={newNote}
                                onChange={e => setNewNote(e.target.value)}
                                required
                            />
                            <div className="flex justify-end">
                                <button type="submit" disabled={actionLoading} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl font-medium text-sm transition-colors flex items-center disabled:opacity-70">
                                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : 'Add Note'}
                                </button>
                            </div>
                        </form>

                        {/* Timeline Feed */}
                        <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-linear-to-b before:from-transparent before:via-gray-200 before:to-transparent">
                            {activities.length === 0 ? (
                                <p className="text-center text-gray-500 py-4 text-sm">No activity recorded yet.</p>
                            ) : (
                                activities.map((act) => (
                                    <div key={act.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">

                                        {/* Timeline Dot */}
                                        <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-blue-50 text-blue-600 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                                            {act.action_type === 'status_change' ? <CheckCircle2 className="w-4 h-4" /> :
                                                act.action_type === 'assigned' ? <User className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
                                        </div>

                                        {/* Timeline Card */}
                                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="font-semibold text-gray-900 text-sm">{act.user_name}</span>
                                                <span className="text-xs text-gray-400">{new Date(act.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>

                                            <div className="text-sm text-gray-600">
                                                {act.action_type === 'status_change' && (
                                                    <p>Changed status from <span className="font-medium text-gray-800">{act.old_status}</span> to <span className="font-medium text-blue-600">{act.new_status}</span></p>
                                                )}
                                                {act.action_type === 'assigned' && <p>{act.note}</p>}
                                                {act.action_type === 'note_added' && <p className="bg-gray-50 p-3 rounded-lg mt-2 border border-gray-100">{act.note}</p>}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
}