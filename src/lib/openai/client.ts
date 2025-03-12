import OpenAI from 'openai';

// Check that we have the required API key
if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing OPENAI_API_KEY environment variable');
}

// Create a singleton OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default openai;

// Helper function to process video frames with vision model
export async function analyzeVideoFrames(
  frames: string[],
  prompt: string,
  maxFrames: number = 5
) {
  // Limit number of frames to avoid token limits
  const selectedFrames = frames.length > maxFrames
    ? frames.filter((_, i) => i % Math.ceil(frames.length / maxFrames) === 0).slice(0, maxFrames)
    : frames;
  
  // Create content array for the vision model
  const contentArray = [
    { type: "text" as const, text: prompt },
    ...selectedFrames.map((frameUrl) => ({
      type: "image_url" as const,
      image_url: {
        url: frameUrl,
        detail: "low" as const,
      },
    })),
  ];

  // Call the OpenAI API
  const response = await openai.chat.completions.create({
    model: "gpt-4-vision-preview",
    messages: [
      {
        role: "user",
        content: contentArray,
      },
    ],
    max_tokens: 500,
  });

  return response.choices[0].message.content;
}