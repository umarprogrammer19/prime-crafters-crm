'use client';

import { Users, Briefcase, Building2, TrendingUp } from 'lucide-react';

export default function DashboardOverview() {
    return (
        <div className="max-w-6xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Overview</h1>
                <p className="text-gray-500 mt-1">Here is a summary of your lead pipeline today.</p>
            </div>

            {/* Placeholder Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard title="Total Leads" value="124" icon={Users} trend="+12%" />
                <StatCard title="Internal Leads" value="86" icon={Briefcase} trend="+5%" />
                <StatCard title="Client Leads" value="38" icon={Building2} trend="+18%" />
                <StatCard title="Closed Won" value="12" icon={TrendingUp} trend="+2%" />
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 h-96 flex items-center justify-center text-gray-500">
                <p>Activity charts and recent leads will appear here.</p>
            </div>
        </div>
    );
}

// Simple internal component for the cards
function StatCard({ title, value, icon: Icon, trend }) {
    return (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                    <Icon className="w-6 h-6 text-blue-600" />
                </div>
                <span className="text-sm font-medium text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
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