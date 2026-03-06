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

export async function scrapeFacebook(limit = 10, url = null) {
    const defaultUrls = [
        "https://www.facebook.com/groups/3280541332233338",
        "https://www.facebook.com/groups/domainbusiness",
        "https://www.facebook.com/groups/bestwebhostingdomainflip",
        "https://www.facebook.com/groups/domainnamegroup",
        "https://www.facebook.com/groups/saasfounders"
    ];;
    const targetUrl = url || defaultUrls[Math.floor(Math.random() * defaultUrls.length)];

    const input = {
        startUrls: [{ url: targetUrl }],
        resultsLimit: parseInt(limit),
        viewOption: "CHRONOLOGICAL",
        useProxy: true
    };

    const run = await client.actor("apify/facebook-groups-scraper").call(input);
    const { items } = await client.dataset(run.defaultDatasetId).listItems();

    return items.map(item => ({
        platform: 'facebook',
        content: item.text || "",
        url: item.url,
        author_name: item.user?.name || "Unknown",
    }));
}