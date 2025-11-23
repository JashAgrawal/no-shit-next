"use server"
import { GoogleGenAI } from '@google/genai';

// Get API key from environment variable (Next.js)
const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.warn('GEMINI_API_KEY not found in environment variables');
}

// Initialize Gemini client
const genAI = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

// Call Gemini with function calling tools (non-streaming)
export async function sendWithTools(
  prompt: string,
  functionDeclarations: any[],
  systemPrompt?: string
): Promise<{ text: string; toolCalls: Array<{ name: string; args: any }> }> {
  if (!genAI) {
    throw new Error('Gemini API key not configured. Please set GEMINI_API_KEY environment variable.');
  }

  const config: any = {
    model: 'gemini-2.5-flash',
  };

  if (systemPrompt) {
    config.systemInstruction = { parts: [{ text: systemPrompt }] };
  }

  if (functionDeclarations && functionDeclarations.length > 0) {
    config.tools = [{ functionDeclarations }];
  }

  const result = await genAI.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    config: config
  });

  const response = result;

  // Safely extract text
  let text = '';
  try {
    text = response.text || '';
  } catch (e) {
    // Text might be missing if only function calls are returned
    // console.log('No text in response or error extracting text:', e);
  }

  // Extract functionCalls
  let toolCalls: Array<{ name: string; args: any }> = [];

  // Check if functionCalls exists as a property
  if (response.functionCalls) {
    const calls = response.functionCalls;
    if (calls && calls.length > 0) {
      toolCalls = calls.map(call => ({
        name: call.name || '',
        args: call.args || {}
      })).filter(c => c.name !== '');
    }
  } else if (Array.isArray((response as any).functionCalls)) {
    // Handle case where it might be a property
    toolCalls = (response as any).functionCalls;
  }

  // Fallback to manual extraction if helper didn't return anything or isn't available
  if (toolCalls.length === 0) {
    try {
      const candidates: any[] = (response as any).candidates || [];
      for (const cand of candidates) {
        const parts = cand?.content?.parts || [];
        for (const p of parts) {
          if (p.functionCall) {
            const name = p.functionCall.name;
            let args: any = {};
            try { args = p.functionCall.args || {}; } catch { }
            toolCalls.push({ name, args });
          }
        }
      }
    } catch { }
  }

  return { text: text || '', toolCalls };
}

export async function sendToGemini(
  prompt: string,
  systemPrompt?: string
): Promise<string> {
  if (!genAI) {
    throw new Error('Gemini API key not configured. Please set GEMINI_API_KEY environment variable.');
  }

  try {
    const config: any = {};

    if (systemPrompt) {
      config.systemInstruction = {
        parts: [{ text: systemPrompt }],
      };
    }

    const result = await genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: config
    });

    try {
      return result.text || '';
    } catch (e) {
      console.warn('Error extracting text from response:', e);
      return '';
    }
  } catch (error) {
    console.error('Gemini API error:', error);
    throw new Error(`Gemini API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function* streamFromGemini(
  prompt: string,
  systemPrompt?: string,
  tools?: any[]
): AsyncGenerator<{ text?: string; toolCalls?: any[] }, void, unknown> {
  if (!genAI) {
    throw new Error('Gemini API key not configured. Please set GEMINI_API_KEY environment variable.');
  }

  try {
    const config: any = {};

    if (systemPrompt) {
      config.systemInstruction = {
        parts: [{ text: systemPrompt }],
      };
    }

    if (tools && tools.length > 0) {
      config.tools = [{ functionDeclarations: tools }];
    }

    const result = await genAI.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: config,
    });

    for await (const chunk of result) {
      let chunkText = '';
      try {
        chunkText = chunk.text || '';

      } catch { }

      let toolCalls: any[] | undefined;
      try {
        if (chunk.functionCalls) {
          toolCalls = chunk.functionCalls;
          console.log(toolCalls)
        }
      } catch { }

      if (chunkText || (toolCalls && toolCalls.length > 0)) {
        yield { text: chunkText, toolCalls: toolCalls && toolCalls.length > 0 ? toolCalls : undefined };
      }
    }
  } catch (error) {
    console.error('Gemini streaming error:', error);
    throw new Error(`Gemini streaming error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function generateMedia(prompt: string): Promise<{ url: string; mimeType: string } | null> {
  if (!genAI) {
    throw new Error('Gemini API key not configured. Please set GEMINI_API_KEY environment variable.');
  }

  try {
    // Use gemini-2.5-flash-image model for image generation
    const response = await genAI.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: prompt,
      config: {
        responseModalities: ['Image']
      }
    });

    // Iterate through response parts to find the inline image data
    //@ts-ignore
    for (const part of response.parts) {
      if (part.text) {
        console.log('Response text:', part.text);
      } else if (part.inlineData) {
        // Extract the base64 image data and MIME type
        const imageData = part.inlineData.data;
        const mimeType = part.inlineData.mimeType || 'image/png';

        // Create a data URI from the base64 data
        const url = `data:${mimeType};base64,${imageData}`;

        console.log('Image generated successfully');
        return {
          url,
          mimeType
        };
      }
    }

    console.warn('No images found in response:', response);
    return null;
  } catch (error) {
    console.error('Gemini Image Generation error:', error);
    // Don't throw, just return null so the UI can handle it gracefully
    return null;
  }
}
