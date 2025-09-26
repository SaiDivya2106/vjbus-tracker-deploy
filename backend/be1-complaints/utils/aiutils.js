import { GenAI } from '@google/genai';

const genai = new GenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function isComplaintRelevant(description, category) {
  try {
    const response = await genai.embeddings.create({
      model: 'gemini-embedding-001',
      input: [description, category],
    });

    const [descEmbedding, categoryEmbedding] = response.data.map(d => d.embedding);

    const cosineSimilarity = (a, b) => {
      const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
      const normA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
      const normB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
      return dot / (normA * normB);
    };

    const similarity = cosineSimilarity(descEmbedding, categoryEmbedding);
    return similarity >= 0.5; // Adjust threshold as needed
  } catch (err) {
    console.error('Error checking complaint relevance:', err);
    return false;
  }
}
