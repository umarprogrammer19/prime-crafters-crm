import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

export async function GET() {
    try {
        // 1. Verify Admin Access
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden. Admin access required.' }, { status: 403 });
        }

        // 2. Fetch pending users
        const result = await query(
            `SELECT id, name, email, created_at FROM users WHERE status = 'pending' ORDER BY created_at DESC`
        );

        return NextResponse.json({ success: true, users: result.rows });
    } catch (error) {
        console.error('Fetch pending users error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}