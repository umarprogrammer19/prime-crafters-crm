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

        // Extract query parameters
        const { searchParams } = new URL(req.url);
        const type = searchParams.get('type') || 'Client';
        const page = parseInt(searchParams.get('page')) || 1;
        const limit = 10; // Items per page
        const offset = (page - 1) * limit;

        // Filter Parameters
        const status = searchParams.get('status');
        const category = searchParams.get('category');
        const platform = searchParams.get('platform');
        const assignedTo = searchParams.get('assigned_to');
        const search = searchParams.get('search');

        // Dynamically build the WHERE clause
        let conditions = ['l.type = $1'];
        let values = [type];
        let paramIndex = 2;

        // Security check: Sales reps only see their own assigned leads
        if (user.role === 'sales') {
            conditions.push(`l.assigned_to = $${paramIndex}`);
            values.push(user.id);
            paramIndex++;
        } else if (assignedTo) {
            conditions.push(`l.assigned_to = $${paramIndex}`);
            values.push(assignedTo);
            paramIndex++;
        }

        if (status) {
            conditions.push(`l.status = $${paramIndex}`);
            values.push(status);
            paramIndex++;
        }

        if (category) {
            conditions.push(`l.category = $${paramIndex}`);
            values.push(category);
            paramIndex++;
        }

        if (platform) {
            // Platform is stored inside the source string (e.g., "Scraped (reddit) - ...")
            conditions.push(`l.source ILIKE $${paramIndex}`);
            values.push(`%${platform}%`);
            paramIndex++;
        }

        if (search) {
            conditions.push(`(l.name ILIKE $${paramIndex} OR l.email ILIKE $${paramIndex} OR l.content ILIKE $${paramIndex})`);
            values.push(`%${search}%`);
            paramIndex++;
        }

        const whereClause = `WHERE ${conditions.join(' AND ')}`;

        // 1. Get total count for pagination
        const countQuery = `SELECT COUNT(*) FROM leads l ${whereClause}`;
        const countResult = await query(countQuery, values);
        const totalItems = parseInt(countResult.rows[0].count);

        // 2. Fetch paginated data
        const dataQuery = `
      SELECT l.*, u.name as assignee_name 
      FROM leads l 
      LEFT JOIN users u ON l.assigned_to = u.id 
      ${whereClause}
      ORDER BY l.created_at DESC 
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

        // Create a new array to avoid mutating the original for the count query
        const dataValues = [...values, limit, offset];
        const result = await query(dataQuery, dataValues);

        // 3. Fetch Sales Reps for the Filter Dropdown (Admins/Marketing only)
        let salesReps = [];
        if (user.role !== 'sales') {
            const repsResult = await query(`SELECT id, name FROM users WHERE role = 'sales' AND status = 'approved'`);
            salesReps = repsResult.rows;
        }

        return NextResponse.json({
            success: true,
            leads: result.rows,
            salesReps,
            pagination: {
                page,
                totalPages: Math.ceil(totalItems / limit) || 1,
                totalItems
            }
        });

    } catch (error) {
        console.error('Leads fetch error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}