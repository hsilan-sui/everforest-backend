/*
1. RBAC（Role-Based Access Control）角色權限控制==>restrictTo([member, admin , host])
*/

const appError = require("../utils/appError");

// restrictTo => 限制角色權限
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(appError(401, "尚未登入"));
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
  restrictTo,
};
