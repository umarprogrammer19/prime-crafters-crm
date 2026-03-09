import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import bcrypt from "bcryptjs";
// Get active/approved users
export async function GET() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const user = jwt.verify(token, process.env.JWT_SECRET);
        if (user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const result = await query(`
      SELECT id, name, email, role, status, created_at 
      FROM users 
      WHERE status != 'pending' 
      ORDER BY role ASC, name ASC
    `);

        return NextResponse.json({ success: true, users: result.rows });
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// Update User Role or Status
export async function PATCH(req) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const adminUser = jwt.verify(token, process.env.JWT_SECRET);
        if (adminUser.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const { userId, role, status } = await req.json();

        if (!userId) return NextResponse.json({ error: 'User ID required' }, { status: 400 });

        // Prevent admin from accidentally demoting themselves
        if (userId === adminUser.id && (role !== 'admin' || status !== 'approved')) {
            return NextResponse.json({ error: 'You cannot demote your own admin account.' }, { status: 400 });
        }

        await query(
            `UPDATE users SET role = COALESCE($1, role), status = COALESCE($2, status) WHERE id = $3`,
            [role, status, userId]
        );

        return NextResponse.json({ success: true, message: 'User updated successfully' });
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// Create a User Directly (Admin Only)
export async function POST(req) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const adminUser = jwt.verify(token, process.env.JWT_SECRET);
        if (adminUser.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const { name, email, password, role } = await req.json();

        if (!name || !email || !password || !role) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Check if email already exists
        const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
        if (existing.rowCount > 0) {
            return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
        }

        // 2. Hash the password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // 3. Insert as an instantly 'approved' user
        const result = await query(
            `INSERT INTO users (name, email, password_hash, role, status) 
       VALUES ($1, $2, $3, $4, 'approved') RETURNING id, name, email, role, status, created_at`,
            [name, email, passwordHash, role]
        );

        return NextResponse.json({
            success: true,
            message: 'User created successfully',
            user: result.rows[0]
        });
    } catch (error) {
        console.error('Create user error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}