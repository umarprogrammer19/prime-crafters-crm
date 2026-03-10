export async function analyzeScrapedLead(text, platform, category) {
    if (!text || text.length < 15) return { intent: "irrelevant", score: "low" };

    let rules = "";
    if (category === '3VLT') {
        rules = `
    - "buyer": User EXPLICITLY states they have budget and want to buy/acquire a domain NOW.
    - "seller": User EXPLICITLY states they own a high-value domain and want to sell it NOW.
    - "irrelevant": General tech chat, web hosting issues.`;
    } else if (category === 'Internal AI Agency') {
        rules = `
    - "buyer": User needs a developer, automation software help, or AI MVP built.
    - "seller": (Rarely used here, mark as buyer if they need a service).
    - "irrelevant": Just sharing AI news, ChatGPT prompts, or general discussion.`;
    } else if (category === 'Trenew') {
        rules = `
    - "buyer": Homeowner explicitly asking for roofing, HVAC, or solar panel installation quotes/repair.
    - "seller": (Not applicable, mark as buyer if they need a service).
    - "irrelevant": DIY questions, general home complaints without asking for professional help.`;
    }

    const prompt = `
    You are a STRICT Lead Qualification AI for '${category}'.
    Categorize the following social media post.

    Platform: ${platform}
    Post: "${text.substring(0, 1000)}" 

    INTENT RULES:
    ${rules}

    SCORING RULES:
    - "high": Ready to transact NOW. Explicitly needs the service or asset.
    - "medium": Exploring options. Asking for recommendations or quotes.
    - "low": Very vague interest. 

    Return JSON ONLY: 
    { 
        "intent": "buyer|seller|irrelevant", 
        "score": "high|medium|low", 
        "email": "extracted_email_or_null",
        "outreach": "A short, 2-sentence professional outreach message based on their specific post." 
    }
  `;

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-4-turbo",
                messages: [{ role: "user", content: prompt }],
                response_format: { type: "json_object" },
                temperature: 0.2
            })
        });

        const data = await response.json();
        if (data.error) return { intent: "irrelevant", score: "low" };

        return JSON.parse(data.choices[0].message.content);
    } catch (e) {
        return { intent: "irrelevant", score: "low" };
    }
}