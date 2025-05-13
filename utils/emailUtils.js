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
