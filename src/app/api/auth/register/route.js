import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';

export async function POST(req) {
    try {
        const { name, email, password } = await req.json();

        if (!name || !email || !password) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Check if user exists
        const existingUser = await query('SELECT id FROM users WHERE email = $1', [email]);
        if (existingUser.rowCount > 0) {
            return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
        }

        // 2. Hash password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // 3. Insert into DB as 'pending'
        const result = await query(
            `INSERT INTO users (name, email, password_hash, role, status) 
       VALUES ($1, $2, $3, 'unassigned', 'pending') RETURNING id, name, email, status`,
            [name, email, passwordHash]
        );

        return NextResponse.json({
            success: true,
            message: 'Registration successful. Waiting for admin approval.',
            user: result.rows[0]
        });

    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}