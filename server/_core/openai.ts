/**
 * Direct OpenAI Integration - ZERO MANUS DEPENDENCIES
 * 
 * This module provides direct access to OpenAI API without any Manus proxy.
 * Fully portable and self-hostable.
 */

import axios from "axios";

// Environment variable for OpenAI API key
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

export type Role = "system" | "user" | "assistant";

export interface Message {
  role: Role;
  content: string;
}

export interface LLMResponse {
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface InvokeLLMOptions {
  messages: Message[];
  model?: string;
  temperature?: number;
  max_tokens?: number;
  response_format?: {
    type: "json_schema" | "text";
    json_schema?: {
      name: string;
      strict?: boolean;
      schema: Record<string, unknown>;
    };
  };
}

/**
 * Invoke OpenAI LLM directly - no Manus proxy
 */
export async function invokeLLM(options: InvokeLLMOptions): Promise<LLMResponse> {
  if (!OPENAI_API_KEY) {
    console.error("[OpenAI] OPENAI_API_KEY not configured");
    throw new Error("OPENAI_API_KEY environment variable is required");
  }

  const {
    messages,
    model = "gpt-4o",
    temperature = 0.7,
    max_tokens = 4096,
    response_format,
  } = options;

  try {
    const requestBody: Record<string, unknown> = {
      model,
      messages,
      temperature,
      max_tokens,
    };

    // Add response format if specified
    if (response_format) {
      requestBody.response_format = response_format;
    }

    const response = await axios.post(OPENAI_API_URL, requestBody, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
      },
      timeout: 60000, // 60 second timeout
    });

    return response.data as LLMResponse;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error("[OpenAI] API Error:", error.response?.data || error.message);
      throw new Error(`OpenAI API error: ${error.response?.data?.error?.message || error.message}`);
    }
    throw error;
  }
}

/**
 * Simple completion helper
 */
export async function complete(prompt: string, systemPrompt?: string): Promise<string> {
  const messages: Message[] = [];
  
  if (systemPrompt) {
    messages.push({ role: "system", content: systemPrompt });
  }
  messages.push({ role: "user", content: prompt });

  const response = await invokeLLM({ messages });
  return response.choices[0]?.message?.content || "";
}

/**
 * JSON completion helper - returns parsed JSON
 */
export async function completeJSON<T = unknown>(
  prompt: string,
  schemaName: string,
  schema: Record<string, unknown>,
  systemPrompt?: string
): Promise<T> {
  const messages: Message[] = [];
  
  if (systemPrompt) {
    messages.push({ role: "system", content: systemPrompt });
  }
  messages.push({ role: "user", content: prompt });

  const response = await invokeLLM({
    messages,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: schemaName,
        strict: true,
        schema,
      },
    },
  });

  const content = response.choices[0]?.message?.content || "{}";
  return JSON.parse(content) as T;
}

/**
 * Check if OpenAI is configured
 */
export function isOpenAIConfigured(): boolean {
  return Boolean(OPENAI_API_KEY && OPENAI_API_KEY.length > 0);
}
