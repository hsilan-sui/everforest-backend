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
    from: `"露營活動平台" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "密碼重設通知",
    html: `
      <p>您好，</p>
      <p>您請求了密碼重設，請點擊以下連結：</p>
      <p><a href="${resetLink}">${resetLink}</a></p>
      <p>此連結將在 <strong>15 分鐘</strong> 後失效。</p>
    `,
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
exports.sendOrderSuccessEmail = async (toEmail, orderList = []) => {
  const htmlContent = `
    <p>您好，</p>
    <p>您已成功預訂以下露營活動：</p>
    <ul>
      ${orderList
        .map(
          (order) => `
        <li>
          活動：${order.activityName}<br/>
          日期：${order.date}<br/>
          金額：${order.amount} 元
        </li>
      `
        )
        .join("")}
    </ul>
    <p>我們期待與您一同共度美好時光！</p>
  `;

  const mailOptions = {
    from: `"露營活動平台" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "森森不息 - 訂單成功通知",
    html: htmlContent,
  };

  await transporter
    .sendMail(mailOptions)
    .then((info) => console.warn("訂單通知信寄出成功：", info.response))
    .catch((error) => console.error("訂單通知信寄送失敗：", error));
};
