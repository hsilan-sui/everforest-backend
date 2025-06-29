/**
 * 圖片描述文字審查（OpenAI function calling）
 * @param {string[]} imageDescriptions - 有描述的圖片文字
 * @returns {Promise<Object>} - 審查報告（若無描述，回傳安全結果）
 */

const OpenAI = require("openai");
const dotenv = require("dotenv");
dotenv.config();

// 初始化 OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const checkImageDescriptions = async (imageDescriptions) => {
  console.warn("進行圖片描述檢測");

  // 如果沒有任何描述，就直接略過
  if (!Array.isArray(imageDescriptions) || imageDescriptions.length === 0) {
    return {
      hasIssue: false,
      issues: [],
      summary: "沒有提供圖片描述文字，略過文字審查。",
      analysis: "無描述可供檢查，已自動略過。",
    };
  }

  const tools = [
    {
      type: "function",
      name: "image_description_analysis",
      description: "分析圖片描述文字是否涉及不當、敏感或違法內容，並提供審查建議",
      parameters: {
        type: "object",
        properties: {
          hasIssue: {
            type: "boolean",
            description: "是否發現任何問題（如色情、歧視、品牌濫用等）",
          },
          issues: {
            type: "array",
            description: "各個圖片描述中出現的問題與建議修正方式",
            items: {
              type: "object",
              properties: {
                description: {
                  type: "string",
                  description: "問題描述（說明是哪一句描述出現什麼問題）",
                },
                suggestion: {
                  type: "string",
                  description: "修正建議（如修改文字、刪除內容等）",
                },
              },
            },
          },
          summary: {
            type: "string",
            description: "針對所有描述的總結意見（例如：是否安全、是否需要修改等）",
          },
        },
        required: ["hasIssue", "issues", "summary"],
      },
    },
  ];

  const prompt = `
  你是一位專業圖片文字審查員，請檢查下列圖片描述是否涉及以下風險：
  - 色情、暴力、歧視、藥物、虐待、狩獵
  - 誇大不實、療效、品牌濫用、違反平台政策
  - 其他法規風險或不當表達
  
  請回覆 hasIssue（是否有問題）、issues（逐筆問題說明與建議）、summary（總結說明）。
  `;

  try {
    const response = await openai.responses.create({
      model: "gpt-4o",
      instructions: prompt,
      input: [
        {
          role: "user",
          content: `圖片描述如下：\n${imageDescriptions.join("\n")}`,
        },
      ],
      tools,
      tool_choice: "auto",
      temperature: 0.3,
    });

    const fnCall = response.output?.find(
      (item) => item.type === "function_call" && item.name === "image_description_analysis"
    );

    if (fnCall) {
      const result = JSON.parse(fnCall.arguments);
      const analysisText = `圖片描述審查結果：
  是否有問題：${result.hasIssue ? "是" : "否"}
  
  ${result.issues
    .map((issue) => `- ${issue.description}\n  建議：${issue.suggestion}`)
    .join("\n\n")}
  
  總結：${result.summary}`;

      return {
        ...result,
        analysis: analysisText,
        pass: !result.hasIssue, // 供最終審核判斷用
      };
    }

    // fallback
    return {
      hasIssue: false,
      issues: [],
      summary: "OpenAI 未回傳有效函式結果",
      analysis: "無法進行圖片描述審查，請稍後再試。",
    };
  } catch (err) {
    console.error("圖片描述檢查失敗：", err);
    return {
      hasIssue: false,
      issues: [],
      summary: "檢查過程發生錯誤",
      analysis: "圖片描述審查失敗，請稍後再試。",
    };
  }
};

module.exports = {
  checkImageDescriptions,
};
