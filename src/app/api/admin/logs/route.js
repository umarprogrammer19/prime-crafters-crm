import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

export async function GET() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const user = jwt.verify(token, process.env.JWT_SECRET);
        if (user.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden. Admins only.' }, { status: 403 });
        }

        // Fetch the last 100 activities globally
        const result = await query(`
      SELECT 
        a.id, a.action_type, a.old_status, a.new_status, a.note, a.created_at,
        u.name as user_name,
        l.id as lead_id, l.name as lead_name, l.type as lead_type
      FROM lead_activities a
      LEFT JOIN users u ON a.user_id = u.id
      LEFT JOIN leads l ON a.lead_id = l.id
      ORDER BY a.created_at DESC
      LIMIT 100
    `);

        return NextResponse.json({ success: true, logs: result.rows });
    } catch (error) {
        console.error('Fetch logs error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}