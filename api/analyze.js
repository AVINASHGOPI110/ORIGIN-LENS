export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { prompt, image } = req.body;

    const API_KEY = process.env.GEMINI_API_KEY;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
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
                image
                  ? {
                      inline_data: {
                        mime_type: "image/jpeg",
                        data: image,
                      },
                    }
                  : {},
              ],
            },
          ],
        }),
      }
    );

    const data = await response.json();

    if (data.error) {
      return res.status(400).json({ error: data.error.message });
    }

    const aiText =
      data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

    return res.status(200).json({ answer: aiText });

  } catch (error) {
    console.error("Server Error:", error);
    return res.status(500).json({ error: "Server error" });
  }
}