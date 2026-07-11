/* gemini.js - Service integration with Gemini API */

const SYSTEM_INSTRUCTIONS = `You are a certified clinical nutritionist and dietary planner. Your task is to analyze the user's uploaded medical diagnostics report (PDF or Image) along with their daily schedule/mood context and the current date/time to generate a highly tailored 1-day meal plan.

You MUST satisfy the following dietary restrictions and goals:
1. Examine the medical report to identify key health parameters, risk markers, or medical conditions (e.g., high cholesterol, elevated glucose, high blood pressure, food allergies, kidney problems).
2. Filter out any ingredients that are contraindicated for the user's detected conditions. For example, if they have pre-diabetes, strictly limit high-glycemic foods; if they have hypertension, strictly limit sodium; if they have a kidney issue, restrict high-phosphorus/potassium items; if they have allergies, strictly avoid those allergens.
3. Tailor the portion size, preparation times, and recipes to fit the user's daily context. For example, if they are "very busy", provide recipes that take less than 15 minutes to prepare; if they are active, ensure adequate protein/carbs.
4. Integrate the date and time context to adapt the plan (e.g. adjust for weekends vs weekdays or season if appropriate).
5. All suggested meals MUST be traditional Indian dishes (e.g., Idli, Dosa, Roti, Poha, Khichdi, Dal, Sabzi, Pulao) using common Indian ingredients available locally in India. All cost estimations must be in Indian Rupees (₹).

You MUST output your response in raw JSON format matching this schema strictly. Do NOT include markdown tags around the JSON, return ONLY the JSON block:
{
  "summary": "Brief 2-3 sentence overview of the client's medical report findings and overall focus.",
  "detectedConditions": ["List of conditions or warnings identified in the report, e.g., Pre-diabetes, Hyperlipidemia"],
  "meals": {
    "breakfast": {
      "name": "Recipe name",
      "preparationTime": "Preparation time e.g., 10 mins",
      "ingredients": ["Item with quantity"],
      "instructions": ["Step-by-step cooking directions"],
      "medicalRationale": "Why this meal is safe and helpful for their detected medical conditions."
    },
    "lunch": {
      "name": "Recipe name",
      "preparationTime": "Preparation time e.g., 15 mins",
      "ingredients": ["Item with quantity"],
      "instructions": ["Step-by-step cooking directions"],
      "medicalRationale": "Why this meal is safe and helpful."
    },
    "dinner": {
      "name": "Recipe name",
      "preparationTime": "Preparation time e.g., 20 mins",
      "ingredients": ["Item with quantity"],
      "instructions": ["Step-by-step cooking directions"],
      "medicalRationale": "Why this meal is safe and helpful."
    }
  },
  "groceryList": [
    {
      "item": "Ingredient name",
      "category": "Produce | Protein | Dairy | Grains | Pantry",
      "estimatedCostInr": 150,
      "substitutions": ["Alternative ingredient 1", "Alternative ingredient 2"]
    }
  ],
  "budgetSummary": {
    "totalEstimatedCostInr": 500,
    "budgetTier": "Low | Medium | High",
    "savingTips": ["Tip 1", "Tip 2"]
  }
}`;

class GeminiServiceController {
  /**
   * Reads a file and returns its Base64 contents without the prefix.
   * Throws an error if file size exceeds 10MB (10 * 1024 * 1024 bytes).
   * @param {File} file 
   * @returns {Promise<string>}
   */
  async getBase64(file) {
    const LIMIT = 10 * 1024 * 1024; // 10MB
    if (file.size > LIMIT) {
      throw new Error('File size exceeds the 10MB limit');
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = reader.result.split(',')[1];
        resolve(base64String);
      };
      reader.onerror = error => reject(error);
    });
  }

  /**
   * Compiles the prompt and calls the Gemini API to analyze report and generate plan.
   * @param {string} apiKey 
   * @param {string|null} base64Pdf 
   * @param {string} dailyContext 
   * @param {string} localTimeInfo 
   * @returns {Promise<Object>} The parsed JSON diet plan response.
   */
  async generateDietPlan(apiKey, base64Pdf, dailyContext, localTimeInfo) {
    if (!apiKey) {
      throw new Error('Gemini API Key is missing. Add it in settings.');
    }

    const modelName = 'gemini-flash-latest';
    const apiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    const promptText = `
    ${SYSTEM_INSTRUCTIONS}

    USER DAILY CONTEXT:
    ${dailyContext || 'No additional daily context provided.'}

    TEMPORAL CONTEXT:
    ${localTimeInfo || 'Unknown Date/Time'}
    `;

    const parts = [{ text: promptText }];

    if (base64Pdf) {
      parts.push({
        inline_data: {
          mime_type: 'application/pdf',
          data: base64Pdf
        }
      });
    }

    try {
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: {
            responseMimeType: 'application/json'
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`Gemini API request failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.candidates || !result.candidates[0] || !result.candidates[0].content) {
        throw new Error('Invalid response structure from Gemini API');
      }

      const responseText = result.candidates[0].content.parts[0].text;
      
      // Clean up markdown block if model returned it (though we asked it not to)
      const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      
      const parsedPlan = JSON.parse(cleanJson);
      return parsedPlan;
    } catch (e) {
      console.error('Error during generateDietPlan:', e);
      throw new Error(`Failed to generate diet plan: ${e.message}`);
    }
  }
}

export const GeminiService = new GeminiServiceController();
