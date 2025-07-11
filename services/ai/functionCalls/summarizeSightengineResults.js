/**
 * 將 Sightengine 圖片風險結果交給 GPT 分析
 * @param {Array} imageResults - 每張圖片的簡化風險資料（包含 url、type、simplifiedResult）
 * @returns {Object} - 分析結果與總結，含有無風險、風險詳情、建議與摘要文字
 */

const OpenAI = require("openai");
const dotenv = require("dotenv");
dotenv.config();

// 初始化 OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

//  給 GPT 分析圖片內容是否有風險
const summarizeSightengineResults = async (imageResults) => {
  const tools = [
    {
      type: "function",
      name: "image_content_analysis",
      description: "分析 Sightengine 圖片掃描結果，判斷是否涉及不當或違法內容",
      parameters: {
        type: "object",
        properties: {
          hasRisk: { type: "boolean", description: "是否存在圖片風險" },
          riskDetails: {
            type: "array",
            description: "圖片風險詳情與建議",
            items: {
              type: "object",
              properties: {
                type: { type: "string" },
                url: { type: "string" },
                issue: { type: "string" },
                suggestion: { type: "string" },
              },
            },
          },
          summary: { type: "string" },
        },
        required: ["hasRisk", "riskDetails", "summary"],
      },
    },
  ];

  const response = await openai.responses.create({
    model: "gpt-4o",
    instructions: `
        你是圖片內容風險分析專家，請根據 Sightengine API 回傳的結果，進行風險判斷與總結。
        注意風險項目包括：裸露、暴力、毒品、賭博、詐騙、冒犯性內容、醫療虛假資訊等。
        請使用 function image_content_analysis 回傳結構化 JSON 結果。
      `,
    input: [
      {
        role: "user",
        content: `請分析以下圖片掃描結果：\n${JSON.stringify(imageResults)}`,
      },
    ],
    tools,
    tool_choice: "auto",
    temperature: 0.3,
  });

  const functionCall = response.output.find(
    (item) => item.type === "function_call" && item.name === "image_content_analysis"
  );

  if (functionCall) {
    const result = JSON.parse(functionCall.arguments);
    const analysisText = `圖片內容風險檢測結果：
  是否存在風險：${result.hasRisk ? "是" : "否"}
  
  ${result.riskDetails
    .map((r) => `- [${r.type}] ${r.url}\n  問題：${r.issue}\n  建議：${r.suggestion}`)
    .join("\n")}
  
  總結：${result.summary}`;

    return {
      ...result,
      analysis: analysisText,
      pass: !result.hasRisk,
    };
  }

  return {
    hasRisk: false,
    riskDetails: [],
    summary: "無法辨識圖片風險",
    analysis: "未成功取得分析結果，請稍後再試。",
  };
};

module.exports = { summarizeSightengineResults };
