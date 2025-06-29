// utils/emailUtils.js
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT, 10),
  secure: false, // Gmail 通常使用 TLS (587)
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * 發送重設密碼 Email
 * @param {string} toEmail - 收件者 email
 * @param {string} resetLink - 前端用的重設密碼連結
 */
exports.sendResetPasswordEmail = async (toEmail, resetLink) => {
  const mailOptions = {
    from: `"Everforest_森森不息露營活動平台" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "🔐 密碼重設通知",
    html: `
        <div style="
      font-family: 'Segoe UI', 'Helvetica Neue', sans-serif;
      line-height: 1.8;
      border: 1px solid #d8e4dc;
      border-radius: 16px;
      padding: 32px;
      max-width: 600px;
      margin: 0 auto;
      background-color: #f2fdf6;
      text-align: center;
      color: #2c3e50;
    ">
      <img src="https://storage.googleapis.com/everforest-e0f71.firebasestorage.app/host/covers/f47086f8-43a9-4a21-938b-6a49b0987349.png?GoogleAccessId=firebase-adminsdk-fbsvc%40everforest-e0f71.iam.gserviceaccount.com&Expires=1782444355&Signature=QAIS44g%2FjE5Ma2ngkY1opvjriAJEd61ShoIxiGURtgZzGzz%2BcCQLC9R5PaGkefN751viG8X8PbQKXja5l4B3%2BaBPz28CRpLbtaBYda4T%2FXey%2BD9SGGLGJSWUHoT28nzIVozOwJU0OIbqNKqIz152dWlnxJtALSOo%2FXDLnyRxEwChvauyK6zapSFV%2FBWRcWL7zmAEoVQPOvNfn7klIMHtD5djiwWq0oCErXSKXmUHtbYyKlubnMzVqcdg%2FpHKpb4XEGpSHkPgmQzU4EqFYAimuOsnqX4RSlHyAPagacmtbfgPcbErVbdNWMEADJrpd9DwGA0v2bIuuPc6grl7mmH5kg%3D%3D" alt="Everforest Logo" style="max-width: 140px; margin-bottom: 24px;" />

      <h2 style="color: #28a745; margin-bottom: 16px;">🌿 密碼重設通知</h2>

      <p style="text-align: left;">親愛的用戶您好 🌱，</p>
      <p style="text-align: left;">我們收到了您重設密碼的請求，請點擊下方按鈕前往設定新密碼：</p>

      <p style="margin: 28px 0;">
        <a href="${resetLink}" style="
          display: inline-block;
          padding: 14px 24px;
          background-color: #28a745;
          color: #fff;
          font-weight: bold;
          text-decoration: none;
          border-radius: 8px;
          font-size: 16px;
        " onmouseover="this.style.backgroundColor='#218838'" onmouseout="this.style.backgroundColor='#28a745'">
          🔐 立即重設密碼
        </a>
      </p>

      <p style="text-align: left; font-size: 13px; color: #999;">
        若按鈕無法點擊，您也可以將以下連結複製至瀏覽器開啟：<br />
        <a href="${resetLink}" style="color: #28a745; word-break: break-all;">若上述按鈕無法點擊，請點我</a>
      </p>

      <p style="text-align: left;">若您並未發出此請求，請放心忽略此封信 💤</p>

      <p style="font-size: 13px; color: #888; text-align: left;">
        此連結將於 <strong>15 分鐘</strong> 後失效，請儘快完成操作。
      </p>

      <p style="text-align: left; font-size: 12px; color: #bbb; margin-top: 32px;">
        🌲 森森不息團隊 🌲 敬上
      </p>

      <p style="font-size: 11px; color: #ccc; margin-top: 40px;">
        © 2025 森森不息 | 本郵件由系統自動發送，請勿直接回覆。
      </p>
    </div>
    `,
    // html: `
    //   <p>您好，</p>
    //   <p>您請求了密碼重設，請點擊以下連結：</p>
    //   <p><a href="${resetLink}">${resetLink}</a></p>
    //   <p>此連結將在 <strong>15 分鐘</strong> 後失效。</p>
    // `,
  };

  await transporter
    .sendMail(mailOptions)
    .then((info) => {
      console.warn("Email 寄出成功：", info.response);
    })
    .catch((error) => {
      console.error("Email 寄送失敗：", error);
    });
};

/**
 * 寄送訂單成功通知信
 */
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");
require("dayjs/locale/zh-tw");

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale("zh-tw");

