// api/search.js

// A minimal handler that always returns a JSON “Hello” message
export default function handler(req, res) {
  console.log("🚀 /api/search called (Hello World)");
  res.status(200).json({ message: "Hello from api/search!" });
}
