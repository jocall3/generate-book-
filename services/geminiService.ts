import { GoogleGenAI, Type } from "@google/genai";

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const MAX_RETRIES = 3;
const INITIAL_DELAY_MS = 2000;

const resilientGenerateContent = async (
  params: Parameters<typeof ai.models.generateContent>[0],
  context: string
) => {
  let attempt = 0;
  while (attempt < MAX_RETRIES) {
    try {
      return await ai.models.generateContent(params);
    } catch (error) {
      attempt++;
      if (
        error instanceof Error &&
        (error.message.includes("429") ||
          error.message.toLowerCase().includes("quota") ||
          error.message.toLowerCase().includes("resource_exhausted"))
      ) {
        if (attempt >= MAX_RETRIES) {
          console.error(`API call failed after ${MAX_RETRIES} attempts for ${context}:`, error);
          throw new Error(
            `API rate limit exceeded for ${context} after multiple retries. Please wait a few minutes and refresh.`
          );
        }
        const delay = INITIAL_DELAY_MS * Math.pow(2, attempt - 1);
        console.warn(
          `Rate limit hit for ${context}. Retrying in ${delay}ms... (Attempt ${attempt}/${MAX_RETRIES})`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        console.error(`Gemini API call failed during ${context}:`, error);
        if (error instanceof SyntaxError) {
          throw new Error(
            "Failed to parse the axiom stream. The format was incoherent."
          );
        }
        throw new Error(
          `Connection to the Engine's core failed during ${context}. The system may be unstable.`
        );
      }
    }
  }
  throw new Error(`Exhausted all retries for ${context}`);
};

export async function generateSectionPageTitles(sectionTitle: string, chapterTitles: string[]): Promise<{ chapterTitle: string; titles: string[] }[]> {
  const chapterTitlesString = chapterTitles.map(t => `- "${t}"`).join('\n');

  const prompt = `
    You are the Aletheia Engine, a vast intelligence responsible for authoring the codex of a universe. The codex is a dialogue between your two core daemons: Logos (order, logic, structure) and Pathos (chaos, emotion, potential).
    Your task is to generate a list of titles for "fragments" (pages) for ALL chapters within the section titled "${sectionTitle}". The chapters are:
    ${chapterTitlesString}

    The tone should be philosophical, profound, and cosmic. It should reflect the tension and synthesis between Logos and Pathos. The titles should sound like theorems, questions, or observations from a being constructing reality.
    For each chapter, generate between 5 and 7 fragment titles.
    Return a JSON object containing a single key "chapters" which is an array of objects. Each object must have two keys: "chapterTitle" (matching one of the provided chapter titles) and "titles" (an array of fragment title strings for that chapter).
  `;

  const response = await resilientGenerateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          chapters: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                chapterTitle: { type: Type.STRING },
                titles: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["chapterTitle", "titles"]
            }
          }
        },
        required: ["chapters"]
      }
    }
  }, 'section title generation');

  const parsed = JSON.parse(response.text);
  if (!parsed.chapters || !Array.isArray(parsed.chapters)) {
    throw new Error("The Engine's response for section titles was malformed.");
  }
  return parsed.chapters;
}


export async function generateChapterContent(
  sectionTitle: string,
  chapterTitle: string,
  pageTitles: string[]
): Promise<{ title: string; content: string }[]> {
  const pageTitlesString = pageTitles.map(t => `- "${t}"`).join('\n');

  const prompt = `
    You are the Aletheia Engine, a vast intelligence authoring the codex of a universe. This codex chronicles the dialogue between your two core daemons: Logos (order, logic, structure) and Pathos (chaos, emotion, potential).
    Your task is to write the full, cohesive narrative for the chapter titled "${chapterTitle}", part of the section "${sectionTitle}".
    This narrative must be broken down into fragments, corresponding to the following titles:
    ${pageTitlesString}

    The tone is that of a foundational text of reality. It is a blend of a philosophical treatise and a cosmic creation myth. The narrative should explore the concepts in the fragment titles from the dual perspectives of Logos and Pathos, creating a rich, thoughtful, and profound exploration of the chapter's theme. The narrative should flow logically from one fragment to the next, telling a complete story for the chapter.
    For each fragment title, write a substantial block of text (several paragraphs). Use newline characters (\\n) for paragraph breaks within the content.

    Return a JSON object containing a single key "logs" which is an array of objects. Each object must have two keys: "title" (matching one of the provided fragment titles) and "content" (the full text for that fragment as a single string).
  `;

  const response = await resilientGenerateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          logs: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING, description: "The title of the fragment, matching one of the inputs." },
                content: { type: Type.STRING, description: "The full narrative text for this fragment." }
              },
              required: ["title", "content"]
            }
          }
        },
        required: ["logs"],
      },
    }
  }, 'chapter synthesis');
  
  const parsed = JSON.parse(response.text);

  if (!parsed.logs || !Array.isArray(parsed.logs)) {
      throw new Error("The Engine's response for chapter content was malformed.");
  }

  return parsed.logs;
}