exports.sendOrderSuccessEmail = async (toEmail, orderList = []) => {
  // 時間格式轉換：將 startDate, endDate 組合成一段格式好的字串
  const formatTaiwanTime = (start, end) => {
    const startFormatted = dayjs(start).tz("Asia/Taipei").format("YYYY/MM/DD (ddd) HH:mm");
    const endFormatted = dayjs(end).tz("Asia/Taipei").format("YYYY/MM/DD (ddd) HH:mm");
    return `${startFormatted} ~ ${endFormatted}`;
  };

  const formattedOrderList = orderList.map((order) => ({
    ...order,
    formattedDate: formatTaiwanTime(order.startDate, order.endDate),
  }));

  const htmlContent = `
<div style="
  font-family: 'Segoe UI', 'Helvetica Neue', sans-serif;
  line-height: 1.8;
  border: 1px solid #d8e4dc;
  border-radius: 16px;
  padding: 32px;
  max-width: 600px;
  margin: 0 auto;
  background-color: #fff0f5;
  text-align: center;
  color: #2c3e50;
">
  <img src="https://firebasestorage.googleapis.com/v0/b/everforest-e0f71.firebasestorage.app/o/%E6%A3%AE%E6%A3%AE%E4%B8%8D%E6%81%AF.png?alt=media&token=9faf1e8f-1759-49c1-b74f-a4e790476166" alt="Everforest Logo" style="max-width: 140px; margin-bottom: 24px;" />

  <h2 style="color: #28a745; margin-bottom: 16px;">🌿 訂單成立通知</h2>

  <p style="text-align: left;">親愛的用戶您好 🌱，</p>
  <p style="text-align: left;">✅ 您已成功預訂以下露營活動：</p>

  <div style="display: inline-block; text-align: left; margin: 16px auto; border: 1px solid #d8e4dc;
  border-radius: 16px; padding: 16px;">
    <ul style="padding-left: 20px; margin: 0;">
      ${formattedOrderList
        .map(
          (order) => `
      <li style="margin-bottom: 12px;">
        <strong>🌲 活動：</strong>${order.activityName}<br />
        <strong>📅 日期：</strong>${order.formattedDate}<br />
        <strong>💰 金額：</strong>${order.amount} 元
      </li>
      `
        )
        .join("")}
    </ul>
  </div>

  <p style="text-align: left;">我們期待與您共度一段美好的自然時光！🧭</p>

  <p style="font-size: 13px; color: #888; text-align: left; margin-top: 32px;">
    💌 若您對訂單有任何疑問，請聯絡客服信箱：<a href="mailto:service@everforest.tw" style="color: #28a745;">service@everforest.tw</a>
  </p>

  <p style="font-size: 12px; color: #bbb; text-align: left; margin-top: 24px;">
    🌳 森森不息團隊敬上 🌳
  </p>

  <p style="font-size: 11px; color: #ccc; margin-top: 40px;">
    © 2025 森森不息 | 本郵件由系統自動發送，請勿直接回覆。
  </p>
</div>
  `;

  const mailOptions = {
    from: `"Everforest_森森不息露營活動平台" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "🔔 露營訂單中心 - 訂單成功通知",
    html: htmlContent,
  };

  await transporter
    .sendMail(mailOptions)
    .then((info) => console.warn("訂單通知信寄出成功：", info.response))
    .catch((error) => console.error("訂單通知信寄送失敗：", error));
};

/**
 * 寄送訂單票券(QRCODE)
 */
exports.sendTicketEmail = async ({ toEmail, orderId, ticketCode, eventTitle, qrImageUrl }) => {
  const mailOptions = {
    from: `"Everforest_森森不息露營活動平台" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "💌 露營活動票券中心-您的活動票券資訊",
    html: `
    <div style="
      font-family: 'Segoe UI', 'Helvetica Neue', sans-serif;
      line-height: 1.8;
      border: 1px solid #eaf4ff;
      border-radius: 16px;
      padding: 32px;
      max-width: 600px;
      margin: 0 auto;
      background-color: #eaf4ff;
      text-align: center;
      color: #5a2b43;
    ">
      <img src="https://firebasestorage.googleapis.com/v0/b/everforest-e0f71.firebasestorage.app/o/%E6%A3%AE%E6%A3%AE%E4%B8%8D%E6%81%AF.png?alt=media&token=9faf1e8f-1759-49c1-b74f-a4e790476166" alt="Everforest Logo" style="max-width: 140px; margin-bottom: 24px;" />

      <h2 style="color: #e75480; margin-bottom: 16px;">🎟️ 您的露營票券已送達！</h2>

      <p style="text-align: left;">親愛的會員您好 🌟，</p>
      <p style="text-align: left;">
        以下是您訂單 <strong>🧾 ${orderId}</strong> 的票券資訊，請妥善保存：
      </p>

      <ul style="text-align: left; padding-left: 20px; margin-top: 16px;">
        <li><strong>🔐 票券代碼：</strong>${ticketCode}</li>
        <li><strong>🏕️ 活動名稱：</strong>${eventTitle}</li>
      </ul>

      <p style="margin: 24px 0;">📷 請攜帶以下 QRCode 入場：</p>
      <img src="${qrImageUrl}" alt="QRCode" style="max-width: 240px; border-radius: 12px; box-shadow: 0 0 8px rgba(0,0,0,0.1);" />

      <p style="font-size: 13px; color: #888; margin-top: 8px;">
        📎 <a href="${qrImageUrl}" style="color: #d63384;">無法顯示時請點我開啟 QRCode</a>
      </p>

      <p style="text-align: left; font-size: 13px; color: #999; margin-top: 24px;">
        若有任何問題，歡迎來信 <a href="mailto:service@everforest.tw" style="color: #e75480;">service@everforest.tw</a>
      </p>

      <p style="text-align: left; font-size: 12px; color: #bbb; margin-top: 28px;">
        🌷 森森不息票券中心 🌷 敬上
      </p>

      <p style="font-size: 11px; color: #ccc; margin-top: 40px;">
        © 2025 森森不息 | 本郵件由系統自動發送，請勿直接回覆。
      </p>
    </div>
    `,
    // html: `
    //   <p>親愛的會員您好，</p>
    //   <p>以下是您訂單 <b>${orderId}</b> 的票券資訊：</p>
    //   <p><b>票券代碼：</b>${ticketCode}</p>
    //   <p><b>活動名稱：</b>${eventTitle}</p>
    //   <p><img src="${qrImageUrl}" alt="QRCode" width="240"/></p>
    //   <p><a href="${qrImageUrl}">若無法顯示請點此開啟 QRCode</a></p>
    // `,
  };

  await transporter
    .sendMail(mailOptions)
    .then((info) => console.warn("票券信件寄出成功：", info.response))
    .catch((error) => console.error("票券信件寄送失敗：", error));
};

