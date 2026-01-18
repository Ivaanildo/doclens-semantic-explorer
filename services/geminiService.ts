
import { GoogleGenAI, Type } from "@google/genai";
import { Message, ChatContextPayload, DetailedNodeInfo } from '../types';
import { SYSTEM_INSTRUCTION, GEMINI_MODEL_FLASH, GEMINI_MODEL_IMAGE } from '../constants';

const getClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

const mapMessagesToContent = (messages: Message[]): any[] => {
  return messages.map(msg => {
    const parts: any[] = [];
    if (msg.content) parts.push({ text: msg.content });
    if (msg.attachments) {
      msg.attachments.forEach(att => {
        if (att.type === 'image') {
          const base64Data = att.data.split(',')[1] || att.data;
          parts.push({ inlineData: { mimeType: 'image/png', data: base64Data } });
        }
      });
    }
    return { role: msg.role, parts: parts };
  });
};

interface PdfContext {
  title: string;
  page?: number;
}

export const streamChatResponse = async (
  history: Message[],
  userMessage: string,
  imageAttachment: string | undefined,
  context: PdfContext | undefined,
  chatContextPayload: ChatContextPayload | undefined,
  onChunk: (text: string) => void
) => {
  const ai = getClient();
  const contents = mapMessagesToContent(history);
  
  let structuredPrompt = "";
  if (context) structuredPrompt += `Document Context: "${context.title}", Page ${context.page}\n`;
  if (chatContextPayload?.selectedConcept) structuredPrompt += `Focusing on concept: "${chatContextPayload.selectedConcept}"\n`;
  
  structuredPrompt += `Request: ${userMessage}\n\nGround your answer strictly in the document content. For every key fact or technical detail, include a citation in this format: [CITATION: page_number | "brief_snippet"].\n`;
  
  const currentParts: any[] = [{ text: structuredPrompt }];
  if (imageAttachment) {
      const base64Data = imageAttachment.split(',')[1] || imageAttachment;
      currentParts.push({ inlineData: { mimeType: 'image/png', data: base64Data } });
  }
  
  contents.push({ role: 'user', parts: currentParts });

  try {
    const result = await ai.models.generateContentStream({
      model: GEMINI_MODEL_FLASH,
      contents: contents,
      config: { systemInstruction: SYSTEM_INSTRUCTION }
    });
    for await (const chunk of result) {
      if (chunk.text) onChunk(chunk.text);
    }
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const fetchNodeDetails = async (concept: string, context: string): Promise<DetailedNodeInfo> => {
    const ai = getClient();
    const prompt = `Validate concept "${concept}" from document context: "${context}". Classify its relationships and provide evidence.`;
    
    try {
        const response = await ai.models.generateContent({
            model: GEMINI_MODEL_FLASH,
            contents: prompt,
            config: { 
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        definition: { type: Type.STRING },
                        examples: { type: Type.ARRAY, items: { type: Type.STRING } },
                        type: { type: Type.STRING },
                        confidence: { type: Type.NUMBER },
                        evidence: { 
                            type: Type.ARRAY, 
                            items: { 
                                type: Type.OBJECT, 
                                properties: { 
                                    page: { type: Type.NUMBER }, 
                                    snippet: { type: Type.STRING },
                                    confidence: { type: Type.NUMBER }
                                } 
                            } 
                        },
                        relationships: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    target: { type: Type.STRING },
                                    type: { type: Type.STRING },
                                    score: { type: Type.NUMBER }
                                }
                            }
                        }
                    }
                }
            }
        });
        const result = JSON.parse(response.text || "{}");
        return {
            label: concept,
            definition: result.definition || "...",
            examples: result.examples || [],
            type: result.type || 'concept',
            confidence: result.confidence || 0,
            evidence: result.evidence || [],
            relationships: result.relationships || []
        };
    } catch (e) {
        return { label: concept, definition: "N/A", examples: [], type: 'concept', confidence: 0, evidence: [], relationships: [] };
    }
};

export const generateDocumentMindMap = async (documentTitle: string, rootConcept?: string): Promise<string> => {
  const ai = getClient();
  const prompt = `Create a Markdown Mindmap for "${documentTitle}". 
  Focus on the most important technical concepts and their hierarchies.
  Classify relationships in brackets like [depends_on], [extends], [contradicts]. 
  Return ONLY the map between [GRAPH_START] and [GRAPH_END].`;

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL_FLASH,
      contents: prompt,
    });
    const match = /\[GRAPH_START\]([\s\S]*?)\[GRAPH_END\]/.exec(response.text || "");
    return match ? match[1].trim() : "# " + documentTitle;
  } catch (error) { return "# Error"; }
};

export const generateRemix = async (instr: string, img: string, ctx?: PdfContext) => {
    const ai = getClient();
    const base64Data = img.split(',')[1] || img;
    
    // Using generateContent for image editing (Nano Banana style)
    const response = await ai.models.generateContent({
        model: GEMINI_MODEL_IMAGE,
        contents: {
            parts: [
                {
                    inlineData: {
                        data: base64Data,
                        mimeType: 'image/png',
                    },
                },
                {
                    text: `Based on the provided image from ${ctx?.title || 'a document'}, perform this visual remix/edit: ${instr}. Generate a modified version of this image.`,
                },
            ],
        },
    });

    let resultImage = null;
    let resultText = "";
    
    // Nano Banana response may contain multiple parts
    const candidate = response.candidates?.[0];
    if (candidate && candidate.content.parts) {
        for (const part of candidate.content.parts) {
            if (part.inlineData) {
                resultImage = `data:image/png;base64,${part.inlineData.data}`;
            } else if (part.text) {
                resultText += part.text;
            }
        }
    }
    
    return { text: resultText || "Visual interpretation completed.", image: resultImage };
};

export const compareConcepts = async (c: string[]) => {
    const ai = getClient();
    const response = await ai.models.generateContent({
        model: GEMINI_MODEL_FLASH,
        contents: `Compare: ${c.join(', ')}. Use table format to contrast similarities and differences based on the document.`,
    });
    return response.text;
};

export const generateTitle = async (f: string) => {
    const ai = getClient();
    const r = await ai.models.generateContent({ model: GEMINI_MODEL_FLASH, contents: `Summarize this user query in 4 words for a chat title: ${f}` });
    return r.text || "New Analysis";
};
