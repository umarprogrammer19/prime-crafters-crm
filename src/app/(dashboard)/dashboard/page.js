'use client';

import { Users, Briefcase, Building2, TrendingUp, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function DashboardOverview() {
    const [stats, setStats] = useState({ total: 0, internal: 0, client: 0, closed: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/dashboard/stats')
            .then(res => res.json())
            .then(data => {
                if (data.success) setStats(data.stats);
                setLoading(false);
            });
    }, []);

    if (loading) return <div className="flex justify-center p-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;

    return (
        <div className="max-w-6xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Overview</h1>
                <p className="text-gray-500 mt-1">Here is a summary of your lead pipeline today.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard title="Total Leads" value={stats.total} icon={Users} trend="Live" />
                <StatCard title="Internal Leads" value={stats.internal} icon={Briefcase} trend="Live" />
                <StatCard title="Client Leads" value={stats.client} icon={Building2} trend="Live" />
                <StatCard title="Closed Won" value={stats.closed} icon={TrendingUp} trend="Live" />
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 h-96 flex flex-col items-center justify-center text-gray-500">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                    <TrendingUp className="w-8 h-8 text-gray-300" />
                </div>
                <p className="font-medium text-gray-900">Your CRM is fully operational!</p>
                <p className="text-sm mt-1">Add more leads to start seeing activity trends.</p>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon: Icon, trend }) {
    return (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                    <Icon className="w-6 h-6 text-blue-600" />
                </div>
                <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
                    {trend}
                </span>
            </div>
            <div>
                <h3 className="text-gray-500 text-sm font-medium mb-1">{title}</h3>
                <p className="text-3xl font-bold text-gray-900">{value}</p>
            </div>
        </div>
    );
}