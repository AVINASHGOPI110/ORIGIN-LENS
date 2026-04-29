async function callGemini(body, API_KEY) {
  for (let i = 0; i < 3; i++) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    const data = await response.json();

    console.log("TRY", i + 1, "RESPONSE:", data);

    // ✅ Success
    if (!data.error) return data;

    // 🔁 Retry if server busy
    if (data.error.code === 503) {
      await new Promise((r) => setTimeout(r, 2000));
    } else {
      throw new Error(data.error.message);
    }
  }

  throw new Error("Server busy. Try again later.");
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  console.log("API KEY EXISTS:", !!process.env.GEMINI_API_KEY);
  console.log("BODY RECEIVED:", req.body);

  try {
    const { image, prompt } = req.body;

    const API_KEY = process.env.GEMINI_API_KEY;

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

    // ✅ Use retry logic here
    const data = await callGemini(requestBody, API_KEY);

    console.log("FINAL GEMINI RESPONSE:", data);

    const aiText =
      data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

    return res.status(200).json({ answer: aiText });

  } catch (error) {
    console.error("FULL ERROR:", error);

    // ✅ Better user message
    return res.status(200).json({
      answer: JSON.stringify({
        verdict: "UNKNOWN",
        confidence: 0,
        summary: "Server is busy. Please try again.",
      }),
    });
  }
};
