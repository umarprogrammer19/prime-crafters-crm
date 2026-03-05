import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

export async function POST(req) {
    try {
        // 1. Verify Admin Access
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        // 2. Get data from request
        const { userId, action, role } = await req.json(); // action = 'approve' or 'reject'

        if (!userId || !action) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        if (action === 'approve') {
            if (!role || !['sales', 'marketing', 'admin'].includes(role)) {
                return NextResponse.json({ error: 'Valid role required for approval' }, { status: 400 });
            }
            await query(
                `UPDATE users SET status = 'approved', role = $1 WHERE id = $2`,
                [role, userId]
            );
        } else if (action === 'reject') {
            await query(
                `UPDATE users SET status = 'rejected', role = 'unassigned' WHERE id = $1`,
                [userId]
            );
        } else {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        return NextResponse.json({ success: true, message: `User ${action}d successfully.` });
    } catch (error) {
        console.error('Approval error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}