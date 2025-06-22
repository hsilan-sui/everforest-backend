/**
 * 檢查文字內容是否含有敏感詞、違禁內容或不當語句
 * @param {string} content - 要檢查的文字
 * @returns {Promise<Object>} - 回傳檢查結果與是否通過
 */
const OpenAI = require("openai");
const dotenv = require("dotenv");
dotenv.config();

// 初始化 OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const detectEventSensitiveContent = async (content) => {
  try {
    console.warn("進行敏感詞檢測");
    const sensitiveWordsList = `色情,A片,性交,淫穢,強姦,血腥,謀殺,暴力,打架,砍人,毒品,兒童色情,大麻,K他命,搖頭丸,賭場,賭博,地下賭盤,性交易,賣淫嫖娼,詐騙,盜竊,勒索,黑社會,幫派,恐嚇,敲詐,走私,非法集資,婊子,娘炮,婊子,智障,殘廢,
    快速致富,零風險,穩賺不賠,一本萬利,老鼠會,詐騙,治癒癌症,包治百病,天體營地,裸體,性暗示,性行為,性虐待,邪教,極端主義,聖戰,聚賭,台獨,港獨,納粹,ISIS,恐怖組織,三K黨,支那,黑鬼,殘廢,基佬,娘炮,人妖,台巴子,迪士尼,Apple,Columbia,GORE-TEX,無授權使用品牌,跳崖,未報備露營地,違法篝火,自製煙火,野外打獵,危險活動,,未報備露無人機操作`;

    //定義函式(這是 OpenAI Function Calling 的 函式定義區塊)
    //==>我希望ai在判斷完敏感詞後，用這個 function sensitive_content_analysis 回傳結果，而不是單純用文字回應我。
    const tools = [
      {
        type: "function",
        name: "sensitive_content_analysis",
        description: "檢查與分析文字內容是否含有敏感詞、違禁內容或不當語句並提供結果",
        parameters: {
          type: "object",
          properties: {
            hasSensitiveContent: {
              type: "boolean",
              description: "是否含有敏感詞或不當內容",
            },
            sensitiveWords: {
              type: "array",
              items: {
                type: "string",
              },
              description: "檢測到的敏感詞列表",
            },
            issues: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  category: {
                    type: "string",
                    description: "問題類別，例如：政治敏感、歧視性語言、色情、暴力、違禁品等",
                  },
                  description: {
                    type: "string",
                    description: "問題說明",
                  },
                  suggestion: {
                    type: "string",
                    description: "建議的修改或處理方式",
                  },
                },
              },
              description: "敏感內容問題列表",
            },
            summary: {
              type: "string",
              description: "敏感內容分析總結",
            },
          },
          required: ["hasSensitiveContent", "sensitiveWords", "issues", "summary"],
        },
      },
    ];

    // 使用 OpenAI 的 function calling 檢測敏感詞
    const response = await openai.responses.create({
      model: "gpt-4o",
      instructions: `
          你是一位非常專業的內容審核專家，負責檢測文案中可能存在的敏感詞或不適當內容。請特別檢查以下敏感詞列表中的詞語是否出現在文案中：${sensitiveWordsList}
  
          此外，也一定要檢查以下類別的敏感內容：
          1. 政治敏感詞
          2. 歧視性語言
          3. 違法或灰色地帶內容
          4. 誇大不實的宣傳
          5. 侵犯智慧財產權的內容
          6. 違反平台規範的內容
          7. 其他可能引起爭議或不當的內容，如：非法博弈，聚賭等
  
          請使用 sensitive_content_analysis 函式回傳分析結果，提供詳細的敏感詞檢測報告。
        `,
      input: [{ role: "user", content: content }],
      tools: tools,
      tool_choice: "auto",
      temperature: 0.3,
    });

    console.warn("敏感詞檢測結果:", response);
    // 解析函式呼叫結果
    if (response.output && response.output.length > 0) {
      const functionCall = response.output.find(
        (item) => item.type === "function_call" && item.name === "sensitive_content_analysis"
      );

      if (functionCall) {
        const result = JSON.parse(functionCall.arguments);

        //添加原始分析文本
        const analysisText = `
          敏感詞檢測結果: 
            是否發現敏感內容: ${result.hasSensitiveContent ? "是" : "否"}
            ${
              result.hasSensitiveContent
                ? `發現的敏感詞： ${result.sensitiveWords.join("、")}`
                : "未發現敏感詞"
            }
  
            問題詳情：
            ${result.issues
              .map(
                (issue) => `- ${issue.category}：${issue.description}\n 建議：${issue.suggestion}`
              )
              .join("\n\n")}
  
            總結：
            ${result.summary}`;

        return {
          ...result,
          analysis: analysisText,
          pass: !result.hasSensitiveContent,
        };
      }
    }

    // 如果函式呼叫失敗，回傳預設結果
    return {
      hasSensitiveContent: false,
      sensitiveWords: [],
      issues: [],
      summary: "無法進行敏感詞分析",
      analysis: "無法進行敏感詞分析，請稍後再試。",
    };
  } catch (error) {
    console.error("檢測敏感詞時出錯:", error);
    throw error;
  }
};

module.exports = {
  detectEventSensitiveContent,
};
