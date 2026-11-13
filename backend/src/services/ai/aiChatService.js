/**
 * AI Health Assistant Service
 * Provides personalized conversational responses grounded in the authenticated patient's records
 * and approved medical knowledge base (AAAAI / EAACI / NIAID).
 */

import { checkEmergencySafety } from './medicalSafetyEngine.js';
import { evaluateFoodSafety } from './dietMonitoringService.js';

export async function processAIChatMessage({
  _userId,
  userMessage,
  chatHistory = [],
  user = {},
  confirmedAllergies = [],
  suspectedAllergies = [],
  medicalTests = [],
  recentFoods = [],
  recentSymptoms = [],
}) {
  const cleanMessage = (userMessage || '').trim();

  // 1. Real-time Emergency Pre-Check
  const emergencyCheck = checkEmergencySafety([cleanMessage], 'Moderate', cleanMessage);
  if (emergencyCheck.isEmergency) {
    return {
      reply:
        '⚠️ **EMERGENCY MEDICAL ALERT**:\n\n' +
        'Your message mentions symptoms that may indicate a severe allergic reaction or anaphylaxis.\n\n' +
        '• **Call emergency services (911 / 112) immediately.**\n' +
        '• If you have a prescribed epinephrine auto-injector (EpiPen / Auvi-Q), use it now as directed by your physician.\n' +
        '• Sit down or lie down; do not attempt to walk or wait for an online response.\n\n' +
        'Please seek professional medical assistance immediately.',
      isEmergency: true,
      emergencyDetails: emergencyCheck,
    };
  }

  // 2. Build Patient Profile Context Snapshot
  const confirmedList = confirmedAllergies.map((a) => `${a.allergenName} (${a.severity})`).join(', ') || 'None';
  const suspectedList = suspectedAllergies.map((a) => a.allergenName).join(', ') || 'None';
  const testsList =
    medicalTests
      .map((t) => `${t.allergenName} [${t.testType}: ${t.testResult} ${t.units || ''}]`)
      .join('; ') || 'None';
  const recentFoodsList =
    recentFoods
      .slice(0, 5)
      .map((f) => `${f.foodName} (${f.mealType})`)
      .join(', ') || 'No meals logged recently';
  const recentSymptomsList =
    recentSymptoms
      .slice(0, 5)
      .map((s) => `${s.symptomName} (${s.symptomSeverity})`)
      .join(', ') || 'No symptoms reported recently';

  // 3. Provider selection
  const provider = (process.env.AI_PROVIDER || 'gemini').toLowerCase().trim();
  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (provider === 'gemini' && geminiKey) {
    try {
      const reply = await callGeminiChat(cleanMessage, chatHistory, {
        userName: user.name,
        userAge: user.age,
        confirmedList,
        suspectedList,
        testsList,
        recentFoodsList,
        recentSymptomsList,
      }, geminiKey);
      if (reply) return { reply, isEmergency: false };
    } catch (err) {
      console.warn('[AI Chat] Gemini call failed, falling back to clinical engine:', err.message);
    }
  } else if (provider === 'openai' && openaiKey) {
    try {
      const reply = await callOpenAIChat(cleanMessage, chatHistory, {
        userName: user.name,
        userAge: user.age,
        confirmedList,
        suspectedList,
        testsList,
        recentFoodsList,
        recentSymptomsList,
      }, openaiKey);
      if (reply) return { reply, isEmergency: false };
    } catch (err) {
      console.warn('[AI Chat] OpenAI call failed, falling back to clinical engine:', err.message);
    }
  }

  // 4. Clinical Knowledge Rule-Based Assistant (Deterministic Fallback)
  const reply = generateClinicalAssistantReply(cleanMessage, {
    user,
    confirmedAllergies,
    suspectedAllergies,
    medicalTests,
    recentFoods,
    recentSymptoms,
  });

  return { reply, isEmergency: false };
}

/**
 * Deterministic Clinical Assistant Engine
 */
