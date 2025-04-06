/*
1. 驗證是否登入  ==> isAuth
2. RBAC（Role-Based Access Control）角色權限控制==>restrictTo([member, admin , host])
*/
const { verifyJWT } = require("../utils/jwtUtils");
const appError = require("../utils/appError");

//isAuth => 驗證是否已登入middleware
const isAuth = async (req, res, next) => {
  try {
    //確認請求中是否夾帶token 並取出token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer")) {
      return next(appError(401, "尚未登入"));
    }

    //取出token
    const token = authHeader.split(" ")[1];

    //驗證token
    const decoded = await verifyJWT(token);

    //手動把 解碼後的 payload 存進 req.user
    req.user = decoded;
    next();
  } catch (error) {
    next(error);
  }
};

// restrictTo => 限制角色權限
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(401, "尚未登入");
    }

    if (!roles.includes(req.user.role)) {
      return next(appError(403, "沒有權限"));
    }

    next();
  };
};
/*
//角色權限用法
// 所有人登入後都能看
router.get("/me", authenticate, (req, res) => {
  res.json({ message: "歡迎你", user: req.user });
});

// 只有 admin 能用
router.get("/admin", authenticate, restrictTo("admin"), (req, res) => {
  res.json({ message: "只有 admin 可以看到這頁" });
});

// host 或 admin 都可以用
router.get("/host-area", authenticate, restrictTo("host", "admin"), (req, res) => {
  res.json({ message: "這是 host 和 admin 的區域" });
});
*/

module.exports = {
  isAuth,
  restrictTo,
};
