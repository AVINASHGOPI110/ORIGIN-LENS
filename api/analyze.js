module.exports = async function handler(req, res) {
  console.log("API KEY EXISTS:", !!process.env.GEMINI_API_KEY);
console.log("BODY RECEIVED:", req.body);
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { prompt, image } = req.body;
    const cleanImage = image.replace(/^data:image\/\w+;base64,/, "");

    const API_KEY = process.env.GEMINI_API_KEY;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
  contents: [
    {
      parts: image
        ? [
            { text: prompt },
            {
              inline_data: {
                mime_type: "image/jpeg",
                data: cleanImage,
              },
            },
          ]
        : [{ text: prompt }],
    },
  ],
})

    const data = await response.json();
    console.log("GEMINI RESPONSE:", data);

    if (data.error) {
      return res.status(400).json({ error: data.error.message });
    }

    const aiText =
      data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

    return res.status(200).json({ answer: aiText });

  } catch (error) {
    console.error("FULL ERROR:", error);
    return res.status(500).json({ error: error.message });
  }
}
