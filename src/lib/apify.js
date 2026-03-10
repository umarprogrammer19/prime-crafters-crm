// Helper to get keywords based on business category
const getSearchTerms = (category) => {
    switch (category) {
        case '3VLT':
            return ["Selling domain", "Looking to buy domain", "Domain for sale", "Domain marketplace", "Buy premium domain"];
        case 'Internal AI Agency':
            return ["Looking for AI developer", "Need AI tool / AI SaaS", "Building AI startup", "Automation software help", "AI MVP developer needed"];
        case 'Trenew':
            return ["Roof replacement", "Need roofer / HVAC / AC repair", "Solar panel installer", "Roof leak repair", "HVAC replacement quote"];
        default:
            return ["buy", "sell"];
    }
};

export async function scrapeReddit(limit = 10, category) {
    const url = `https://api.apify.com/v2/acts/trudax~reddit-scraper-lite/run-sync-get-dataset-items?token=${process.env.APIFY_API_TOKEN}`;

    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            searches: getSearchTerms(category),
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

export async function scrapeTwitter(limit = 10, category) {
    const url = `https://api.apify.com/v2/acts/apidojo~tweet-scraper/run-sync-get-dataset-items?token=${process.env.APIFY_API_TOKEN}`;

    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            searchTerms: getSearchTerms(category),
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

export async function scrapeFacebook(limit = 10, category, customUrl = null) {
    // Default URLs based on category
    const defaultUrls = {
        '3VLT': ["https://www.facebook.com/groups/domainbusiness", "https://www.facebook.com/groups/bestwebhostingdomainflip"],
        'Internal AI Agency': ["https://www.facebook.com/groups/saasfounders", "https://www.facebook.com/groups/artificialintelligenceforbusiness"],
        'Trenew': ["https://www.facebook.com/groups/homeimprovement", "https://www.facebook.com/groups/hvacadvice"]
    };

    const urlsToUse = defaultUrls[category] || defaultUrls['3VLT'];
    const targetUrl = customUrl || urlsToUse[Math.floor(Math.random() * urlsToUse.length)];

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