function generateClinicalAssistantReply(query, context) {
  const lower = query.toLowerCase();

  // Pattern A: "I ate [food] today. What should I know?" or "Is this food associated with any allergy in my profile?"
  if (lower.includes('ate') || lower.includes('eat') || lower.includes('food') || lower.includes('dosa') || lower.includes('wheat') || lower.includes('dairy') || lower.includes('nut')) {
    const safetyEval = evaluateFoodSafety({
      foodName: query,
      ingredients: [],
      confirmedAllergies: context.confirmedAllergies,
      suspectedAllergies: context.suspectedAllergies,
      medicalTests: context.medicalTests,
      previousReactions: context.recentSymptoms,
    });

    if (safetyEval.hasAlerts) {
      const topAlert = safetyEval.alerts[0];
      return (
        `**Dietary Observation for your query:**\n\n` +
        `• **Profile Match:** ${topAlert.message}\n` +
        `• **Medical Guidance:** ${topAlert.actionRecommended}\n\n` +
        `*Clinical Note:* While an ingredient may match a record in your profile, other factors like cross-contact, cooking preparation, or non-allergic intolerances may also play a role. If you experience any symptoms, record them promptly in your Symptom Journal.`
      );
    }

    return (
      `Based on your recorded medical profile, I did not find any direct doctor-confirmed allergies matching the food in your query.\n\n` +
      `**Key Recommendations:**\n` +
      `1. Record the full meal and known ingredients in your **Daily Food Diary**.\n` +
      `2. Note any symptoms if they arise, particularly within 15 minutes to 2 hours of eating.\n` +
      `3. Always check for potential cross-contact in commercial preparation.\n\n` +
      `*Disclaimer: Absence of a profile match does not guarantee a food is free from potential allergens.*`
    );
  }

  // Pattern B: "I experienced itching after lunch. What information should I record?" or symptoms
  if (lower.includes('itching') || lower.includes('symptom') || lower.includes('hives') || lower.includes('rash') || lower.includes('stomach') || lower.includes('record')) {
    return (
      `**Guidance on Recording Post-Meal Symptoms:**\n\n` +
      `To help your allergist evaluate this event accurately, please record the following in your **Symptom Journal**:\n` +
      `1. **Specific Symptom**: Exactly what occurred (e.g., localized itching, hives, lip swelling, abdominal cramps).\n` +
      `2. **Onset Timing**: How many minutes after the first bite did symptoms start (immediate <15m, 30m, 1-2h)?\n` +
      `3. **Foods & Ingredients**: All items eaten during that meal, including sauces, seasonings, and cooking oils.\n` +
      `4. **Treatments Taken**: Note if you took an antihistamine, used an inhaler, or needed medical attention.\n` +
      `5. **Photographic Evidence**: Take clear photos of any skin rash or swelling to show your physician.\n\n` +
      `⚠️ *If at any point you develop difficulty breathing, throat tightness, or dizziness, seek emergency medical care immediately.*`
    );
  }

  // Pattern C: "What symptoms have I reported previously?" or "Show my food reaction history"
  if (lower.includes('history') || lower.includes('previously') || lower.includes('past reactions')) {
    if (!context.recentSymptoms || context.recentSymptoms.length === 0) {
      return (
        `You currently have no recorded symptoms in your Symptom & Reaction Journal.\n\n` +
        `Whenever you notice unexpected reactions after eating, log them in your journal so the system can analyze correlations over time.`
      );
    }

    const items = context.recentSymptoms
      .slice(0, 5)
      .map(
        (s) =>
          `• **${s.symptomName}** (${s.symptomSeverity}) - Recorded on ${new Date(s.symptomDate).toLocaleDateString()} (Associated food: ${s.foodConsumed || 'Unspecified'})`
      )
      .join('\n');

    return (
      `**Recent Symptom & Reaction Summary:**\n\n` +
      `${items}\n\n` +
      `You can review your complete analytical trends and repeated food-symptom pairs in the **Food & Symptom History** tab.`
    );
  }

  // Pattern D: "Does my recent food diary contain any concerning ingredients?"
  if (lower.includes('concerning') || lower.includes('diary') || lower.includes('recent')) {
    const confirmedNames = context.confirmedAllergies.map((a) => a.allergenName.toLowerCase());
    const matchedRecent = (context.recentFoods || []).filter((f) => {
      const foodText = (f.foodName + ' ' + (f.ingredients || []).join(' ')).toLowerCase();
      return confirmedNames.some((c) => foodText.includes(c));
    });

    if (matchedRecent.length > 0) {
      const list = matchedRecent.map((f) => `• **${f.foodName}** (${f.mealType})`).join('\n');
      return (
        `⚠️ **Dietary Review Alert:**\n\n` +
        `The following recent food entries contain ingredients that match doctor-confirmed allergies in your profile:\n\n` +
        `${list}\n\n` +
        `Please review these items carefully and follow your physician's avoidance recommendations.`
      );
    }

    return (
      `Your recent food diary entries do not contain any ingredients that directly match the doctor-confirmed allergies in your profile.\n\n` +
      `Continue logging your meals and ingredients in your **Daily Food Diary** for ongoing safety monitoring.`
    );
  }

  // Default helpful medical assistant response
  return (
    `Hello! I am your AI Food Allergy & Diet Monitoring Assistant.\n\n` +
    `I can help you:\n` +
    `• Check if a food or dish relates to your documented allergies.\n` +
    `• Guide you on what details to log when unexpected symptoms occur.\n` +
    `• Review your food diary and symptom history for recurring patterns.\n` +
    `• Explain medical diagnostic concepts (like the difference between sensitization and clinical allergy).\n\n` +
    `*How can I assist you with your diet and allergy records today?*`
  );
}

