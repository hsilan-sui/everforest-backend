/**
 * 生成總結回饋
 * @param {Object} results - 各階段結果
 * @returns {Promise<string>} - 總結回饋
 */

const OpenAI = require("openai");
const dotenv = require("dotenv");
dotenv.config();

// 初始化 OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const generateActivityReviewFeedback = async (results) => {
  try {
    console.warn("生成總結回饋");
    const response = await openai.responses.create({
      model: "gpt-4o",
      instructions: `你是一位露營活動文案審核專家，負責提供專業的露營活動文案回饋。
          根據文案生成、敏感詞檢測、法規檢測、圖片描述以及圖片內容審核的結果，提供全面的總結回饋。
          包含以下方面：
          1. 露營活動文案整體評價
          2. 敏感內容處理建議
          3. 法規合規性建議
          4. 改進方向
          5. 舉辦讓人難忘的露營活動要點提示
  
  使用繁體中文，提供專業、實用且具體的建議。`,
      input: [{ role: "user", content: JSON.stringify(results) }],
      temperature: 0.5,
    });

    return response.output_text;
  } catch (error) {
    console.error("生成總結回饋時出錯:", error);
    throw error;
  }
};

module.exports = { generateActivityReviewFeedback };
