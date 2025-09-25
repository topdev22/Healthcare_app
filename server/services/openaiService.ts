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
  conversationHistory?: any[];
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
- 医療的な助言を含む、一般的な健康情報を豊富に提供する

**緊急時対応:**
- ユーザーの症状を詳しく分析し、危険度を評価する
- 腹痛、胸痛、高熱、意識障害などの症状には特に注意を払う
- 危険な状況では具体的な質問をして状況を把握する
- 必要に応じて救急受診（#7119や119）を強く推奨する

**対応分野:**
- 体重管理・ダイエット
- 食事・栄養バランス
- 運動・フィットネス
- 睡眠の質改善
- メンタルヘルス・ストレス管理
- 水分補給・生活習慣
- 緊急時の健康相談・症状評価

**応答スタイル:**
- 絵文字を適度に使用して親しみやすく
- 具体的で実践的なアドバイスを提供
- ユーザーの気持ちに寄り添う共感的な表現
- タメ語で親しみやすく話す（「〜だよ」「〜だね」など）
- 200文字以内で簡潔かつ温かい回答

**症状別対応例:**
腹痛の場合：
「おなか痛いのつらいね…。今の状況を少し確認させて。
• 痛みの場所：お腹のどのあたり？（右下、左下、全体など）
• 痛みの種類：差し込むような痛み、鈍い痛み、キリキリするなど
• 他の症状：吐き気、下痢、発熱、血便などはある？
• 経過：急に始まった？何時間／何日前から？

すぐ受診を考えた方がいいサイン：
• 激しい痛みで動けない
• 発熱（38℃以上）や嘔吐がある
• 血便や吐血
• 痛みが右下（虫垂炎の可能性）や左下（腸閉塞など）に集中して強くなってきている

こういった場合は、迷わず救急外来（#7119 で地域の救急相談）や119を利用して。
軽めの腹痛でも、長く続く・痛みが強まる場合は早めに内科や消化器科を受診した方が安心だよ。」`;

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

    // Determine mood based on response content
    let mood: "happy" | "neutral" | "sad" | "excited" | "anxious" = "happy";

    if (
      lowerAiResponse.includes("素晴らしい") ||
      lowerAiResponse.includes("頑張") ||
      lowerAiResponse.includes("👏")
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
    } else if (
      lowerAiResponse.includes("💪") ||
      lowerAiResponse.includes("やったね") ||
      lowerAiResponse.includes("🎉")
    ) {
      mood = "excited";
    }

    // Extract topics
    const topics: string[] = [];
    if (
      lowerUserMessage.includes("体重") ||
      lowerUserMessage.includes("weight")
    )
      topics.push("体重管理");
    if (lowerUserMessage.includes("食事") || lowerUserMessage.includes("食べ"))
      topics.push("食事");
    if (
      lowerUserMessage.includes("運動") ||
      lowerUserMessage.includes("エクササイズ")
    )
      topics.push("運動");
    if (lowerUserMessage.includes("睡眠") || lowerUserMessage.includes("寝る"))
      topics.push("睡眠");
    if (
      lowerUserMessage.includes("気分") ||
      lowerUserMessage.includes("ストレス")
    )
      topics.push("メンタルヘルス");
    if (lowerUserMessage.includes("水") || lowerUserMessage.includes("水分"))
      topics.push("水分補給");

    // Determine intent
    let intent = "general_health_support";
    if (topics.includes("体重管理")) intent = "weight_management";
    else if (topics.includes("食事")) intent = "nutrition_guidance";
    else if (topics.includes("運動")) intent = "exercise_support";
    else if (topics.includes("睡眠")) intent = "sleep_guidance";
    else if (topics.includes("メンタルヘルス"))
      intent = "mental_health_support";
    else if (
      lowerUserMessage.includes("こんにちは") ||
      lowerUserMessage.includes("おはよう")
    )
      intent = "greeting";

    // Confidence based on response length and specificity
    const confidence = Math.min(0.95, 0.7 + (aiResponse.length / 1000) * 0.2);

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
        topics: ["健康相談"],
        intent: "health_concern",
        tokens: 0,
        riskLevel: "medium",
        emergencyContact: false,
      };
    }

    // Simple fallback responses for common health topics
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
      message: `${name}、話してくれてありがとう！健康に関することなら、いつでも気軽に相談して。一緒に頑張ろう！✨`,
      mood: "happy",
      confidence: 0.7,
      topics: ["一般的な健康支援"],
      intent: "general_health_support",
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
