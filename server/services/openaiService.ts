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
        max_tokens: 600,
        temperature: 0.4,
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
        request.healthContext,
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

    // 簡潔なプロンプト
    let systemPrompt = `あなたは健康管理アプリのAIアシスタントです。${name}の健康をサポートします。

【基本ルール】
- タメ語で親しみやすく対話
- 回答は「共感→情報→提案」の3段階構成
- 各段階の間に改行を入れる
- 180-250文字程度
- 絵文字を適度に使用（各行に1-2個程度）

    【重要な指示】
    - 体重質問には統計データ（平均・最大・最小・範囲・変化）を含める
    - 食事質問には過去3日間の食事履歴を参考にする（データがない場合は「まだ食事記録がないね」と伝える）
    - 年齢質問には年齢のみ答える
    - 日常会話では健康データ言及を避ける
    - 未設定のデータを聞かれた場合は「〜はまだ未設定だね」と伝え、登録を促す
    - 医療診断は行わず、症状時は医療機関受診を推奨

【例】
体重質問: 「最近の記録を見ると、平均65.2kg、最大66.0kg、最小64.5kgだよ。この2週間で-0.5kgの減少だね！順調に目標に向かってるよ📊」
日常会話: 「お腹減ったんだね！何か美味しいもの食べたい気分？今日は何が食べたい？😋」`;

    // コンテキスト情報を簡潔に追加
    if (healthContext?.conversationHistory && healthContext.conversationHistory.length > 0) {
      systemPrompt += `\n\n【会話履歴】`;
      const recentHistory = healthContext.conversationHistory.slice(-5); // 最新5件のみ
      recentHistory.forEach((exchange) => {
        if (exchange.userMessage && exchange.aiResponse) {
          systemPrompt += `\n${name}: 「${exchange.userMessage}」`;
        }
      });
    }

    // 体重統計データ
    if (healthContext?.recentHealthLogs && healthContext.recentHealthLogs.length > 0) {
      const weightStats = this.analyzeWeightStatistics(healthContext.recentHealthLogs);
      if (weightStats !== "体重データなし") {
        systemPrompt += `\n\n【体重データ】\n${weightStats}`;
      } else {
        systemPrompt += `\n\n【体重データ】未設定`;
      }
    } else {
      systemPrompt += `\n\n【体重データ】未設定`;
    }

    // 食事ログデータ（過去3日間）
    const today = new Date().toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' });
    if (healthContext?.recentHealthLogs && healthContext.recentHealthLogs.length > 0) {
      const foodLogs = this.analyzeFoodLogs(healthContext.recentHealthLogs);
      systemPrompt += `\n\n【食事ログ（過去3日間）】`;
      systemPrompt += `\n※今日の日付: ${today}`;
      if (foodLogs !== "食事データなし") {
        systemPrompt += `\n${foodLogs}`;
        // systemPrompt += `\n※上記の食事記録を参考にして回答してください。`;
      } else {
        systemPrompt += `\n食事データなし`;
        // systemPrompt += `\n※食事記録がない場合は「まだ食事記録がないね」と伝えてください。`;
      }
    } else {
      systemPrompt += `\n\n【食事ログ】未設定`;
    }

    // プロフィール情報
    if (healthContext?.userProfile) {
      const profile = healthContext.userProfile;
      const profileItems: string[] = [];
      
      // 年齢
      if (profile.age) {
        profileItems.push(`年齢${profile.age}歳`);
      } else {
        profileItems.push(`年齢未設定`);
      }
      
      // 性別
      if (profile.gender) {
        const genderMap: { [key: string]: string } = {
          'male': '男性',
          'female': '女性',
          'other': 'その他'
        };
        profileItems.push(`性別${genderMap[profile.gender] || profile.gender}`);
      } else {
        profileItems.push(`性別未設定`);
      }
      
      // 身長
      if (profile.height) {
        profileItems.push(`身長${profile.height}cm`);
      } else {
        profileItems.push(`身長未設定`);
      }
      
      systemPrompt += `\n\n【プロフィール】${profileItems.join(', ')}`;
    } else {
      systemPrompt += `\n\n【プロフィール】年齢未設定, 性別未設定, 身長未設定`;
    }

    console.log("--------------------------------");
    console.log(systemPrompt);
    console.log("--------------------------------");
  return systemPrompt;
}

  private buildUserMessage(
    message: string,
    healthContext?: HealthContext,
  ): string {
    // シンプル化: 会話履歴はシステムプロンプトで処理
    // ユーザーメッセージは基本的にそのまま渡す
    let userMessage = message;

    // 今日の活動コンテキストのみ追加（簡潔に）
    if (healthContext?.recentHealthLogs) {
      const hasRecentLog = healthContext.recentHealthLogs.some((log) => {
        const logDate = new Date(log.date);
        const today = new Date();
        return logDate.toDateString() === today.toDateString();
      });

      if (hasRecentLog) {
        userMessage += "\n\n[補足: 今日、健康データを記録済み]";
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
      
    // Health concern topics
    if (lowerUserMessage.includes("痛い") || lowerUserMessage.includes("痛み"))
      topics.push("体調相談");
    if (lowerUserMessage.includes("調子が悪い") || lowerUserMessage.includes("体調不良"))
      topics.push("体調相談");

    // Determine intent based on message context
    let intent = "casual_conversation";
    
    if (lowerUserMessage.includes("おはよう") || lowerUserMessage.includes("こんにちは")) {
      intent = "greeting";
    } else if (lowerUserMessage.includes("すいた") || lowerUserMessage.includes("疲れた")) {
      intent = "casual_conversation";
    } else if (topics.includes("体調相談")) {
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
    healthContext?: HealthContext,
  ): Omit<ChatCompletionResponse, "responseTime" | "model"> {
    const name = userName || "あなた";
    const lowerMessage = message.toLowerCase();

    // Check for symptoms keywords first
    if (
      lowerMessage.includes("痛み") ||
      lowerMessage.includes("具合が悪い") ||
      lowerMessage.includes("調子が悪い")
    ) {
      return {
        message: `${name}、体調が良くないんだね。心配だから、症状が続く場合や痛みが強い場合は早めに医療機関を受診した方がいいよ。緊急の場合は #7119 や 119 に連絡してね。`,
        mood: "anxious",
        confidence: 0.9,
        topics: ["体調相談"],
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
      const weightStats = this.analyzeWeightStatistics(healthContext?.recentHealthLogs || []);
      
      if (weightStats !== "体重データなし") {
        return {
          message: `${name}、体重について話そう！\n\n${weightStats}\n\nこのデータを見ると、体重管理の傾向が分かるね！目標に向けて一緒に頑張ろう！💪`,
          mood: "happy",
          confidence: 0.9,
          topics: ["体重管理"],
          intent: "weight_management",
          tokens: 0,
          riskLevel: "low",
          emergencyContact: false,
        };
      } else {
        return {
          message: `${name}、体重について話そう！まだ体重記録がないね。健康ログで体重を記録すると、変化が分かりやすくなるよ！`,
          mood: "happy",
          confidence: 0.9,
          topics: ["体重管理"],
          intent: "weight_management",
          tokens: 0,
          riskLevel: "low",
          emergencyContact: false,
        };
      }
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
      const riskPrompt = `以下のユーザーメッセージから医療機関受診の緊急度レベルを評価して。JSON形式で返して。

ユーザーメッセージ: "${userMessage}"

緊急度レベル評価基準:
- emergency: 生命に関わる可能性が疑われる症状（激しい胸痛、呼吸困難、意識障害、大量出血、激しい腹痛など）→ただちに救急対応が必要
- high: 強い症状があり早めの受診が望ましい（強い痛み、高熱、嘔吐、血便など）→当日中の医療機関受診を推奨
- medium: 症状があり医師の診察が望ましい（軽度の痛み、軽い発熱、持続する症状など）→数日以内の医療機関受診を推奨
- low: 一般的な健康習慣の相談（体重管理、食事、運動、予防など）→医療機関受診は不要

返答形式:
{
  "riskLevel": "emergency|high|medium|low",
  "emergencyContact": true/false,
  "reasoning": "判断理由"
}

緊急度が高い場合（emergency/high）はemergencyContactをtrueにして。
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

  // 食事ログ分析メソッドを追加（日付ごとにグループ化）
  private analyzeFoodLogs(healthLogs: any[]): string {
    const today = new Date();
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const foodLogs = healthLogs
      .filter(log => {
        const logDate = new Date(log.date);
        return log.type === 'food' && logDate >= threeDaysAgo;
      })
      .map(log => {
        const foodName = log.data?.name || log.title || '食事記録';
        return {
          date: new Date(log.date),
          title: log.title,
          food: foodName
        };
      })
      .sort((a, b) => b.date.getTime() - a.date.getTime()); // 新しい順

    if (foodLogs.length === 0) {
      return "食事データなし";
    }

    // 日付ごとにグループ化
    const groupedByDate = new Map<string, string[]>();
    foodLogs.forEach(log => {
      const dateStr = log.date.toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' });
      if (!groupedByDate.has(dateStr)) {
        groupedByDate.set(dateStr, []);
      }
      groupedByDate.get(dateStr)!.push(log.food);
    });

    // 日付ごとに表示（新しい順）
    let analysis = ``;
    let first = true;
    groupedByDate.forEach((foods, dateStr) => {
      if (!first) {
        analysis += `\n`;
      }
      analysis += `${dateStr}: ${foods.join(', ')}`;
      first = false;
    });

    return analysis;
  }

  // 体重統計分析メソッドを追加
  private analyzeWeightStatistics(healthLogs: any[]): string {
    const weightLogs = healthLogs
      .filter(log => {
        const hasWeight = log.data?.weight && typeof log.data.weight === 'number';
        return hasWeight;
      })
      .map(log => ({ 
        date: new Date(log.date), 
        weight: log.data.weight 
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    if (weightLogs.length === 0) {
      return "体重データなし";
    }

    const weights = weightLogs.map(log => log.weight);
    const avgWeight = weights.reduce((sum, weight) => sum + weight, 0) / weights.length;
    const maxWeight = Math.max(...weights);
    const minWeight = Math.min(...weights);
    const weightRange = maxWeight - minWeight;
    
    // 変化の計算（最新 - 最古）
    const weightChange = weightLogs.length > 1 
      ? weights[weights.length - 1] - weights[0] 
      : 0;

    let analysis = `📊 体重統計（${weightLogs.length}件の記録）\n`;
    analysis += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    analysis += `📈 平均体重: ${avgWeight.toFixed(1)}kg\n`;
    analysis += `📊 最大体重: ${maxWeight}kg\n`;
    analysis += `📉 最小体重: ${minWeight}kg\n`;
    analysis += `📏 体重範囲: ${weightRange.toFixed(1)}kg\n`;
    
    if (weightLogs.length > 1) {
      if (weightChange > 0) {
        analysis += `📈 期間変化: +${weightChange.toFixed(1)}kg（増加）`;
      } else if (weightChange < 0) {
        analysis += `📉 期間変化: ${weightChange.toFixed(1)}kg（減少）`;
      } else {
        analysis += `➡️ 期間変化: 変化なし`;
      }
    }

    return analysis;
  }

}

export default OpenAIService;
