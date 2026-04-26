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

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
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
        }),
      }
    );

    const data = await response.json();

    console.log("GEMINI RESPONSE:", data);

    const aiText =
      data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

    return res.status(200).json({ answer: aiText });

  } catch (error) {
    console.error("FULL ERROR:", error);
    return res.status(500).json({ error: error.message });
  }
};
