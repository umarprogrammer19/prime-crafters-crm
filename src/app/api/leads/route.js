import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

// Helper to authenticate
async function getUser() {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return null;
    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch (e) {
        return null;
    }
}

export async function POST(req) {
    const user = await getUser();
    // Only Admin and Marketing can add new leads
    if (!user || (user.role !== 'admin' && user.role !== 'marketing')) {
        return NextResponse.json({ error: 'Unauthorized to create leads' }, { status: 403 });
    }

    try {
        const data = await req.json();
        const { name, company, email, phone, source, type, category } = data;

        const result = await query(
            `INSERT INTO leads (name, company, email, phone, source, type, category, status, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'New', $8) RETURNING *`,
            [name, company, email, phone, source, type, category, user.id]
        );

        return NextResponse.json({ success: true, lead: result.rows[0] });
    } catch (error) {
        console.error('Error creating lead:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function GET(req) {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type'); // Expects 'Internal' or 'Client'

    if (!type) return NextResponse.json({ error: 'Lead type required' }, { status: 400 });

    try {
        let sql = `
      SELECT l.*, u.name as assignee_name 
      FROM leads l 
      LEFT JOIN users u ON l.assigned_to = u.id 
      WHERE l.type = $1
    `;
        const params = [type];

        // ROLE-BASED FILTERING: Sales only sees their assigned leads
        if (user.role === 'sales') {
            sql += ` AND l.assigned_to = $2`;
            params.push(user.id);
        }

        sql += ` ORDER BY l.created_at DESC`;

        const result = await query(sql, params);
        return NextResponse.json({ success: true, leads: result.rows });
    } catch (error) {
        console.error('Error fetching leads:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}