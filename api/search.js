import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q");

  if (!query) {
    return new Response(JSON.stringify({ error: "Missing query" }), { status: 400 });
  }

  const embeddingResponse = await openai.createEmbedding({
    model: "text-embedding-ada-002",
    input: query,
  });

  const [{ embedding }] = embeddingResponse.data.data;

  const { data, error } = await supabase.rpc("match_golf_courses", {
    query_embedding: embedding,
    match_threshold: 0.5,
    match_count: 5
  });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' },
  });
}
