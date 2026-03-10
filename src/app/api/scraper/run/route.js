// src/app/api/scraper/run/route.js
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { scrapeReddit, scrapeTwitter, scrapeFacebook } from '@/lib/apify';
import { analyzeScrapedLead } from '@/lib/openai';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

export async function POST(req) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const user = jwt.verify(token, process.env.JWT_SECRET);
        if (user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const { platform, limit, url, category } = await req.json(); 
        let rawItems = [];

        if (platform === 'reddit') rawItems = await scrapeReddit(limit, category);
        else if (platform === 'twitter') rawItems = await scrapeTwitter(limit, category);
        else if (platform === 'facebook') rawItems = await scrapeFacebook(limit, category, url);
        else return NextResponse.json({ error: 'Invalid platform' }, { status: 400 });

        const highLeads = [];
        const mediumLeads = [];
        const lowLeads = [];

        // Process through AI
        for (const item of rawItems) {
            if (!item.content) continue;
            const aiResult = await analyzeScrapedLead(item.content, item.platform, category);

            if (aiResult.intent !== 'irrelevant') {
                const fullLead = { ...item, ...aiResult };
                if (aiResult.score === 'high') highLeads.push(fullLead);
                else if (aiResult.score === 'medium') mediumLeads.push(fullLead);
                else if (aiResult.score === 'low') lowLeads.push(fullLead);
            }
        }

        let leadsToSave = [...highLeads, ...mediumLeads];
        let fallbackTriggered = false;

        if (leadsToSave.length === 0 && lowLeads.length > 0) {
            leadsToSave = [...lowLeads];
            fallbackTriggered = true;
        }

        // ROUND ROBIN ASSIGNMENT PREP
        // Fetch all active sales reps
        const salesRepsResult = await query(`SELECT id FROM users WHERE role = 'sales' AND status = 'approved' ORDER BY id ASC`);
        const salesReps = salesRepsResult.rows;

        let savedCount = 0;

        // Map the Category to the DB Types based on your CRM structure
        let dbType = 'Client'; // Default
        let dbCategory = category;
        if (category === 'Internal AI Agency') { dbType = 'Internal'; dbCategory = 'AI Automation'; }
        if (category === '3VLT') { dbType = 'Client'; dbCategory = '3vltn Business'; }
        if (category === 'Trenew') { dbType = 'Client'; dbCategory = 'Trerenew'; }

        // Save directly to main `leads` table
        for (let i = 0; i < leadsToSave.length; i++) {
            const lead = leadsToSave[i];

            // Determine assignee using Round Robin (modulo math)
            let assignedToId = null;
            if (salesReps.length > 0) {
                assignedToId = salesReps[i % salesReps.length].id;
            }

            try {
                const sourceStr = `Scraped (${lead.platform}) - ${lead.url}`;

                // Insert into main leads table 
                const newLead = await query(`
          INSERT INTO leads (name, email, source, type, category, status, assigned_to, created_by)
          VALUES ($1, $2, $3, $4, $5, 'New', $6, $7)
          RETURNING id
        `, [
                    lead.author_name, lead.email || null, sourceStr, dbType, dbCategory, assignedToId, user.id
                ]);

                // Add AI Draft as a note
                if (lead.outreach) {
                    await query(`
            INSERT INTO lead_activities (lead_id, user_id, action_type, note)
            VALUES ($1, $2, 'note_added', $3)
          `, [newLead.rows[0].id, user.id, `AI Suggested Outreach:\n\n${lead.outreach}`]);
                }

                savedCount++;
            } catch (dbError) {
                console.error("DB Save Error:", dbError.message);
            }
        }

        let finalMessage = `Scraped ${rawItems.length} posts for ${category}. `;
        if (savedCount > 0) {
            finalMessage += fallbackTriggered
                ? `Saved & Assigned ${savedCount} Low priority leads.`
                : `Saved & Assigned ${savedCount} High/Medium priority leads.`;
        } else {
            finalMessage += `No relevant leads found.`;
        }

        return NextResponse.json({ success: true, message: finalMessage });

    } catch (error) {
        console.error('Scraper Route Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}