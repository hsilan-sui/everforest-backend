const { verifyJWT } = require("../utils/jwtUtils");
const appError = require("../utils/appError");

//驗證是否登入（從 cookie 中讀取 access_token）
const checkAuth = async (req, res, next) => {
  //檢查前端請求挾帶的cookie中的短效token
  const token = req.cookies.access_token;
  console.warn("req.cookies", req.cookies);
  if (!token) {
    return next(appError(401, "請先登入"));
  }

  try {
    const decoded = await verifyJWT(token);

    if (!decoded.id || !decoded.role) {
      return next(appError(401, "登入資訊不完整，請重新登入"));
    }

    req.user = decoded;
    console.warn("req.user", req.user);
    next();
  } catch (error) {
    return next(error); // 讓錯誤走到全域錯誤處理
  }
};

module.exports = checkAuth;
