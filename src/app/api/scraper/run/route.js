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

        const { platform, limit, url } = await req.json();
        let rawItems = [];

        if (platform === 'reddit') rawItems = await scrapeReddit(limit);
        else if (platform === 'twitter') rawItems = await scrapeTwitter(limit);
        else if (platform === 'facebook') rawItems = await scrapeFacebook(limit, url);
        else return NextResponse.json({ error: 'Invalid platform' }, { status: 400 });

        // Temporary storage arrays
        const highLeads = [];
        const mediumLeads = [];
        const lowLeads = [];

        // Process through AI
        for (const item of rawItems) {
            if (!item.content) continue;

            const aiResult = await analyzeScrapedLead(item.content, item.platform);

            if (aiResult.intent !== 'irrelevant') {
                const fullLead = { ...item, ...aiResult };
                if (aiResult.score === 'high') highLeads.push(fullLead);
                else if (aiResult.score === 'medium') mediumLeads.push(fullLead);
                else if (aiResult.score === 'low') lowLeads.push(fullLead);
            }
        }

        // Determine what to save based on the new rules
        let leadsToSave = [...highLeads, ...mediumLeads];
        let fallbackTriggered = false;

        // If no High or Medium leads were found, save the Low leads instead
        if (leadsToSave.length === 0 && lowLeads.length > 0) {
            leadsToSave = [...lowLeads];
            fallbackTriggered = true;
        }

        let savedCount = 0;

        // Save to Database
        for (const lead of leadsToSave) {
            try {
                await query(
                    `INSERT INTO scraped_leads (platform, author_name, content, url, author_email, intent, score, outreach_draft) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (url) DO NOTHING`,
                    [lead.platform, lead.author_name, lead.content, lead.url, lead.email || null, lead.intent, lead.score, lead.outreach]
                );
                savedCount++;
            } catch (dbError) {
                console.error("DB Save Error:", dbError.message);
            }
        }

        // Construct a detailed response message
        let finalMessage = `Scraped ${rawItems.length} posts. `;
        if (savedCount > 0) {
            finalMessage += fallbackTriggered
                ? `No Hot/Medium leads found. Falling back to save ${savedCount} Low priority leads.`
                : `Saved ${savedCount} High/Medium priority leads.`;
        } else {
            finalMessage += `No relevant domain leads found at all.`;
        }

        return NextResponse.json({ success: true, message: finalMessage });

    } catch (error) {
        console.error('Scraper Route Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}