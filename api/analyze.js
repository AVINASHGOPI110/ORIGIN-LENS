async function callGemini(body, API_KEY, model) {
  for (let i = 0; i < 3; i++) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    const data = await response.json();

    console.log(`TRY ${i + 1} (${model}) RESPONSE:`, data);

    // ✅ success
    if (!data.error && data.candidates) return data;

    // 🔁 retry only if server busy
    if (data.error?.code === 503) {
      await new Promise((r) => setTimeout(r, 2000));
    } else {
      throw new Error(data.error?.message || "Unknown error");
    }
  }

  throw new Error("Server busy after retries");
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { image, prompt } = req.body;
    const API_KEY = process.env.GEMINI_API_KEY;

    if (!API_KEY) {
      throw new Error("API key missing");
    }

    // 🛑 Prevent very large images
    if (!image || image.length > 2000000) {
      return res.status(200).json({
        answer: JSON.stringify({
          verdict: "UNKNOWN",
          confidence: 0,
          summary: "Image too large or invalid.",
        }),
      });
    }

    const cleanImage = image.replace(/^data:image\/\w+;base64,/, "");

    const requestBody = {
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: "image/jpeg",
                data: cleanImage,
              },
            },
          ],
        },
      ],
    };

    let data;

    try {
      // 🔥 Primary model
      data = await callGemini(requestBody, API_KEY, "gemini-2.5-flash");
    } catch (e) {
      console.log("Primary model failed → switching to fallback");

      // 🔁 Fallback model
      data = await callGemini(requestBody, API_KEY, "gemini-2.5-flash-lite");
    }

    if (!data.candidates) {
      throw new Error("Invalid AI response");
    }

    const aiText = data.candidates[0].content.parts[0].text;

    return res.status(200).json({ answer: aiText });

  } catch (error) {
    console.error("FULL ERROR:", error);

    return res.status(200).json({
      answer: JSON.stringify({
        verdict: "UNKNOWN",
        confidence: 0,
        summary: "Server busy. Please try again.",
      }),
    });
  }
};
