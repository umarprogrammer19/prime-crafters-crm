import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

// Get active/approved users
export async function GET() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const user = jwt.verify(token, process.env.JWT_SECRET);
        if (user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const result = await query(`
      SELECT id, name, email, role, status, created_at 
      FROM users 
      WHERE status != 'pending' 
      ORDER BY role ASC, name ASC
    `);

        return NextResponse.json({ success: true, users: result.rows });
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// Update User Role or Status
export async function PATCH(req) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const adminUser = jwt.verify(token, process.env.JWT_SECRET);
        if (adminUser.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const { userId, role, status } = await req.json();

        if (!userId) return NextResponse.json({ error: 'User ID required' }, { status: 400 });

        // Prevent admin from accidentally demoting themselves
        if (userId === adminUser.id && (role !== 'admin' || status !== 'approved')) {
            return NextResponse.json({ error: 'You cannot demote your own admin account.' }, { status: 400 });
        }

        await query(
            `UPDATE users SET role = COALESCE($1, role), status = COALESCE($2, status) WHERE id = $3`,
            [role, status, userId]
        );

        return NextResponse.json({ success: true, message: 'User updated successfully' });
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}