export async function analyzeScrapedLead(text, platform) {
    if (!text || text.length < 15) return { intent: "irrelevant", score: "low" };

    const prompt = `
    You are an EXTREMELY STRICT Lead Qualification AI for '3vltn Business' (A Premium Domain Name Marketplace).
    We ONLY want HOT LEADS. Do not pass junk.

    Platform: ${platform}
    Post: "${text.substring(0, 1000)}" 

    RULES (BE RUTHLESS):
    - "buyer": User EXPLICITLY states they have budget and want to buy/acquire a domain NOW.
    - "seller": User EXPLICITLY states they own a high-value domain and want to sell it NOW.
    - "irrelevant": IF THEY MENTION web hosting, coding, SEO, active directory domains, or just asking general questions WITHOUT intent to transact, mark it irrelevant.

    We only want HOT leads. If it is a "maybe", mark it irrelevant.

    Return JSON ONLY: 
    { 
        "intent": "buyer|seller|irrelevant", 
        "score": "high|low", 
        "email": "extracted_email_or_null",
        "outreach": "A short, 2-sentence professional outreach message to close the deal." 
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
                temperature: 0.1
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