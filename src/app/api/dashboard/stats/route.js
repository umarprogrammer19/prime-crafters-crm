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

        // If sales rep, only count their assigned leads. If Admin/Marketing, count all.
        let baseWhere = '';
        let params = [];
        if (user.role === 'sales') {
            baseWhere = 'WHERE assigned_to = $1';
            params.push(user.id);
        }

        // Run parallel count queries
        const [total, internal, client, closed] = await Promise.all([
            query(`SELECT COUNT(*) FROM leads ${baseWhere}`, params),
            query(`SELECT COUNT(*) FROM leads WHERE type = 'Internal' ${user.role === 'sales' ? 'AND assigned_to = $1' : ''}`, params),
            query(`SELECT COUNT(*) FROM leads WHERE type = 'Client' ${user.role === 'sales' ? 'AND assigned_to = $1' : ''}`, params),
            query(`SELECT COUNT(*) FROM leads WHERE status = 'Closed' ${user.role === 'sales' ? 'AND assigned_to = $1' : ''}`, params),
        ]);

        return NextResponse.json({
            success: true,
            stats: {
                total: parseInt(total.rows[0].count),
                internal: parseInt(internal.rows[0].count),
                client: parseInt(client.rows[0].count),
                closed: parseInt(closed.rows[0].count),
            }
        });
    } catch (error) {
        console.error('Stats error:', error);
        return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
    }
}