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

        const logsQuery = `
      SELECT 
        a.action_type, a.old_status, a.new_status, a.note, a.created_at,
        u.name as user_name,
        l.name as lead_name
      FROM lead_activities a
      LEFT JOIN users u ON a.user_id = u.id
      LEFT JOIN leads l ON a.lead_id = l.id
      ${whereClause}
      ORDER BY a.created_at DESC
    `;

        const result = await query(logsQuery, values);

        // Build CSV Content
        let csvContent = "Date,Team Member,Action Type,Target Lead,Details\n";

        result.rows.forEach(log => {
            const safeString = (str) => `"${(str || '').toString().replace(/"/g, '""')}"`;

            let details = "";
            if (log.action_type === 'status_change') {
                details = `Changed from ${log.old_status} to ${log.new_status}`;
            } else {
                details = log.note;
            }

            const row = [
                safeString(new Date(log.created_at).toLocaleString()),
                safeString(log.user_name || 'System'),
                safeString(log.action_type),
                safeString(log.lead_name || 'Deleted Lead'),
                safeString(details)
            ];

            csvContent += row.join(',') + '\n';
        });

        return new NextResponse(csvContent, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="activity_report_${new Date().toISOString().split('T')[0]}.csv"`
            }
        });

    } catch (error) {
        console.error('CSV Export Error:', error);
        return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
    }
}