'use client';

import {
    Briefcase,
    Building2,
    LayoutDashboard,
    ShieldCheck,
    Users,
    Activity,
    Database,
    Filter
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar({ user }) {
    const pathname = usePathname();

    // Define links. We filter them later based on role.
    const navItems = [
        { name: 'Overview', href: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'sales', 'marketing'] },
        { name: 'Internal Leads', href: '/dashboard/internal', icon: Briefcase, roles: ['admin', 'sales', 'marketing'] },
        { name: 'Client Leads', href: '/dashboard/clients', icon: Building2, roles: ['admin', 'sales', 'marketing'] },
        { name: 'Lead Queue', href: '/dashboard/staging', icon: Filter, roles: ['admin', 'marketing'] },
        // Admin Only
        { name: 'Team Approvals', href: '/admin/approvals', icon: ShieldCheck, roles: ['admin'] },
        { name: 'All Users', href: '/admin/users', icon: Users, roles: ['admin'] },
        { name: 'System Logs', href: '/admin/logs', icon: Activity, roles: ['admin'] },
        { name: 'Scraper Hub', href: '/admin/scraper', icon: Database, roles: ['admin'] },
    ];

    const filteredNav = navItems.filter(item => item.roles.includes(user?.role));

    return (
        <aside className="w-64 bg-gray-900 text-white min-h-screen flex flex-col transition-all duration-300">
            <div className="h-16 flex items-center px-6 border-b border-gray-800">
                <span className="text-xl font-bold tracking-tight">Prime<span className="text-blue-500">Crafters</span></span>
            </div>

            <div className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
                <p className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Menu</p>
                {filteredNav.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${isActive
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                }`}
                        >
                            <Icon className="w-5 h-5" />
                            <span className="font-medium text-sm">{item.name}</span>
                        </Link>
                    );
                })}
            </div>

            <div className="p-4 border-t border-gray-800">
                <div className="flex items-center gap-3 px-3 py-2">
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold uppercase">
                        {user?.name?.charAt(0) || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                        <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
                    </div>
                </div>
            </div>
        </aside>
    );
}