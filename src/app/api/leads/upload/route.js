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
        if (user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const { leads, category } = await req.json();

        // Fetch active sales reps for Round Robin
        const salesRepsResult = await query(`SELECT id FROM users WHERE role = 'sales' AND status = 'approved' ORDER BY id ASC`);
        const salesReps = salesRepsResult.rows;

        let savedCount = 0;
        let duplicateCount = 0;

        // Map categories for DB
        let dbType = 'Client';
        let dbCategory = category;
        if (category === 'Internal AI Agency') { dbType = 'Internal'; dbCategory = 'AI Automation'; }
        if (category === '3VLT') { dbType = 'Client'; dbCategory = '3vltn Business'; }
        if (category === 'Trenew') { dbType = 'Client'; dbCategory = 'Trerenew'; }

        for (let i = 0; i < leads.length; i++) {
            const lead = leads[i];

            // Round Robin Assignment
            let assignedToId = null;
            if (salesReps.length > 0) {
                assignedToId = salesReps[i % salesReps.length].id;
            }

            try {
                // The new SQL query that blocks duplicate usernames AND duplicate URLs
                const newLead = await query(`
                    INSERT INTO leads (name, email, source, type, category, status, assigned_to, created_by, content, url)
                    SELECT $1, $2, $3, $4, $5, 'New', $6, $7, $8, $9
                    WHERE NOT EXISTS (
                        SELECT 1 FROM leads WHERE name = $1 OR source = $3
                    )
                    RETURNING id
                `, [
                    lead.name || 'Unknown CSV Lead',
                    lead.email || null,
                    lead.source || 'CSV Upload',
                    dbType,
                    dbCategory,
                    assignedToId,
                    user.id,
                    lead.content || 'Imported via CSV',
                    lead.url || ''
                ]);

                if (newLead.rowCount > 0) {
                    savedCount++;
                } else {
                    duplicateCount++; // Caught by the "One Per Username" rule!
                }
            } catch (err) {
                console.error("CSV DB Insert Error:", err.message);
            }
        }

        return NextResponse.json({
            success: true,
            message: `Successfully assigned ${savedCount} new leads. Blocked ${duplicateCount} duplicates.`
        });

    } catch (error) {
        console.error('CSV Upload Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}