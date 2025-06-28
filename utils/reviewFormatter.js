/**
 * 產出活動審核結果 HTML，通過與未通過皆適用
 * @param {Object} result - AI 審查回傳物件
 * @param {boolean} isApproved - 是否通過
 * @returns {string} HTML 字串
 */

const formatReviewResultHTML = (result, isApproved) => {
  const { sensitiveCheck, regulatoryCheck, imageCheck, imageRiskSummary, feedback } = result;

  const passMark = (pass) => (pass ? "✅ 通過" : "❌ 未通過");

  return `
      <h3 style="color: ${isApproved ? "#28a745" : "#e74c3c"};">
        ${isApproved ? "🎉 活動通過！以下是審查回饋" : "❌ 活動未通過，以下為原因與建議"}
      </h3>
      <ul style="text-align: left; padding-left: 20px;">
        <li>敏感詞檢查：${passMark(sensitiveCheck?.pass)}</li>
        <li>法規檢查：${passMark(regulatoryCheck?.pass)}</li>
        <li>圖片描述審查：${passMark(imageCheck?.pass)}</li>
        <li>圖片風險分析：${imageRiskSummary?.hasRisk ? "❌ 發現風險" : "✅ 無風險"}</li>
      </ul>
  
      <h3 style="margin-top: 20px;">🤖 GPT 活動文案回饋建議</h3>
      <div style="background: #fefefe; border: 1px dashed #ccc; padding: 16px; text-align: left; border-radius: 8px; color: #555;">
        ${feedback.replace(/\n/g, "<br>")}
      </div>
    `.trim();
};

module.exports = { formatReviewResultHTML };
