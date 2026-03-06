import { ApifyClient } from 'apify-client';

const client = new ApifyClient({ token: process.env.APIFY_API_TOKEN });

export async function scrapeReddit(limit = 10) {
    const input = {
        searches: ["buying domain name", "selling premium domain", "need a domain for startup"],
        sort: "new",
        maxItems: parseInt(limit),
    };
    const run = await client.actor("trudax/reddit-scraper-lite").call(input);
    const { items } = await client.dataset(run.defaultDatasetId).listItems();

    return items.map(item => ({
        platform: 'reddit',
        content: `${item.title || ''}\n${item.body || ''}`.trim(),
        url: item.url,
        author_name: item.username || "Unknown",
    }));
}

export async function scrapeTwitter(limit = 10) {
    const input = {
        searchTerms: ["buying domain", "selling domain"],
        maxItems: parseInt(limit),
        sort: "Latest",
    };
    const run = await client.actor("apidojo/tweet-scraper").call(input);
    const { items } = await client.dataset(run.defaultDatasetId).listItems();

    return items.map(item => ({
        platform: 'twitter',
        content: item.text || item.full_text || "",
        url: `https://twitter.com/${item.author?.userName}/status/${item.id}`,
        author_name: item.author?.userName || "Unknown",
    }));
}