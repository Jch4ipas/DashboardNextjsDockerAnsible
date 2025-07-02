export async function GET() {
  const apiKey = process.env.NASA_API_KEY;

  if (!apiKey) {
    return new Response(JSON.stringify({ error: "Missing API key" }), { status: 500 });
  }

  const response = await fetch(`https://api.nasa.gov/planetary/apod?api_key=${apiKey}`);

  if (!response.ok) {
    return new Response(JSON.stringify({ error: "NASA API error" }), { status: 500 });
  }

  const data = await response.json();
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}