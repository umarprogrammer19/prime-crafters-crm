import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

export async function GET(req) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const user = jwt.verify(token, process.env.JWT_SECRET);
        if (user.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden. Admins only.' }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page')) || 1;
        const limit = 20;
        const offset = (page - 1) * limit;

        const filterUserId = searchParams.get('userId');
        const filterAction = searchParams.get('actionType');

        let conditions = [];
        let values = [];
        let paramIndex = 1;

        if (filterUserId) {
            conditions.push(`a.user_id = $${paramIndex}`);
            values.push(filterUserId);
            paramIndex++;
        }

        if (filterAction) {
            conditions.push(`a.action_type = $${paramIndex}`);
            values.push(filterAction);
            paramIndex++;
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        // 1. Get total count for pagination
        const countResult = await query(`SELECT COUNT(*) FROM lead_activities a ${whereClause}`, values);
        const totalItems = parseInt(countResult.rows[0].count);

        // 2. Fetch paginated logs
        const logsQuery = `
      SELECT 
        a.id, a.action_type, a.old_status, a.new_status, a.note, a.created_at,
        u.name as user_name,
        l.id as lead_id, l.name as lead_name, l.type as lead_type
      FROM lead_activities a
      LEFT JOIN users u ON a.user_id = u.id
      LEFT JOIN leads l ON a.lead_id = l.id
      ${whereClause}
      ORDER BY a.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

        const logsResult = await query(logsQuery, [...values, limit, offset]);

        // 3. Fetch all approved users for the filter dropdown
        const usersResult = await query(`SELECT id, name FROM users WHERE status = 'approved' ORDER BY name ASC`);

        return NextResponse.json({
            success: true,
            logs: logsResult.rows,
            users: usersResult.rows,
            pagination: {
                page,
                totalPages: Math.ceil(totalItems / limit) || 1,
                totalItems
            }
        });
    } catch (error) {
        console.error('Fetch logs error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}