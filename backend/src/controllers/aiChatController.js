import AIChatMessage from '../models/AIChatMessage.js';
import User from '../models/User.js';
import AllergyRecord from '../models/AllergyRecord.js';
import MedicalTestRecord from '../models/MedicalTestRecord.js';
import DailyFoodEntry from '../models/DailyFoodEntry.js';
import SymptomRecord from '../models/SymptomRecord.js';
import { processAIChatMessage } from '../services/ai/aiChatService.js';

/**
 * Retrieve chat history for authenticated user
 * GET /api/ai-chat/history
 */
export const getChatHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const { sessionId = 'default_session', limit = 50 } = req.query;

    const messages = await AIChatMessage.find({ userId, sessionId })
      .sort({ createdAt: 1 })
      .limit(parseInt(limit, 10));

    return res.status(200).json({
      success: true,
      count: messages.length,
      data: messages,
    });
  } catch (error) {
    console.error('[Get Chat History Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve chat history.',
    });
  }
};

/**
 * Send message to AI Health Assistant
 * POST /api/ai-chat/message
 */
export const sendMessage = async (req, res) => {
  try {
    const userId = req.user._id;
    const { message, sessionId = 'default_session' } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message text is required.',
      });
    }

    // 1. Fetch user medical context
    const [userDoc, allergies, tests, recentFoods, recentSymptoms, historyDocs] = await Promise.all([
      User.findById(userId).select('name age dob email sex'),
      AllergyRecord.find({ userId }),
      MedicalTestRecord.find({ userId }).sort({ testDate: -1 }),
      DailyFoodEntry.find({ userId }).sort({ consumptionDate: -1 }).limit(10),
      SymptomRecord.find({ userId }).sort({ symptomDate: -1 }).limit(10),
      AIChatMessage.find({ userId, sessionId }).sort({ createdAt: -1 }).limit(10),
    ]);

    const confirmedAllergies = allergies.filter((a) => a.diagnosisType === 'Doctor-Confirmed Diagnosis');
    const suspectedAllergies = allergies.filter((a) => a.diagnosisType !== 'Doctor-Confirmed Diagnosis');

    // 2. Format history chronologically for AI
    const chronologicalHistory = historyDocs.reverse().map((h) => ({
      role: h.role,
      content: h.content,
    }));

    // 3. Process message
    const result = await processAIChatMessage({
      userId,
      userMessage: message.trim(),
      chatHistory: chronologicalHistory,
      user: {
        name: userDoc?.name || req.user.name,
        age: userDoc?.age ?? req.user.age,
        dob: userDoc?.dob,
      },
      confirmedAllergies,
      suspectedAllergies,
      medicalTests: tests,
      recentFoods,
      recentSymptoms,
    });

    // 4. Save both user message and assistant reply in DB
    const userMsgDoc = new AIChatMessage({
      userId,
      sessionId,
      role: 'user',
      content: message.trim(),
    });
    await userMsgDoc.save();

    const assistantMsgDoc = new AIChatMessage({
      userId,
      sessionId,
      role: 'assistant',
      content: result.reply,
      emergencyAlert: result.isEmergency,
    });
    await assistantMsgDoc.save();

    return res.status(200).json({
      success: true,
      data: {
        reply: result.reply,
        isEmergency: result.isEmergency,
        emergencyAlert: {
          isEmergency: result.isEmergency,
          details: result.emergencyDetails,
        },
        emergencyDetails: result.emergencyDetails || null,
        messageId: assistantMsgDoc._id,
        timestamp: assistantMsgDoc.createdAt,
      },
    });
  } catch (error) {
    console.error('[Send Chat Message Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to process AI chat message.',
    });
  }
};

/**
 * Clear chat history
 * DELETE /api/ai-chat/history
 */
export const clearChatHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const { sessionId = 'default_session' } = req.query;

    await AIChatMessage.deleteMany({ userId, sessionId });

    return res.status(200).json({
      success: true,
      message: 'Chat history cleared successfully.',
    });
  } catch (error) {
    console.error('[Clear Chat History Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to clear chat history.',
    });
  }
};