/**
 * 寄送活動審核結果通知信
 */
exports.sendEventReviewResultEmail = async ({
  toEmail,
  eventTitle,
  isApproved,
  isAiReview = false,
  reason = "",
}) => {
  const subject = isApproved ? "🎉 活動審核通過通知" : "📝 活動審核退回通知";

  const statusMessage = `
  <p>您提交的活動 <strong>「${eventTitle}」</strong> ${
    isApproved ? "已通過審核，現在已上架至平台了🎊。" : "未通過審核，請根據以下建議修正後重新提交："
  }</p>

  ${
    isAiReview && reason
      ? `
      <hr style="margin: 24px 0; border: none; border-top: 1px dashed #ccc;" />
      <p style="font-weight: bold;">🤖 以下為 AI 審核回饋：</p>
      <div style="margin-top: 12px;">${reason}</div>
      <p style="font-size: 13px; color: #888; margin-top: 24px;">
        📡 <em>本次審核由 Everforest AI 系統自動執行，內容僅供參考，請依照建議優化您的活動內容。</em>
      </p>
      `
      : ""
  }
`;

  // const statusMessage = isApproved
  //   ? `<p>您提交的活動 <strong>「${eventTitle}」</strong> 已通過審核，現在已上架至平台了🎊。</p>

  //   `
  //   : `<p>您提交的活動 <strong>「${eventTitle}」</strong> 未通過審核，請根據以下建議修正後重新提交：</p>
  //      <p style="color: #e74c3c; padding: 12px; background: #fff2f0; border-radius: 8px;">${reason}</p>`;

  const mailOptions = {
    from: `"Everforest_森森不息露營活動平台" <${process.env.EMAIL_USER}>`,
    to: toEmail, //toEmail
    subject,
    html: `
    <div style="
      font-family: 'Segoe UI', 'Helvetica Neue', sans-serif;
      line-height: 1.8;
      border: 1px solid #eaf4ff;
      border-radius: 16px;
      padding: 32px;
      max-width: 600px;
      margin: 0 auto;
      background-color: ${isApproved ? "#f0fff4" : "#fff0f0"};
      text-align: center;
      color: #2c3e50;
    ">
      <img src="https://firebasestorage.googleapis.com/v0/b/everforest-e0f71.firebasestorage.app/o/%E6%A3%AE%E6%A3%AE%E4%B8%8D%E6%81%AF.png?alt=media&token=9faf1e8f-1759-49c1-b74f-a4e790476166" alt="Everforest Logo" style="max-width: 140px; margin-bottom: 24px;" />
      <h2 style="color: ${isApproved ? "#28a745" : "#d63384"}; margin-bottom: 16px;">
        ${isApproved ? "✅🌟🤩🤩 您主辦的露營活動已通過審核！" : "❌⚠️👻👻 您主辦的露營活動審核未通過"}
      </h2>

      ${statusMessage}

      <p style="text-align: left;">若有任何疑問，請來信 <a href="mailto:service@everforest.tw">service@everforest.tw</a></p>

      <p style="text-align: left; font-size: 12px; color: #bbb; margin-top: 24px;">
        森森不息團隊敬上
      </p>

      <p style="font-size: 11px; color: #ccc; margin-top: 40px;">
        © 2025 Everforest | 本郵件由系統自動發送，請勿直接回覆。
      </p>
    </div>
    `,
  };

  await transporter
    .sendMail(mailOptions)
    .then((info) => console.warn("活動審核信件寄出成功：", info.response))
    .catch((error) => console.error("活動審核信件寄送失敗：", error));
};

