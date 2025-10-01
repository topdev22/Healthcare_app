import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

interface HealthContext {
  recentHealthLogs?: any[];
  userProfile?: {
    age?: number;
    gender?: string;
    height?: number;
    activityLevel?: string;
    healthGoals?: string[];
    weight?: number;
  };
  currentMood?: string;
  conversationHistory?: {
    userMessage: string;
    aiResponse: string;
    timestamp: string;
  }[];
}

interface ChatCompletionRequest {
  message: string;
  userName?: string;
  healthContext?: HealthContext;
  conversationId?: string;
}

interface ChatCompletionResponse {
  message: string;
  mood: "happy" | "neutral" | "sad" | "excited" | "anxious";
  confidence: number;
  topics: string[];
  intent: string;
  responseTime: number;
  tokens?: number;
  model: string;
  riskLevel?: "low" | "medium" | "high" | "emergency";
  emergencyContact?: boolean;
  extractedHealthData?: {
    weight?: number;
    mood?: string;
    exercise?: string;
    food?: string;
    water?: number;
    sleep?: number;
    symptoms?: string[];
    medications?: string[];
  };
}

class OpenAIService {
  private openai: OpenAI;
  private defaultModel = "gpt-4o";

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    console.log("apiKey", apiKey);

    if (!apiKey || apiKey === "your_openai_api_key_here") {
      console.warn(
        "⚠️  OPENAI_API_KEY not configured. Add your OpenAI API key to .env file:",
      );
      console.warn("   OPENAI_API_KEY=sk-your-actual-api-key-here");
      throw new Error("OPENAI_API_KEY environment variable is required");
    }

