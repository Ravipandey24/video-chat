// Helper function for streaming responses from OpenAI
export function createStreamableResponse(stream: ReadableStream<any>) {
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });
  }
  
  // Create a ReadableStream from an async iterator
  export function createReadableStream<T>(
    iterator: AsyncIterator<T>,
    encoder = new TextEncoder()
  ): ReadableStream {
    return new ReadableStream({
      async pull(controller) {
        const { value, done } = await iterator.next();
        
        if (done) {
          controller.close();
        } else if (value) {
          const chunk = typeof value === 'string' 
            ? encoder.encode(value) 
            : value;
          controller.enqueue(chunk);
        }
      },
    });
  }
  
  // Process OpenAI streaming response
  export async function* processOpenAIStream(response: any) {
    for await (const chunk of response) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        yield content;
      }
    }
  }
  
  // Create a streaming handler for Next.js API routes
  export function createStreamingHandler(handler: (req: Request) => Promise<ReadableStream>) {
    return async function(req: Request) {
      try {
        const stream = await handler(req);
        return new Response(stream, {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
          },
        });
      } catch (error) {
        console.error('Streaming error:', error);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        });
      }
    };
  }