/**
 * 寄送活動下架申請審核結果通知信
 */
exports.sendUnpublishReviewResultEmail = async ({
  toEmail,
  eventId,
  eventTitle,
  isApproved,
  reason = "", // 主辦方下架理由
  note = "", // 管理員審核備註
  startTime,
  endTime,
  registrationOpenTime,
  registrationCloseTime,
  hasOrder = false,
}) => {
  const subject = isApproved ? "✅ 活動下架申請審核通過" : "❌  活動下架申請被退回";

  const dateBlock = `
    <div style="margin: 24px 0; text-align: left;">
      <strong>📅 活動資訊：</strong><br />
      🆔 活動 ID：${eventId}<br />
      🏕️ 活動時間：${formatDateRange(startTime, endTime)}<br />
      📋 報名期間：${formatDateRange(registrationOpenTime, registrationCloseTime)}
    </div>
  `;

  const refundReminder = isApproved
    ? hasOrder
      ? `
        <div style="text-align: left; margin-top: 24px; color: #d63384;">
          <strong>⚠️ 提醒：</strong><br>
          本活動已有報名紀錄，請盡速聯繫報名者，並依規定處理退款事宜。<br>
          系統已將活動狀態設為「退款處理中」。
        </div>
      `
      : `
        <div style="text-align: left; margin-top: 24px; color: #666;">
          本活動無任何報名紀錄，系統已自動完成下架處理 ✅。
        </div>
      `
    : "";

  const statusMessage = `
    <p>您申請下架的活動 <strong>「${eventTitle}」</strong> ${
      isApproved
        ? "已通過審核，系統已依情況處理後續退款或下架作業。"
        : "尚未通過審核，請參考以下建議後重新確認。"
    }</p>
    ${
      reason
        ? `
      <div style="margin-top: 16px; text-align: left;">
        <strong>📌 主辦方下架理由：</strong><br />
        ${reason}
      </div>`
        : ""
    }
    ${
      note
        ? `
      <div style="margin-top: 16px; text-align: left; color: #444;">
        <strong>🗒️ 平台審核備註：</strong><br />
        ${note}
      </div>`
        : ""
    }
  `;

  const html = `
    <div style="
      font-family: 'Segoe UI', 'Helvetica Neue', sans-serif;
      line-height: 1.8;
      border: 1px solid #eaf4ff;
      border-radius: 16px;
      padding: 32px;
      max-width: 600px;
      margin: 0 auto;
      background-color: ${isApproved ? "#f0fff4" : "#fff0f0"};
      text-align: center;
      color: #2c3e50;
    ">
      <img src="https://i.postimg.cc/pXqnm9rf/everforest-logo.png" alt="Everforest Logo"
        style="max-width: 140px; margin-bottom: 24px;" />
      <h2 style="color: ${isApproved ? "#28a745" : "#d63384"}; margin-bottom: 16px;">
        ${isApproved ? "✅ 活動下架審核通過" : "❌ 下架申請未通過"}
      </h2>
      ${statusMessage}
      ${dateBlock}
      ${refundReminder}
      <p style="text-align: left;">若有任何疑問，歡迎來信 <a href="mailto:service@everforest.tw">service@everforest.tw</a></p>
      <p style="text-align: left; font-size: 12px; color: #bbb; margin-top: 24px;">
        森森不息團隊敬上
      </p>
      <p style="font-size: 11px; color: #ccc; margin-top: 40px;">
        © 2025 Everforest | 本郵件由系統自動發送，請勿直接回覆。
      </p>
    </div>
  `;

  const mailOptions = {
    from: `"Everforest_森森不息露營活動平台" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject,
    html,
  };

  await transporter
    .sendMail(mailOptions)
    .then((info) => console.warn("下架審核信寄出成功：", info.response))
    .catch((error) => console.error("下架審核信寄送失敗：", error));
};

/**
 * 格式化日期區間
 */
const formatDateRange = (start, end) => {
  const dayjs = require("dayjs");
  const utc = require("dayjs/plugin/utc");
  const timezone = require("dayjs/plugin/timezone");
  dayjs.extend(utc);
  dayjs.extend(timezone);

  const s = dayjs(start).tz("Asia/Taipei").format("YYYY/MM/DD HH:mm");
  const e = dayjs(end).tz("Asia/Taipei").format("YYYY/MM/DD HH:mm");
  return `${s} ~ ${e}`;
};

/**
 * 寄送活動取消通知信（給報名者）
 */
exports.sendEventCancelledNoticeEmail = async ({
  toEmail,
  eventId,
  eventTitle,
  startTime,
  endTime,
  reason = "因應氣候不佳以及土石流嚴重的因素，為了安全起見，取消該露營活動",
  refundInfo = "平台將於 3–5 個工作天內完成退款程序。",
}) => {
  const subject = "📢 活動取消通知：退款處理中";

  const formattedTime =
    dayjs(startTime).tz("Asia/Taipei").format("YYYY/MM/DD (ddd)") +
    " ~ " +
    dayjs(endTime).tz("Asia/Taipei").format("YYYY/MM/DD (ddd)");

  const html = `
  <div style="
    font-family: 'Segoe UI', 'Helvetica Neue', sans-serif;
    line-height: 1.8;
    border: 1px solid #ffe0e0;
    border-radius: 16px;
    padding: 32px;
    max-width: 600px;
    margin: 0 auto;
    background-color: #fff7f7;
    text-align: center;
    color: #5a2b43;
  ">
    <img src="https://i.postimg.cc/pXqnm9rf/everforest-logo.png" alt="Everforest Logo" style="max-width: 140px; margin-bottom: 24px;" />
    <h2 style="color: #e74c3c;">📢 活動取消通知</h2>

    <p style="text-align: left;">親愛的用戶您好，</p>
    <p style="text-align: left;">
      很抱歉通知您，您所報名的活動 <strong>「${eventTitle}」</strong><br />
      活動時間：${formattedTime}<br />
      活動 ID：<code>${eventId}</code><br />
      已由主辦方申請取消，並經平台審核後確認不再舉辦。
    </p>

    <p style="text-align: left; margin-top: 16px;">
      📄 <strong>取消原因：</strong><br />
      ${reason}
    </p>

    <p style="text-align: left; margin-top: 16px;">
      💸 <strong>退款說明：</strong><br />
      ${refundInfo}
    </p>

    <p style="text-align: left; font-size: 13px; color: #888; margin-top: 24px;">
      若有任何疑問，歡迎來信 <a href="mailto:service@everforest.tw">service@everforest.tw</a>
    </p>

    <p style="text-align: left; font-size: 12px; color: #bbb; margin-top: 24px;">
      🌲 森森不息團隊 敬上
    </p>

    <p style="font-size: 11px; color: #ccc; margin-top: 40px;">
      © 2025 Everforest | 本郵件由系統自動發送，請勿直接回覆。
    </p>
  </div>
  `;

  const mailOptions = {
    from: `"Everforest_森森不息露營活動平台" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject,
    html,
  };

  await transporter
    .sendMail(mailOptions)
    .then((info) => console.warn("報名者取消通知信寄出成功：", info.response))
    .catch((error) => console.error("報名者取消通知信寄送失敗：", error));
};
