export async function scrapeReddit(limit = 10) {
    const url = `https://api.apify.com/v2/acts/trudax~reddit-scraper-lite/run-sync-get-dataset-items?token=${process.env.APIFY_API_TOKEN}`;

    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            searches: ["buying domain name", "selling premium domain", "need a domain for startup"],
            sort: "new",
            maxItems: parseInt(limit),
        })
    });

    const items = await res.json();

    return (items || []).map(item => ({
        platform: 'reddit',
        content: `${item.title || ''}\n${item.body || ''}`.trim(),
        url: item.url,
        author_name: item.username || "Unknown",
    }));
}

export async function scrapeTwitter(limit = 10) {
    const url = `https://api.apify.com/v2/acts/apidojo~tweet-scraper/run-sync-get-dataset-items?token=${process.env.APIFY_API_TOKEN}`;

    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            searchTerms: ["buying domain", "selling domain"],
            maxItems: parseInt(limit),
            sort: "Latest",
        })
    });

    const items = await res.json();

    return (items || []).map(item => ({
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
    ];
    const targetUrl = url || defaultUrls[Math.floor(Math.random() * defaultUrls.length)];

    const apiUrl = `https://api.apify.com/v2/acts/apify~facebook-groups-scraper/run-sync-get-dataset-items?token=${process.env.APIFY_API_TOKEN}`;

    const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            startUrls: [{ url: targetUrl }],
            resultsLimit: parseInt(limit),
            viewOption: "CHRONOLOGICAL",
            useProxy: true
        })
    });

    const items = await res.json();

    return (items || []).map(item => ({
        platform: 'facebook',
        content: item.text || "",
        url: item.url,
        author_name: item.user?.name || "Unknown",
    }));
}