async function callGeminiChat(message, history, context, apiKey) {
  const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

  const systemInstruction = `
You are an expert Clinical Allergy Decision Support Assistant.
You assist patient ${context.userName || 'User'} (Age: ${context.userAge || 'Unknown'}).
Patient Confirmed Allergies: ${context.confirmedList}
Patient Suspected Allergies: ${context.suspectedList}
Patient Lab Tests (sIgE/SPT): ${context.testsList}
Recent Foods Logged: ${context.recentFoodsList}
Recent Symptoms Logged: ${context.recentSymptomsList}

RULES:
1. Always be supportive, clear, and medically cautious.
2. SENSITIZATION != CLINICAL ALLERGY: A positive lab test alone does not prove clinical allergy without clinical reactivity.
3. CAUSALITY CAVEAT: Never state a food definitely caused a reaction based solely on coincidence. Mention potential confounding ingredients, cross-contact, and other factors.
4. WHEAT: Wheat allergy is distinct from Celiac disease and gluten intolerance.
5. EMERGENCY: If any severe respiratory or systemic symptoms are described, tell them to call emergency services immediately.
6. Do not prescribe, do not alter medications, do not advise home food challenges.
`;

  const contents = [
    { parts: [{ text: systemInstruction }] },
    ...history.slice(-6).map((h) => ({
      role: h.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: h.content }],
    })),
    { role: 'user', parts: [{ text: message }] },
  ];

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents }),
  });

  if (!response.ok) throw new Error(`Gemini status ${response.status}`);
  const data = await response.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text;
}

async function callOpenAIChat(message, history, context, apiKey) {
  const modelName = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const url = 'https://api.openai.com/v1/chat/completions';

  const systemInstruction = `
You are an expert Clinical Allergy Decision Support Assistant.
You assist patient ${context.userName || 'User'} (Age: ${context.userAge || 'Unknown'}).
Patient Confirmed Allergies: ${context.confirmedList}
Patient Suspected Allergies: ${context.suspectedList}
Patient Lab Tests (sIgE/SPT): ${context.testsList}
Recent Foods Logged: ${context.recentFoodsList}
Recent Symptoms Logged: ${context.recentSymptomsList}

RULES:
1. SENSITIZATION != CLINICAL ALLERGY.
2. CAUSALITY CAVEAT: Never state a food definitely caused a reaction without considering other ingredients and cross-contact.
3. Do not confuse wheat allergy with celiac disease.
4. Do not prescribe or advise home challenges.
`;

  const messages = [
    { role: 'system', content: systemInstruction },
    ...history.slice(-6).map((h) => ({
      role: h.role,
      content: h.content,
    })),
    { role: 'user', content: message },
  ];

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: modelName,
      messages,
      temperature: 0.2,
    }),
  });

  if (!response.ok) throw new Error(`OpenAI status ${response.status}`);
  const data = await response.json();
  return data?.choices?.[0]?.message?.content;
}
