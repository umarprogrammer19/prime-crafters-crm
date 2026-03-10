// Helper to get keywords based on business category
const getSearchTerms = (category) => {
    switch (category) {
        case '3VLT':
            // Targeting: Startups needing names, investors flipping, direct buyers/sellers
            return [
                "looking to buy domain", "buy premium domain", "WTB domain", // Buyer intent
                "domain for sale", "selling premium domain", "domain portfolio", // Seller intent
                "startup naming ideas", "need a domain for startup", "brandable domain", // Startup intent
                "domain appraisal", "domain broker", "exact match domain", "domain flipping" // Industry jargon
            ];

        case 'Internal AI Agency':
            // Targeting: Founders needing devs, businesses needing automation, specific tech stacks
            return [
                "looking for AI developer", "hire AI developer", "need AI tool", // Direct hiring
                "building AI startup", "looking for technical co-founder AI", "AI MVP developer needed", // Founders
                "automate my workflow", "automation software help", "Zapier expert needed", "Make.com expert", // Automation
                "custom AI solution", "OpenAI API integration", "build an AI agent", "custom LLM", "AI chatbot developer" // Tech-specific
            ];

        case 'Trenew':
            // Targeting: Urgent home repairs, requests for local quotes, specific system failures
            return [
                "roof replacement", "need a new roof", "leaking roof repair", "roofing contractor recommendations", // Roofing
                "solar panel quote", "solar panel installer", "best solar company", "home energy audit", // Solar
                "HVAC replacement quote", "AC repair near me", "furnace replacement", "HVAC stopped working", "HVAC technician needed" // HVAC
            ];

        default:
            return ["buy", "sell"];
    }
};

// Safe extractor to prevent the .map() crash
const extractItems = (data, platform) => {
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.items)) return data.items;
    if (data && data.data && Array.isArray(data.data.items)) return data.data.items;

    // If we get here, Apify sent back an error or unexpected object. Let's log it.
    console.error(`[${platform.toUpperCase()} SCRAPER ERROR]:`, JSON.stringify(data).substring(0, 300));
    return []; // Return empty array so the app doesn't crash
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

    const data = await res.json();
    const items = extractItems(data, 'reddit');

    return items.map(item => ({
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

    const data = await res.json();
    const items = extractItems(data, 'twitter');

    return items.map(item => ({
        platform: 'twitter',
        content: item.text || item.full_text || "",
        url: `https://twitter.com/${item.author?.userName}/status/${item.id}`,
        author_name: item.author?.userName || "Unknown",
    }));
}

export async function scrapeFacebook(limit = 10, category, customUrl = null) {
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

    const data = await res.json();
    const items = extractItems(data, 'facebook');

    return items.map(item => ({
        platform: 'facebook',
        content: item.text || "",
        url: item.url,
        author_name: item.user?.name || "Unknown",
    }));
}