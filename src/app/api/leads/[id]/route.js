import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

async function getUser() {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return null;
    try { return jwt.verify(token, process.env.JWT_SECRET); }
    catch (e) { return null; }
}

// GET: Fetch a single lead and its activity history
export async function GET(req, { params }) {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const leadId = params.id;

    try {
        // 1. Fetch Lead Info
        const leadResult = await query(
            `SELECT l.*, u.name as assignee_name 
       FROM leads l LEFT JOIN users u ON l.assigned_to = u.id 
       WHERE l.id = $1`, [leadId]
        );

        if (leadResult.rowCount === 0) {
            return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
        }

        const lead = leadResult.rows[0];

        // Security Check: Sales can only view assigned leads
        if (user.role === 'sales' && lead.assigned_to !== user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // 2. Fetch Activity Timeline
        const activitiesResult = await query(
            `SELECT a.*, u.name as user_name 
       FROM lead_activities a LEFT JOIN users u ON a.user_id = u.id 
       WHERE a.lead_id = $1 ORDER BY a.created_at DESC`, [leadId]
        );

        // 3. (Admin Only) Fetch all sales reps for the assignment dropdown
        let salesReps = [];
        if (user.role === 'admin') {
            const repsResult = await query(`SELECT id, name FROM users WHERE role = 'sales' AND status = 'approved'`);
            salesReps = repsResult.rows;
        }

        return NextResponse.json({ success: true, lead, activities: activitiesResult.rows, salesReps });
    } catch (error) {
        console.error('Error fetching lead details:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PATCH: Update Lead (Status, Assignee) or Add Note
export async function PATCH(req, { params }) {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const leadId = params.id;
    const { action_type, status, assigned_to, note } = await req.json();

    try {
        const currentLead = await query(`SELECT status, assigned_to FROM leads WHERE id = $1`, [leadId]);
        if (currentLead.rowCount === 0) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
        const oldData = currentLead.rows[0];

        // Handle Status Change
        if (action_type === 'status_change') {
            await query(`UPDATE leads SET status = $1, updated_at = NOW() WHERE id = $2`, [status, leadId]);
            await query(
                `INSERT INTO lead_activities (lead_id, user_id, action_type, old_status, new_status) VALUES ($1, $2, 'status_change', $3, $4)`,
                [leadId, user.id, oldData.status, status]
            );
        }
        // Handle Assignment (Admin Only)
        else if (action_type === 'assign' && user.role === 'admin') {
            await query(`UPDATE leads SET assigned_to = $1, updated_at = NOW() WHERE id = $2`, [assigned_to, leadId]);
            await query(
                `INSERT INTO lead_activities (lead_id, user_id, action_type, note) VALUES ($1, $2, 'assigned', $3)`,
                [leadId, user.id, `Assigned lead to user ID: ${assigned_to}`]
            );
        }
        // Handle Adding a Note
        else if (action_type === 'note_added') {
            await query(
                `INSERT INTO lead_activities (lead_id, user_id, action_type, note) VALUES ($1, $2, 'note_added', $3)`,
                [leadId, user.id, note]
            );
            // Touch the updated_at timestamp on the lead
            await query(`UPDATE leads SET updated_at = NOW() WHERE id = $1`, [leadId]);
        }

        return NextResponse.json({ success: true, message: 'Lead updated successfully' });
    } catch (error) {
        console.error('Error updating lead:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}