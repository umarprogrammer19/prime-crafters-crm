export async function analyzeScrapedLead(text, platform) {
    if (!text || text.length < 15) return { intent: "irrelevant", score: "low" };

    const prompt = `
    You are a Lead Qualification AI for '3vltn Business' (A Premium Domain Name Marketplace).
    Categorize the following social media post.

    Platform: ${platform}
    Post: "${text.substring(0, 1000)}" 

    INTENT RULES:
    - "buyer": Looking to acquire a domain, asking for naming ideas, or looking for marketplaces.
    - "seller": Trying to sell, auction, or get an appraisal for a domain they own.
    - "irrelevant": General tech chat, web hosting issues, active directory, coding. Mark as irrelevant.

    SCORING RULES (Only apply if intent is buyer/seller):
    - "high": Ready to transact NOW. Explicitly mentions buying/selling a specific asset or has a budget.
    - "medium": Exploring options. Asking for appraisals, looking for marketplace recommendations, or brainstorming startup names.
    - "low": Very vague interest. Mentioning domains in passing but might be open to a pitch.

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