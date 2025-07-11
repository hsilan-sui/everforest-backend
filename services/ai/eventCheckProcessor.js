//processEventCheck => AI 活動審查的主流程總管（function call）
//作為 AI 活動審查的主流程總管

//資料處理:抽出所有活動中的文字資料
const { extractTextFromEvent } = require("./textExtractor");

//導入設計的function calls
const {
  detectEventSensitiveContent, //// 敏感詞檢查（OpenAI + function calling）
  checkCampingRegulations, //// 法規檢查（OpenAI + function calling）
  checkImageDescriptions, //// 圖片描述文字審查（OpenAI）
  checkImageWithSightengine, // 使用 Sightengine 掃描圖片
  simplifySightengineResult, // 把 Sightengine 結果簡化成 GPT 可理解的格式
  summarizeSightengineResults, // 圖片掃描總結（交給 GPT 統整分析）
  generateActivityReviewFeedback, // 最後 GPT 整理整體回饋
} = require("./functionCalls");

const processEventCheck = async (eventData) => {
  try {
    // 1. 資料清洗: 提取活動中的所有文字內容
    const eventFullText = extractTextFromEvent(eventData);

    // 4.1 資料清洗: 提取圖片描述文字
    const imageDescriptions =
      eventData.eventPhotoBox
        ?.map((p, i) =>
          p.description ? `${p.type || "圖片"} ${i + 1}：「${p.description}」` : null
        )
        .filter(Boolean) || [];

    // 2, 3, 4.2 同時跑
    const [sensitiveCheck, regulatoryCheck, imageCheck] = await Promise.all([
      detectEventSensitiveContent(eventFullText),
      checkCampingRegulations(eventFullText, eventData),
      checkImageDescriptions(imageDescriptions),
    ]);

    // 5. 圖片內容掃描（每張同時跑）
    const simplifiedImageResults = await Promise.all(
      (eventData.eventPhotoBox || []).map(async (p) => {
        try {
          const raw = await checkImageWithSightengine(p.photo_url);
          return {
            url: p.photo_url,
            type: p.type || "未知",
            simplifiedResult: simplifySightengineResult(raw),
          };
        } catch (e) {
          return {
            url: p.photo_url,
            type: p.type || "未知",
            error: e.message,
          };
        }
      })
    );

    // 5.2 再把圖片掃描結果交給 GPT 統整
    const imageRiskSummary = await summarizeSightengineResults(simplifiedImageResults);

    // 6. 總結所有審查結果
    const results = {
      eventData,
      eventFullText,
      sensitiveCheck,
      regulatoryCheck,
      imageCheck,
      imageRiskSummary,
    };

    // 7. 交給 GPT 整體回饋（summary）
    const feedback = await generateActivityReviewFeedback(results);

    // 8. 判斷是否通過審查
    const success =
      (sensitiveCheck.pass ?? true) &&
      (regulatoryCheck.pass ?? true) &&
      (imageCheck.pass ?? true) &&
      !imageRiskSummary.hasRisk;

    console.warn(`要檢查的活動===>`, results);

    // 9. 回傳
    return {
      success,
      ...results,
      feedback,
    };
  } catch (error) {
    console.error("AI 活動審查失敗：", error);
    throw error;
  }
};

// const processEventCheck = async (eventData) => {
//   try {
//     //1.資料清洗: 提取活動中的所有文字內容
//     const eventFullText = extractTextFromEvent(eventData);

//     //2. 敏感詞檢查（function calling）
//     const sensitiveCheck = await detectEventSensitiveContent(eventFullText);

//     //3. 法規檢查（function calling）
//     const regulatoryCheck = await checkCampingRegulations(eventFullText, eventData);

//     //4. 圖片描述文字審查
//     //4.1 資料清洗=>提取圖片描述文字
//     const imageDescriptions =
//       eventData.eventPhotoBox
//         ?.map((p, i) =>
//           p.description ? `${p.type || "圖片"} ${i + 1}：「${p.description}」` : null
//         )
//         .filter(Boolean) || [];
//     //4.2 圖片文字審查
//     const imageCheck = await checkImageDescriptions(imageDescriptions);

//     //5. 圖片內容掃描（Sightengine + GPT）
//     const simplifiedImageResults = await Promise.all(
//       (eventData.eventPhotoBox || []).map(async (p) => {
//         try {
//           const raw = await checkImageWithSightengine(p.photo_url);
//           return {
//             url: p.photo_url,
//             type: p.type || "未知",
//             simplifiedResult: simplifySightengineResult(raw),
//           };
//         } catch (e) {
//           return {
//             url: p.photo_url,
//             type: p.type || "未知",
//             error: e.message,
//           };
//         }
//       })
//     );

//     //再把每張結果整理給 GPT 統整
//     const imageRiskSummary = await summarizeSightengineResults(simplifiedImageResults);

//     //6. 總結所有審查結果
//     const results = {
//       eventData,
//       eventFullText,
//       sensitiveCheck,
//       regulatoryCheck,
//       imageCheck,
//       imageRiskSummary,
//     };

//     //7. 交給 GPT 整體回饋（summary）
//     const feedback = await generateActivityReviewFeedback(results);

//     //8. 判斷是否通過審查
//     const success =
//       (sensitiveCheck.pass ?? true) &&
//       (regulatoryCheck.pass ?? true) &&
//       (imageCheck.pass ?? true) &&
//       !imageRiskSummary.hasRisk;

//     console.warn(`要檢查的活動===> ${results}`); // 看得更完整

//     //9. 回傳
//     return {
//       success,
//       ...results,
//       feedback,
//     };
//   } catch (error) {
//     console.error("AI 活動審查失敗：", error);
//     throw error;
//   }
// };

module.exports = { processEventCheck };
