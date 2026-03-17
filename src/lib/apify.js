// The Ultimate High-Intent Keyword Matrix
const getSearchTerms = (category) => {
    switch (category) {
        case '3VLT':
            // Targeting: Direct acquisitions, startup founders, and portfolio liquidations
            return [
                "looking to buy domain", "buy premium domain", "WTB domain", "acquire domain name",
                "domain for sale", "selling premium domain", "domain portfolio for sale", "liquidating domains",
                "startup naming ideas", "need a domain for my startup", "brandable domain name",
                "domain appraisal needed", "recommend a domain broker", "exact match domain", "where to sell premium domains"
            ];

        case 'Internal AI Agency':
            // Targeting: Founders with budgets, businesses needing immediate automation, custom dev requests
            return [
                "looking for AI developer", "hire AI developer", "hire AI agency", "need custom AI tool",
                "custom LLM development", "RAG implementation help", "need to build an AI chatbot",
                "automate my workflow", "automation expert needed", "Zapier expert needed", "Make.com freelancer",
                "automate manual data entry", "looking for technical co-founder SaaS", "need an MVP built fast",
                "connect my CRM to", "streamline business operations AI"
            ];

        case 'Trenew':
            // Targeting: Urgent repairs and direct requests for local Bay Area quotes
            return [
                "roof replacement quote Bay Area", "need a new roof San Francisco", "roof leak repair Oakland", "recommend a roofer SF", "storm damage roof repair",
                "solar installer recommendations Bay Area", "solar panel quote San Jose", "home battery backup installer", "best solar company near me",
                "HVAC replacement quote Bay Area", "AC broken who to call", "furnace replacement Oakland", "HVAC tech recommendations", "mini split installer Bay Area", "AC blowing warm air"
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
            startUrls: getSubredditUrls(category),
            skipComments: true,
            skipUserPosts: false,
            skipCommunity: false,
            ignoreStartUrls: false,
            searchPosts: true,
            searchComments: false,
            searchCommunities: false,
            searchUsers: false,
            sort: "new",
            includeNSFW: false,
            maxItems: parseInt(limit),
            maxPostCount: parseInt(limit),
            maxComments: 0,
            maxCommunitiesCount: 2,
            maxUserCount: 2,
            scrollTimeout: 40,
            proxy: {
                useApifyProxy: true,
                apifyProxyGroups: ["RESIDENTIAL"]
            },
            debugMode: false
        })
    });

    const data = await res.json();
    const rawItems = extractItems(data, 'reddit');
    const strictItems = rawItems.slice(0, parseInt(limit));

    return strictItems.map(item => ({
        platform: 'reddit',
        content: `${item.title || ''}\n${item.selftext || item.text || item.body || ''}`.trim(),
        url: item.url || (item.permalink ? `https://reddit.com${item.permalink}` : ''),
        author_name: item.author || item.username || "Unknown",
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