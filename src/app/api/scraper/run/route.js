import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { scrapeReddit, scrapeTwitter } from '@/lib/apify';
import { analyzeScrapedLead } from '@/lib/openai';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

export async function POST(req) {
    try {
        // 1. Auth Check (Admin Only)
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const user = jwt.verify(token, process.env.JWT_SECRET);
        if (user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        // 2. Parse Request
        const { platform, limit } = await req.json();
        let rawItems = [];

        // 3. Run Scraper
        if (platform === 'reddit') rawItems = await scrapeReddit(limit);
        else if (platform === 'twitter') rawItems = await scrapeTwitter(limit);
        else return NextResponse.json({ error: 'Invalid platform' }, { status: 400 });

        let savedCount = 0;

        // 4. Process through Strict AI
        for (const item of rawItems) {
            if (!item.content) continue;

            const aiResult = await analyzeScrapedLead(item.content, item.platform);

            // STRICT RULE: Only save if intent is buyer/seller AND score is high
            if (aiResult.intent !== 'irrelevant' && aiResult.score === 'high') {
                try {
                    await query(
                        `INSERT INTO scraped_leads (platform, author_name, content, url, author_email, intent, score, outreach_draft) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (url) DO NOTHING`,
                        [item.platform, item.author_name, item.content, item.url, aiResult.email || null, aiResult.intent, aiResult.score, aiResult.outreach]
                    );
                    savedCount++;
                } catch (dbError) {
                    console.error("DB Save Error:", dbError.message);
                }
            }
        }

        return NextResponse.json({
            success: true,
            message: `Scraped ${rawItems.length} posts. AI found and saved ${savedCount} HOT leads.`
        });

    } catch (error) {
        console.error('Scraper Route Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}