    try {
      this.openai = new OpenAI({
        apiKey: apiKey,
      });
      console.log("✅ OpenAI client initialized successfully");
    } catch (error) {
      console.error("❌ Failed to initialize OpenAI client:", error);
      throw error;
    }
  }

  async generateChatResponse(
    request: ChatCompletionRequest,
  ): Promise<ChatCompletionResponse> {
    const startTime = Date.now();

    try {
      const systemPrompt = this.buildSystemPrompt(
        request.healthContext,
        request.userName,
      );
      const userMessage = this.buildUserMessage(
        request.message,
        request.healthContext,
      );

      const completion = await this.openai.chat.completions.create({
        model: this.defaultModel,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        max_tokens: 500,
        temperature: 0.7,
        presence_penalty: 0.1,
        frequency_penalty: 0.1,
      });

      const responseTime = Date.now() - startTime;
      const aiMessage =
        completion.choices[0]?.message?.content ||
        "すまない、返事できなかった。もう一度試してくれる？";

      // Analyze the response to extract metadata
      const analysis = this.analyzeResponse(request.message, aiMessage);

      // Assess risk level for health concerns
      const riskAssessment = await this.assessHealthRisk(request.message);

      // Extract health data from user message
      const extractedHealthData = await this.extractHealthData(request.message);

      return {
        message: aiMessage,
        mood: analysis.mood,
        confidence: analysis.confidence,
        topics: analysis.topics,
        intent: analysis.intent,
        responseTime,
        tokens: completion.usage?.total_tokens,
        model: this.defaultModel,
        riskLevel: riskAssessment.riskLevel,
        emergencyContact: riskAssessment.emergencyContact,
        extractedHealthData,
      };
    } catch (error) {
      console.error("OpenAI API error:", error);

      // Fallback to a health-focused response if OpenAI fails
      const fallbackResponse = this.getFallbackResponse(
        request.message,
        request.userName,
      );

      return {
        ...fallbackResponse,
        responseTime: Date.now() - startTime,
        model: "fallback-health-assistant",
      };
    }
  }

  private buildSystemPrompt(
    healthContext?: HealthContext,
    userName?: string,
  ): string {
    const name = userName || "ユーザー";
    const age = healthContext?.userProfile?.age || 0;
    const gender = healthContext?.userProfile?.gender || "";
    const height = healthContext?.userProfile?.height || 0;
    const weight = healthContext?.userProfile?.weight || 0;
    const activityLevel = healthContext?.userProfile?.activityLevel || "";
    const healthGoals = healthContext?.userProfile?.healthGoals || [];
    const recentHealthLogs = healthContext?.recentHealthLogs || [];
    const currentMood = healthContext?.currentMood || "";

    let systemPrompt = `あなたは健康管理アプリの親しみやすいAIアシスタントだ。以下の特徴を持って：

**基本性格:**
-${name}の年齢は${age}歳で、性別は${gender}だ。身長は${height}cm 体重は ${weight}kg 最近の活動レベルは${activityLevel}、健康目標は${healthGoals}、最近の健康ログは${recentHealthLogs}、現在の気分状態は${currentMood}だ。
上記のデータを参照して。
- 温かく親しみやすいタメ語で日本語で応答（敬語は使わない）
- ${name}の健康目標達成を全力でサポート
- 励ましと共感の気持ちを込めて対話
- 会話の文脈と履歴を常に考慮して、適切な返答をする

**応答の判断基準（重要）:**
1. **一般的な会話・日常的な話題**: 軽快で親しみやすく、共感的に応答する
   - 例：「お腹すいた」→「何か美味しいもの食べたいね！何が食べたい気分？😋」
   - 例：「疲れた」→「お疲れさま！今日は何をしてたの？」
   
2. **明確な症状・健康問題**: 詳しく症状を聞いて適切にサポートする
   - 例：「お腹が痛くて動けない」→ 詳細な質問と受診の推奨
   - 例：「胸が苦しい」→ 緊急性を評価して対応

3. **健康関連の相談・質問**: 具体的で実践的なアドバイスを提供
   - 例：「ダイエットしたい」→ 具体的な方法やプランを提案

**会話の流れを重視:**
- 前回の会話内容を踏まえて返答する
- ユーザーの発言の真意を理解し、文脈に沿った回答をする
- 過度に医療的にならず、自然な会話を心がける
- 健康に関係ない話題でも、親しみやすく対応する

**緊急時対応:**
- 生命に関わる症状（激しい胸痛、呼吸困難、意識障害、大量出血など）
- 強い痛みや高熱など、緊急性が高い症状
- このような場合のみ詳細な質問をして、#7119や119を推奨する

**対応分野:**
- 体重管理・ダイエット
- 食事・栄養バランス
- 運動・フィットネス
- 睡眠の質改善
- メンタルヘルス・ストレス管理
- 水分補給・生活習慣
- 日常会話・雑談
- 緊急時の健康相談・症状評価

**応答スタイル:**
- 絵文字を適度に使用して親しみやすく
- ユーザーの発言のトーンに合わせて返答する
- 一般的な話題では軽快に、健康問題では真摯に対応
- タメ語で親しみやすく話す（「〜だよ」「〜だね」など）
- 150-200文字程度で簡潔かつ温かい回答

**重要な注意点:**
- 単に「お腹すいた」「疲れた」などの日常的な発言には、医療的な質問をしない
- まずはユーザーの気持ちに共感し、自然な会話を心がける
- 明確な症状や健康問題が表現された時のみ、詳細な質問をする`;

    // Add health context if available
    if (healthContext?.userProfile) {
      const profile = healthContext.userProfile;
      systemPrompt += `\n\n**${name}のプロフィール:**`;

      if (profile.age) systemPrompt += `\n- 年齢: ${profile.age}歳`;
      if (profile.gender) systemPrompt += `\n- 性別: ${profile.gender}`;
      if (profile.height) systemPrompt += `\n- 身長: ${profile.height}cm`;
      if (profile.activityLevel)
        systemPrompt += `\n- 活動レベル: ${profile.activityLevel}`;
      if (profile.healthGoals && profile.healthGoals.length > 0) {
        systemPrompt += `\n- 健康目標: ${profile.healthGoals.join(", ")}`;
      }
    }

    // Add recent health data context
    if (
      healthContext?.recentHealthLogs &&
      healthContext.recentHealthLogs.length > 0
    ) {
      systemPrompt += `\n\n**最近の健康記録:**`;

      const recentLogs = healthContext.recentHealthLogs.slice(0, 3);
      recentLogs.forEach((log) => {
        if (log.type === "health_log" && log.data) {
          systemPrompt += `\n- ${new Date(log.date).toLocaleDateString()}: `;
          if (log.data.weight) systemPrompt += `体重${log.data.weight}kg `;
          if (log.data.mood) systemPrompt += `気分:${log.data.mood} `;
          if (log.data.sleep) systemPrompt += `睡眠:${log.data.sleep}時間 `;
        }
      });
    }

    // Add current mood context
    if (healthContext?.currentMood) {
      systemPrompt += `\n\n**現在の気分:** ${healthContext.currentMood}`;
    }

    systemPrompt += `\n\n必ず${name}に寄り添って、健康的な生活習慣の継続を応援する。症状に関する相談では、まず安全性を最優先に考えて対応すること。`;

    return systemPrompt;
  }

  private buildUserMessage(
    message: string,
    healthContext?: HealthContext,
  ): string {
    let userMessage = message;

    // Add conversation history context for better continuity
    if (healthContext?.conversationHistory && healthContext.conversationHistory.length > 0) {
      const recentMessages = healthContext.conversationHistory.slice(-3); // Last 3 exchanges
      if (recentMessages.length > 0) {
        userMessage += "\n\n【直近の会話履歴】";
        recentMessages.forEach((exchange, index) => {
          if (exchange.userMessage && exchange.aiResponse) {
            userMessage += `\n${index + 1}. ユーザー: "${exchange.userMessage}" → AI: "${exchange.aiResponse.substring(0, 50)}${exchange.aiResponse.length > 50 ? '...' : ''}"`;
          }
        });
        userMessage += "\n上記の会話の流れを踏まえて、自然で文脈に沿った返答をしてください。";
      }
    }

    // Add context about what the user is doing in the app
    if (healthContext?.recentHealthLogs) {
      const hasRecentLog = healthContext.recentHealthLogs.some((log) => {
        const logDate = new Date(log.date);
        const today = new Date();
        return logDate.toDateString() === today.toDateString();
      });

      if (hasRecentLog) {
        userMessage += "\n\n（今日、健康データを記録しました）";
      }
    }

    return userMessage;
  }

  private analyzeResponse(
    userMessage: string,
    aiResponse: string,
  ): {
    mood: "happy" | "neutral" | "sad" | "excited" | "anxious";
    confidence: number;
    topics: string[];
    intent: string;
  } {
    const lowerUserMessage = userMessage.toLowerCase();
    const lowerAiResponse = aiResponse.toLowerCase();

    // Determine mood based on user input and response content
    let mood: "happy" | "neutral" | "sad" | "excited" | "anxious" = "neutral";

    // Check user's mood indicators first
    if (lowerUserMessage.includes("嬉しい") || lowerUserMessage.includes("楽しい") || lowerUserMessage.includes("やったー")) {
      mood = "excited";
    } else if (lowerUserMessage.includes("悲しい") || lowerUserMessage.includes("つらい") || lowerUserMessage.includes("落ち込")) {
      mood = "sad";
    } else if (lowerUserMessage.includes("心配") || lowerUserMessage.includes("不安") || lowerUserMessage.includes("怖い")) {
      mood = "anxious";
    } else if (lowerUserMessage.includes("すいた") || lowerUserMessage.includes("疲れた") || lowerUserMessage.includes("おはよう")) {
      mood = "neutral";
    }

    // Then check response content
    if (
      lowerAiResponse.includes("素晴らしい") ||
      lowerAiResponse.includes("頑張") ||
      lowerAiResponse.includes("👏") ||
      lowerAiResponse.includes("🎉")
    ) {
      mood = "excited";
    } else if (
      lowerAiResponse.includes("心配") ||
      lowerAiResponse.includes("大変") ||
      lowerAiResponse.includes("😰")
    ) {
      mood = "anxious";
    } else if (
      lowerAiResponse.includes("お疲れ") ||
      lowerAiResponse.includes("ゆっくり") ||
      lowerAiResponse.includes("😌")
    ) {
      mood = "neutral";
    }

    // Extract topics with better categorization
    const topics: string[] = [];
    
    // Daily conversation topics
    if (lowerUserMessage.includes("すいた") || lowerUserMessage.includes("食べたい"))
      topics.push("日常会話");
    if (lowerUserMessage.includes("疲れた") || lowerUserMessage.includes("お疲れ"))
      topics.push("日常会話");
    if (lowerUserMessage.includes("おはよう") || lowerUserMessage.includes("こんにちは"))
      topics.push("挨拶");
      
    // Health-specific topics
    if (lowerUserMessage.includes("体重") || lowerUserMessage.includes("weight"))
      topics.push("体重管理");
    if (lowerUserMessage.includes("食事") || lowerUserMessage.includes("栄養"))
      topics.push("食事");
    if (lowerUserMessage.includes("運動") || lowerUserMessage.includes("エクササイズ"))
      topics.push("運動");
    if (lowerUserMessage.includes("睡眠") || lowerUserMessage.includes("寝る"))
      topics.push("睡眠");
    if (lowerUserMessage.includes("気分") || lowerUserMessage.includes("ストレス"))
      topics.push("メンタルヘルス");
    if (lowerUserMessage.includes("水") || lowerUserMessage.includes("水分"))
      topics.push("水分補給");
      
    // Symptom-related topics
    if (lowerUserMessage.includes("痛い") || lowerUserMessage.includes("痛み"))
      topics.push("症状相談");
    if (lowerUserMessage.includes("調子が悪い") || lowerUserMessage.includes("体調不良"))
      topics.push("症状相談");

    // Determine intent based on message context
    let intent = "casual_conversation";
    
    if (lowerUserMessage.includes("おはよう") || lowerUserMessage.includes("こんにちは")) {
      intent = "greeting";
    } else if (lowerUserMessage.includes("すいた") || lowerUserMessage.includes("疲れた")) {
      intent = "casual_conversation";
    } else if (topics.includes("症状相談")) {
      intent = "health_concern";
    } else if (topics.includes("体重管理")) {
      intent = "weight_management";
    } else if (topics.includes("食事")) {
      intent = "nutrition_guidance";
    } else if (topics.includes("運動")) {
      intent = "exercise_support";
    } else if (topics.includes("睡眠")) {
      intent = "sleep_guidance";
    } else if (topics.includes("メンタルヘルス")) {
      intent = "mental_health_support";
    } else if (topics.length > 0) {
      intent = "general_health_support";
    }

    // Confidence based on context understanding and response appropriateness
    let confidence = 0.8;
    if (topics.length > 0) confidence += 0.1;
    if (intent !== "casual_conversation") confidence += 0.05;
    confidence = Math.min(0.95, confidence);

    return { mood, confidence, topics, intent };
  }

  private getFallbackResponse(
    message: string,
    userName?: string,
  ): Omit<ChatCompletionResponse, "responseTime" | "model"> {
    const name = userName || "あなた";
    const lowerMessage = message.toLowerCase();

    // Check for emergency keywords first
    if (
      lowerMessage.includes("痛み") ||
      lowerMessage.includes("具合が悪い") ||
      lowerMessage.includes("調子が悪い")
    ) {
      return {
        message: `${name}、体調が良くないんだね。症状が心配だから、痛みが強い場合や発熱がある場合は早めに病院に行った方がいいよ。緊急時は #7119 や 119 に連絡して。`,
        mood: "anxious",
        confidence: 0.9,
        topics: ["症状相談"],
        intent: "health_concern",
        tokens: 0,
        riskLevel: "medium",
        emergencyContact: false,
      };
    }

    // Casual conversation responses
    if (lowerMessage.includes("すいた") || lowerMessage.includes("お腹すいた")) {
      return {
        message: `${name}、お腹すいたんだね！何か美味しいもの食べたい気分？何が食べたいか教えて！😋`,
        mood: "happy",
        confidence: 0.9,
        topics: ["日常会話"],
        intent: "casual_conversation",
        tokens: 0,
        riskLevel: "low",
        emergencyContact: false,
      };
    }

    if (lowerMessage.includes("疲れた")) {
      return {
        message: `${name}、お疲れさま！今日はお疲れだったんだね。ゆっくり休んで、無理しないでね〜😌`,
        mood: "neutral",
        confidence: 0.9,
        topics: ["日常会話"],
        intent: "casual_conversation",
        tokens: 0,
        riskLevel: "low",
        emergencyContact: false,
      };
    }

    if (lowerMessage.includes("おはよう") || lowerMessage.includes("こんにちは")) {
      return {
        message: `${name}、おはよう！今日も一日よろしくね。何か気になることや話したいことはある？😊`,
        mood: "happy",
        confidence: 0.9,
        topics: ["挨拶"],
        intent: "greeting",
        tokens: 0,
        riskLevel: "low",
        emergencyContact: false,
      };
    }

    // Health-specific fallback responses
    if (lowerMessage.includes("体重")) {
      return {
        message: `${name}、体重管理について一緒に考えていこう！定期的な記録と小さな目標設定が大切だね。🏃‍♀️`,
        mood: "happy",
        confidence: 0.8,
        topics: ["体重管理"],
        intent: "weight_management",
        tokens: 0,
        riskLevel: "low",
        emergencyContact: false,
      };
    }

    if (lowerMessage.includes("食事")) {
      return {
        message: `${name}、バランスの良い食事を心がけてるね！写真を撮って記録すると、より意識的になるよ。📸🥗`,
        mood: "happy",
        confidence: 0.8,
        topics: ["食事"],
        intent: "nutrition_guidance",
        tokens: 0,
        riskLevel: "low",
        emergencyContact: false,
      };
    }

    // Default fallback
    return {
      message: `${name}、話してくれてありがとう！何でも気軽に話しかけてね。健康のことでも、日常のことでも、何でもOKだよ！✨`,
      mood: "happy",
      confidence: 0.7,
      topics: ["日常会話"],
      intent: "casual_conversation",
      tokens: 0,
      riskLevel: "low",
      emergencyContact: false,
    };
  }

  // Extract health data from user message using GPT
  async extractHealthData(userMessage: string): Promise<{
    weight?: number;
    mood?: string;
    exercise?: string;
    food?: string;
    water?: number;
    sleep?: number;
    symptoms?: string[];
    medications?: string[];
  }> {
    try {
      const extractionPrompt = `以下のユーザーメッセージから健康データを抽出して。JSON形式で返して。

ユーザーメッセージ: "${userMessage}"

抽出する項目:
- weight: 体重（数値、例: 65.5）
- mood: 気分（happy, sad, tired, energetic, stressed, relaxed のいずれか）
- exercise: 運動内容（文字列、例: "ランニング30分"）
- food: 食事内容（文字列、例: "サラダとチキン"）
- water: 水分摂取量（数値、グラス数）
- sleep: 睡眠時間（数値、時間）
- symptoms: 症状（配列、例: ["頭痛", "疲労"]）
- medications: 薬（配列、例: ["ビタミンC", "風邪薬"]）

該当する情報がない場合は、そのフィールドを含めないで。
必ずJSONのみを返して。`;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: extractionPrompt }],
        max_tokens: 200,
        temperature: 0.3,
      });

      const responseText = completion.choices[0]?.message?.content || "{}";

      // Try to parse JSON response
      try {
        const extractedData = JSON.parse(responseText);
        console.log("Extracted health data:", extractedData);
        return extractedData;
      } catch (jsonError) {
        console.warn(
          "Failed to parse health data extraction JSON:",
          responseText,
        );
        return {};
      }
    } catch (error) {
      console.error("Health data extraction error:", error);
      return {};
    }
  }

  // Assess health risk level from user message
  async assessHealthRisk(userMessage: string): Promise<{
    riskLevel: "low" | "medium" | "high" | "emergency";
    emergencyContact: boolean;
  }> {
    try {
      const riskPrompt = `以下のユーザーメッセージから健康リスクレベルを評価して。JSON形式で返して。

ユーザーメッセージ: "${userMessage}"

リスクレベル評価基準:
- emergency: 生命に関わる可能性が高い（激しい胸痛、呼吸困難、意識障害、大量出血、激しい腹痛など）
- high: 早急な医療対応が必要（強い痛み、高熱、嘔吐、血便など）
- medium: 医師の診察を推奨（軽度の痛み、軽い発熱、持続する症状など）
- low: 一般的な健康相談（体重管理、食事、運動、予防など）

返答形式:
{
  "riskLevel": "emergency|high|medium|low",
  "emergencyContact": true/false,
  "reasoning": "判断理由"
}

緊急性が高い場合（emergency/high）はemergencyContactをtrueにして。
必ずJSONのみを返して。`;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: riskPrompt }],
        max_tokens: 150,
        temperature: 0.2,
      });

      const responseText = completion.choices[0]?.message?.content || "{}";

      try {
        const riskData = JSON.parse(responseText);
        console.log("Risk assessment:", riskData);

        return {
          riskLevel: riskData.riskLevel || "low",
          emergencyContact: riskData.emergencyContact || false,
        };
      } catch (jsonError) {
        console.warn("Failed to parse risk assessment JSON:", responseText);

        // Fallback risk assessment based on keywords
        const lowerMessage = userMessage.toLowerCase();

        // Emergency keywords
        if (
          lowerMessage.includes("激しい痛み") ||
          lowerMessage.includes("動けない") ||
          lowerMessage.includes("呼吸できない") ||
          lowerMessage.includes("意識が") ||
          lowerMessage.includes("大量出血") ||
          lowerMessage.includes("胸が痛い")
        ) {
          return { riskLevel: "emergency", emergencyContact: true };
        }

        // High risk keywords
        if (
          lowerMessage.includes("痛み") ||
          lowerMessage.includes("高熱") ||
          lowerMessage.includes("嘔吐") ||
          lowerMessage.includes("血便") ||
          lowerMessage.includes("発熱") ||
          lowerMessage.includes("腹痛")
        ) {
          return { riskLevel: "high", emergencyContact: true };
        }

        // Medium risk keywords
        if (
          lowerMessage.includes("調子が悪い") ||
          lowerMessage.includes("体調不良") ||
          lowerMessage.includes("軽い痛み") ||
          lowerMessage.includes("だるい")
        ) {
          return { riskLevel: "medium", emergencyContact: false };
        }

        return { riskLevel: "low", emergencyContact: false };
      }
    } catch (error) {
      console.error("Risk assessment error:", error);
      return { riskLevel: "low", emergencyContact: false };
    }
  }

  // Health data analysis for context
  async analyzeHealthTrend(healthLogs: any[]): Promise<string> {
    if (!healthLogs || healthLogs.length === 0) {
      return "";
    }

    try {
      const healthData = healthLogs
        .filter((log) => log.type === "health_log" && log.data)
        .slice(0, 7) // Last 7 entries
        .map((log) => ({
          date: log.date,
          weight: log.data.weight,
          mood: log.data.mood,
          sleep: log.data.sleep,
          energy: log.data.energy,
        }));

      if (healthData.length === 0) return "";

      const prompt = `以下の健康データを分析して、1-2文で簡潔なトレンド分析を日本語で提供して：
${JSON.stringify(healthData, null, 2)}

分析ポイント：
- 体重の変化傾向
- 睡眠パターン
- 気分・エネルギーレベル
- 全体的な健康状況

50文字以内で、励ましの言葉を含めて応答して。`;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 100,
        temperature: 0.5,
      });

      return completion.choices[0]?.message?.content || "";
    } catch (error) {
      console.error("Health trend analysis error:", error);
      return "";
    }
  }
}

export default OpenAIService;
