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

        // Fetch all leads with assignee names
        const result = await query(`
      SELECT l.id, l.name, l.company, l.email, l.phone, l.type, l.category, l.source, l.status, 
             u.name as assigned_to_name, l.created_at, l.updated_at
      FROM leads l
      LEFT JOIN users u ON l.assigned_to = u.id
      ORDER BY l.created_at DESC
    `);

        const leads = result.rows;

        // Create CSV Header
        let csvContent = "ID,Name,Company,Email,Phone,Type,Category,Source,Status,Assigned To,Created At,Last Updated\n";

        // Map rows to CSV format
        leads.forEach(lead => {
            const safeString = (str) => `"${(str || '').toString().replace(/"/g, '""')}"`;

            const row = [
                lead.id,
                safeString(lead.name),
                safeString(lead.company),
                safeString(lead.email),
                safeString(lead.phone),
                safeString(lead.type),
                safeString(lead.category),
                safeString(lead.source),
                safeString(lead.status),
                safeString(lead.assigned_to_name || 'Unassigned'),
                safeString(new Date(lead.created_at).toLocaleString()),
                safeString(new Date(lead.updated_at).toLocaleString())
            ];

            csvContent += row.join(',') + '\n';
        });

        // Return the file as a downloadable CSV
        return new NextResponse(csvContent, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="crm_leads_report_${new Date().toISOString().split('T')[0]}.csv"`
            }
        });

    } catch (error) {
        console.error('CSV Export Error:', error);
        return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
    }
}