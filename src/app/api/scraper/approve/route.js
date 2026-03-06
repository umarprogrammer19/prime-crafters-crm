import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

export async function POST(req) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const user = jwt.verify(token, process.env.JWT_SECRET);
        if (user.role !== 'admin' && user.role !== 'marketing') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { scrapedLeadId, action, assignedTo } = await req.json();

        if (!scrapedLeadId || !action) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        if (action === 'reject') {
            await query(`UPDATE scraped_leads SET status = 'rejected' WHERE id = $1`, [scrapedLeadId]);
            return NextResponse.json({ success: true, message: 'Lead discarded.' });
        }

        if (action === 'approve') {
            // 1. Get the scraped lead details
            const scraped = await query(`SELECT * FROM scraped_leads WHERE id = $1`, [scrapedLeadId]);
            if (scraped.rowCount === 0) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
            const leadData = scraped.rows[0];

            // 2. Insert into main leads table
            const sourceStr = `Scraped (${leadData.platform}) - ${leadData.url}`;

            const newLead = await query(`
        INSERT INTO leads (name, company, email, source, type, category, status, assigned_to, created_by)
        VALUES ($1, $2, $3, $4, 'Client', '3vltn Business', 'New', $5, $6)
        RETURNING id
      `, [
                leadData.author_name,
                leadData.intent === 'buyer' ? 'Domain Buyer' : 'Domain Seller',
                leadData.author_email,
                sourceStr,
                assignedTo || null,
                user.id
            ]);

            // 3. Insert AI Draft as the first note in lead_activities
            if (leadData.outreach_draft) {
                await query(`
          INSERT INTO lead_activities (lead_id, user_id, action_type, note)
          VALUES ($1, $2, 'note_added', $3)
        `, [newLead.rows[0].id, user.id, `AI Suggested Outreach:\n\n${leadData.outreach_draft}`]);
            }

            // 4. Mark scraped lead as approved
            await query(`UPDATE scraped_leads SET status = 'approved' WHERE id = $1`, [scrapedLeadId]);

            return NextResponse.json({ success: true, message: 'Lead added to CRM successfully.' });
        }

    } catch (error) {
        console.error('Approval Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}