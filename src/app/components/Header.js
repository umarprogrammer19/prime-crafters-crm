'use client';

import { LogOut, Menu } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Header({ user }) {
    const router = useRouter();

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/login');
    };

    return (
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-10">
            <div className="flex items-center gap-4">
                {/* Mobile menu button could go here in the future */}
                <h2 className="text-xl font-semibold text-gray-800">
                    Welcome back, {user?.name?.split(' ')[0]}
                </h2>
            </div>

            <div className="flex items-center gap-4">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-red-600 transition-colors px-3 py-2 rounded-lg hover:bg-red-50"
                >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                </button>
            </div>
        </header>
    );
}