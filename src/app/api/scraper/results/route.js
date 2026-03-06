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
        if (user.role !== 'admin' && user.role !== 'marketing') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page')) || 1;
        const limit = 10; // Items per page
        const offset = (page - 1) * limit;

        // Get total count for pagination
        const countResult = await query(`SELECT COUNT(*) FROM scraped_leads WHERE status = 'pending'`);
        const totalItems = parseInt(countResult.rows[0].count);

        // Fetch the leads
        const result = await query(`
      SELECT * FROM scraped_leads 
      WHERE status = 'pending' 
      ORDER BY created_at DESC 
      LIMIT $1 OFFSET $2
    `, [limit, offset]);

        // Fetch sales reps for the assignment dropdown
        const repsResult = await query(`SELECT id, name FROM users WHERE role = 'sales' AND status = 'approved'`);

        return NextResponse.json({
            success: true,
            leads: result.rows,
            salesReps: repsResult.rows,
            pagination: {
                page,
                totalPages: Math.ceil(totalItems / limit),
                totalItems
            }
        });

    } catch (error) {
        console.error('Fetch Staging Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}