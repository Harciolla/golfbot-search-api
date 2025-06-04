// api/search.js

// 1) Import only what we need:
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

// 2) Set up Supabase (your database):
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 3) Set up OpenAI (the AI helper):
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 4) This function runs when someone visits /api/search?q=…
export async function GET(req) {
  try {
    // 4.1) Get the “q” part from the web address:
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");

    // 4.2) If “q” is missing, tell them “Missing query”:
    if (!query) {
      return new Response(
        JSON.stringify({ error: "Missing query (q=...)" }),
        { status: 400 }
      );
    }

    // 4.3) Ask OpenAI to turn the text into numbers (embedding):
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: query,
    });

    // 4.4) Take the numbers from the answer:
    const [{ embedding }] = embeddingResponse.data;

    // 4.5) Ask Supabase to run “match_golf_courses” using those numbers:
    const { data, error } = await supabase.rpc("match_golf_courses", {
      query_embedding: embedding,
      match_threshold: 0.5,
      match_count: 5,
    });

    // 4.6) If Supabase has an error, show it:
    if (error) {
      return new Response(
        JSON.stringify({ error: "Supabase error: " + error.message }),
        { status: 500 }
      );
    }

    // 4.7) Otherwise, send back the list of golf courses:
    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    // 4.8) If anything goes wrong, show the error message and where it broke:
    return new Response(
      JSON.stringify({
        status: "error",
        message: err.message,
        stack: err.stack,
      }),
      { status: 500 }
    );
  }
}
