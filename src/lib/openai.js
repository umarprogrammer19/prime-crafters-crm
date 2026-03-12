export async function analyzeScrapedLead(text, platform, category) {
    if (!text || text.length < 10) return { intent: "irrelevant", score: "low" };

    let categoryContext = "";

    // 1. Give the AI specific context for what a "Lead" looks like for each business
    if (category === '3VLT') {
        categoryContext = `
    Business: Premium Domain Name Marketplace.
    - "buyer": Anyone asking for startup naming ideas, where to buy domains, looking for a specific domain, or asking about domain marketplaces.
    - "seller": Anyone trying to sell a domain, asking for a domain appraisal, or showing off a domain portfolio to sell.
    - "irrelevant": Tech support for DNS, web hosting server issues, coding problems.`;
    } else if (category === 'Internal AI Agency') {
        categoryContext = `
    Business: AI Development & Automation Agency.
    - "buyer": Anyone looking to hire a developer, asking how to automate a workflow (Zapier/Make), struggling to build an AI feature, or asking for recommendations for custom AI tools.
    - "seller": (Rare) Treat as buyer if they need an agency partner.
    - "irrelevant": Sharing generic AI news, posting ChatGPT prompts, debating AI philosophy without a business use case.`;
    } else if (category === 'Trenew') {
        categoryContext = `
    Business: Roofing, Solar, and HVAC Home Improvement.
    - "buyer": Homeowners asking for contractor recommendations, complaining about a broken AC/Heater, mentioning a leaking roof, or asking if solar panels are worth it.
    - "seller": (Not applicable, always treat as buyer).
    - "irrelevant": DIY home repair questions (unless they sound overwhelmed), general weather complaints.`;
    }

    const prompt = `
    You are a highly intelligent, context-aware Lead Qualification AI for '${category}'.
    Analyze this social media post from ${platform} and determine if this person could be a potential customer. 
    Social media posts are often casual. Look for IMPLICIT intent, pain points, or questions that our business can solve.

    Post Content: "${text.substring(0, 1500)}" 

    ${categoryContext}

    SCORING RULES:
    - "high": Clear, immediate need. (e.g., "Need a roofer ASAP", "Hiring an AI dev", "Looking to buy a premium domain").
    - "medium": Exploring options or asking for recommendations. (e.g., "Thinking about solar", "Where should I buy a domain?", "How do I automate this?").
    - "low": Discussing the topic but no immediate request. (e.g., "Domain flipping is interesting", "I love AI tools").
    
    If the post fits our business, DO NOT mark it irrelevant. Be generous but accurate.

    Return JSON ONLY: 
    { 
        "intent": "buyer|seller|irrelevant", 
        "score": "high|medium|low", 
        "email": "extracted_email_or_null",
        "outreach": "Write a highly personalized, casual, 2-sentence direct message (DM) we can send them based on their exact post. Do not sound salesy, sound helpful." 
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
        if (data.error) {
            console.error("OpenAI API Error:", data.error.message);
            return { intent: "irrelevant", score: "low" };
        }

        return JSON.parse(data.choices[0].message.content);
    } catch (e) {
        console.error("AI Error:", e.message);
        return { intent: "irrelevant", score: "low" };
    }
}