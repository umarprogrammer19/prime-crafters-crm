// Helper to get keywords based on business category
const getSearchTerms = (category) => {
    switch (category) {
        case '3VLT':
            return [
                "looking to buy domain", "buy premium domain", "WTB domain",
                "domain for sale", "selling premium domain", "domain portfolio",
                "startup naming ideas", "need a domain for startup", "brandable domain",
                "domain appraisal", "domain broker", "exact match domain", "domain flipping"
            ];
        case 'Internal AI Agency':
            return [
                "looking for AI developer", "hire AI developer", "need AI tool",
                "building AI startup", "looking for technical co-founder AI", "AI MVP developer needed",
                "automate my workflow", "automation software help", "Zapier expert needed", "Make.com expert",
                "custom AI solution", "OpenAI API integration", "build an AI agent", "custom LLM", "AI chatbot developer"
            ];
        case 'Trenew':
            // Hyper-focused Bay Area keywords
            return [
                "roof replacement Bay Area", "need a new roof San Francisco", "leaking roof repair Oakland", "Bay area roofer recommendations",
                "solar panel quote San Jose", "Bay Area solar panel installer", "best solar company Bay Area",
                "HVAC replacement quote Bay Area", "AC repair near me San Francisco", "furnace replacement Oakland", "Bay Area HVAC technician"
            ];
        default:
            return ["buy", "sell"];
    }
};

// Helper to get specific subreddits for trudax~reddit-scraper
const getSubredditUrls = (category) => {
    let urls = [];
    if (category === '3VLT') {
        urls = [
            "https://www.reddit.com/r/Domains/",
            "https://www.reddit.com/r/DomainsForSale/",
            "https://www.reddit.com/r/DomainSales/",
            "https://www.reddit.com/r/unstoppabledomains/",
            "https://www.reddit.com/r/web3domains/"
        ];
    } else if (category === 'Internal AI Agency') {
        urls = [
            "https://www.reddit.com/r/SaaS/",
            "https://www.reddit.com/r/artificial/",
            "https://www.reddit.com/r/smallbusiness/",
            "https://www.reddit.com/r/SideProject/",
            "https://www.reddit.com/r/Automate/"
        ];
    } else if (category === 'Trenew') {
        urls = [
            "https://www.reddit.com/r/HomeImprovement/",
            "https://www.reddit.com/r/Roofing/",
            "https://www.reddit.com/r/solar/",
            "https://www.reddit.com/r/hvacadvice/",
            "https://www.reddit.com/r/bayarea/"
        ];
    }

    // Format them exactly how the Apify payload expects
    return urls.map(url => ({ url }));
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
        '3VLT': ["https://www.facebook.com/groups/sellingdomain", "https://www.facebook.com/groups/NaganeneHarusAffiliateMarketingIntlWrldwideGroups", "https://www.facebook.com/groups/domaincity", "https://www.facebook.com/groups/535342753181963", "https://www.facebook.com/groups/301201911798602"],
        'Internal AI Agency': ["https://www.facebook.com/groups/saasfounders", "https://www.facebook.com/groups/1853909482666355/", "https://www.facebook.com/groups/646961952787500/", "https://www.facebook.com/groups/artificialintelligenceforbusiness"],
        'Trenew': ["https://www.facebook.com/groups/homeimprovement", "https://www.facebook.com/groups/wasicraft.com.pk", "https://www.facebook.com/groups/hvacadvice", "https://www.facebook.com/groups/160291351257714/"],
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