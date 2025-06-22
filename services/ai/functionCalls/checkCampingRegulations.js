/**
 * 進行法規檢測
 * @param {string} content - 要檢測的文案內容
 * @param {Object} eventData - 活動資料
 * @returns {Promise<Object>} - 檢測結果
 */

const OpenAI = require("openai");
const dotenv = require("dotenv");
dotenv.config();

// 初始化 OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const checkCampingRegulations = async (content, eventData) => {
  try {
    console.warn("進行法規檢測");
    const campingCheckList = `一、收益誇大與非法吸金（高風險字眼）
      1. 保證獲利、穩賺不賠、回本保證（如「穩賺不賠」「保本方案」「快速回本」）；恐違反《公平交易法》誇大不實、《銀行法》第29條之1非法吸金。
      2. 誇大收益與快速致富（如「月入十萬」「短期翻倍」「年收百萬」）；可能構成誤導性廣告、違反金融監理規範。
      3. 引導式商業營隊（如「營地主教你賺錢」「打造被動收入」）；活動類型如涉及財務內容應明確揭露並依法限制。
  
      二、冒用政府名義或虛構專業認證
      1. 冒用公部門／協會名義（如「政府核准」「官方認證」「教育部指導」）；恐違反《公平交易法》第22條、《刑法》偽造文書。
      2. 虛構證照或職稱（如「露營教練協會頒發」「國際露營師」）；無實體單位支持下宣稱，恐涉虛偽廣告。
      3. 虛假安全標章（如「ISO露營標準」「消防合格認證」）；如無第三方認證機構佐證即違規。
  
      三、誇大場地設施與不實安全保證
      1. 誇大場地描述（如「全台唯一秘境」「唯一合法山林營地」）；若無明確證據恐違反《公平交易法》。
      2. 安全保障過度（如「百分百安全」「完全無風險」「絕對防蚊防蟲」）；無法保證時屬誇大不實。
      3. 噪音、設施、環境未揭露（如未註明無廁所／限電等）；未說明即屬資訊揭露不足，違反《消保法》第7條。
  
      四、活動限制條件未揭露或誤導性說明
      1. 年齡、裝備或健康條件未標示（如「適合全齡參加」但實為高強度登山活動）；恐違反《消費者保護法》第19條。
      2. 保險資訊未明示（如「全程保障」但未購買責任險）；屬重大資訊未揭露。
      3. 退費條件不清或無退費說明（如「報名後恕不退費」但未明示於報名前）；違反《定型化契約》與《消保法》。
  
      五、抽獎、促銷與倒數急迫語言
      1. 抽獎活動未申報（如「報名抽帳篷」「現場抽獎」）；恐違反《刑法》賭博罪、《消費者保護法》促銷規範。
      2. 使用誤導式倒數行銷（如「僅剩 3 位名額」「24 小時內截止」）；若非即時動態，恐構成虛偽不實廣告。
      3. 虛構售罄或名額（如「1000人搶報」「爆滿中」）；若非事實，恐違反《公平交易法》。
  
      六、醫療／健康功效誤導宣稱（與活動無關卻出現）
      1. 宣稱舒緩疾病、改善睡眠（如「改善過敏」「助眠淨化營」）；如非醫療行為不得標榜療效，恐違反《藥事法》《食安法》。
      2. 使用健康背書語言（如「醫師推薦」「身心療癒必選」）；無醫療證據即為虛假廣告。
      3. 宣稱能治療壓力或疾病（如「治療憂鬱」「舒緩慢性疲勞」）；已涉及非法醫療行為或誇大功效。
  
      備註：以上任一項若出現在活動標題、簡介、圖片文字、主辦人介紹、FAQ、退費說明等區塊皆需納入審核。`;

    const tools = [
      {
        type: "function",
        name: "regulatory_compliance_analysis",
        description: "分析文案是否符合法規並提供結果",
        parameters: {
          type: "object",
          properties: {
            hasRegulatoryIssues: {
              type: "boolean",
              description: "是否發現法規問題",
            },
            violations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  category: {
                    type: "string",
                    description: "違規類別",
                  },
                  content: {
                    type: "string",
                    description: "違規內容",
                  },
                  law: {
                    type: "string",
                    description: "相關法規",
                  },
                  suggestion: {
                    type: "string",
                    description: "修正建議",
                  },
                },
              },
              description: "法規違規列表",
            },
            missingElements: {
              type: "array",
              items: {
                type: "string",
              },
              description: "缺少的必要元素（如風險揭露、退款政策等）",
            },
            summary: {
              type: "string",
              description: "法規檢測總結",
            },
          },
        },
        required: ["hasRegulatoryIssues", "violations", "missingElements", "summary"],
      },
    ];

    const response = await openai.responses.create({
      model: "gpt-4o",
      instructions: `你是一位專業的露營活動法規審核專家，負責檢測文案中是否符合露營相關法規與規範。請特別檢查以下法規清單中的內容：${campingCheckList}
  
        此外，也請檢查以下方面：
        1. 消費者保護法相關規範
        2. 廣告法規遵循
        3. 募資平台特定規範
        4. 產品安全與責任聲明
        5. 智慧財產權聲明
        6. 退款與交付政策
  
        請使用 regulatory_compliance_analysis 函式回傳分析結果，提供詳細的法規檢測報告。`,
      input: [
        {
          role: "user",
          content: `露營活動文案資料: ${JSON.stringify(eventData)}\n\n文案內容: ${content}`,
        },
      ],
      tools: tools,
      tool_choice: "auto",
      temperature: 0.3,
    });

    console.warn("法規檢測結果:", response);

    // 解析函式呼叫結果
    if (response.output && response.output.length > 0) {
      const functionCall = response.output.find(
        (item) => item.type === "function_call" && item.name === "regulatory_compliance_analysis"
      );

      if (functionCall) {
        const result = JSON.parse(functionCall.arguments);
        // 添加原始分析文本
        const analysisText = `法規檢測結果：
            是否發現法規問題：${result.hasRegulatoryIssues ? "是" : "否"}
  
            ${result.hasRegulatoryIssues ? "違規項目：" : ""}
            ${result.violations
              .map(
                (v) =>
                  `- ${v.category}：${v.content}\n  相關法規：${v.law}\n  建議：${v.suggestion}`
              )
              .join("\n\n")}
  
            ${result.missingElements.length > 0 ? "缺少的必要元素：" : ""}
            ${result.missingElements.map((e) => `- ${e}`).join("\n")}
  
            總結：${result.summary}`;

        return {
          ...result,
          analysis: analysisText,
          pass: !result.hasRegulatoryIssues,
        };
      }
    }

    // 如果函式呼叫失敗，回傳預設結果
    return {
      hasRegulatoryIssues: false,
      violations: [],
      missingElements: [],
      summary: "無法進行法規檢測",
      analysis: "無法進行法規檢測，請稍後再試。",
    };
  } catch (error) {
    console.error("進行法規檢測時出錯:", error);
    throw error;
  }
};

module.exports = {
  checkCampingRegulations,
};
