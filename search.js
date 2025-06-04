import { NextResponse } from 'next/server';
import { Configuration, OpenAIApi } from 'openai';
import { createClient } from '@supabase/supabase-js';

const openai = new OpenAIApi(new Configuration({ apiKey: process.env.OPENAI_API_KEY }));
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q");

  if (!query) {
    return NextResponse.json({ error: "Missing query" }, { status: 400 });
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
