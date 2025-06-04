export async function GET(req) {
  return new Response(JSON.stringify({ message: "Hello from GolfBot Search API!" }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
