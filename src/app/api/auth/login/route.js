import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '@/lib/db';

export async function POST(req) {
    try {
        const { email, password } = await req.json();

        if (!email || !password) {
            return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
        }

        // 1. Find user
        const result = await query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rowCount === 0) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        const user = result.rows[0];

        // 2. Check password
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        // 3. CHECK APPROVAL STATUS (Crucial Step)
        if (user.status === 'pending') {
            return NextResponse.json({
                error: 'Account pending',
                message: 'Your account is waiting for Admin approval.'
            }, { status: 403 });
        }

        if (user.status === 'rejected') {
            return NextResponse.json({
                error: 'Account rejected',
                message: 'Your account access was denied.'
            }, { status: 403 });
        }

        // 4. Generate JWT
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // 5. Set HTTP-only Cookie
        const response = NextResponse.json({
            success: true,
            user: { id: user.id, name: user.name, role: user.role }
        });

        response.cookies.set({
            name: 'token',
            value: token,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 // 1 day
        });

        return response;

    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}