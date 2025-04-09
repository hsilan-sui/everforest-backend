const { dataSource } = require("../db/data-source");
const { isUndefined, isNotValidString } = require("../utils/validUtils");
const appError = require("../utils/appError");
const logger = require("../utils/logger")("Host");

const hostController = {
  //創建主辦方資料
  async postHostProfile(req, res, next) {
    //前端請求的body內容
    const { name, country_code, phone, email, description, images } = req.body;
    logger.warn(`host創建資料 ${JSON.stringify(req.body)}`);

    const member_id = req.user.id;
    const role = req.user.role;

    if (!member_id || !role) return next(appError(401, "請先登入會員"));

    if (
      isUndefined(name) ||
      isNotValidString(name) ||
      isUndefined(phone) ||
      isNotValidString(phone) ||
      isUndefined(country_code) ||
      isNotValidString(country_code) ||
      isUndefined(email) ||
      isNotValidString(email)
    ) {
      return next(appError(400, "請填寫主辦方名稱、電話與 Email 等必填欄位"));
    }

    const hostRepo = dataSource.getRepository("Host");
    const memberRepo = dataSource.getRepository("Member");
    const imageRepo = dataSource.getRepository("Image");

    const existingHost = await hostRepo.findOneBy({ member_id });
    if (existingHost) return next(appError(400, "您已經創建過主辦方資料"));

    // 建立主辦方資料物件
    const newHost = hostRepo.create({
      member_id,
      name,
      phone,
      email,
      description: description || null,
      country_code,
    });
    // 將該物件存入資料庫
    const savedHost = await hostRepo.save(newHost);
    logger.info("新的主辦方", savedHost);

    // 2. 儲存圖片
    let savedImages = [];
    if (Array.isArray(images) && images.length > 0) {
      const imageEntities = images.map((img) =>
        imageRepo.create({
          owner_id: newHost.id,
          owner_type: "host",
          image_url: img.image_url,
          image_type: img.image_type || null,
          description: img.description || null,
          sort_order: img.sort_order || 0,
        })
      );
      savedImages = await imageRepo.save(imageEntities);
    }

    // 3. 更新會員角色為 host
    const updateRole = await memberRepo.update(member_id, { role: "host" });
    logger.info("更改角色", updateRole);

    // 4. 撈回會員資料
    const member = await memberRepo.findOneBy({ id: member_id });

    return res.status(201).json({
      status: "success",
      message: "主辦方資料建立成功",
      data: {
        member: {
          id: member.id,
          firstname: member.firstname,
          lastname: member.lastname,
          email: member.email,
          role: "host",
        },
        host: newHost,
        images: savedImages,
      },
    });
  },

  //取得主辦方資料
  async getHostProfile(req, res, next) {
    const member_id = req.user.id;

    if (!member_id) return next(appError(401, "請先登入會員"));

    const hostRepo = dataSource.getRepository("Host");
    const imageRepo = dataSource.getRepository("Image");
    const memberRepo = dataSource.getRepository("Member");
    const host = await hostRepo.findOneBy({ member_id });
    if (!host) return next(appError(404, "尚未建立主辦方資料"));

    const images = await imageRepo.find({
      where: { owner_id: host.id, owner_type: "host" },
      order: { sort_order: "ASC" },
    });

    const member = await memberRepo.findOneBy({ id: member_id });

    return res.status(200).json({
      status: "success",
      message: "取得主辦方資料成功",
      data: {
        member: {
          id: member.id,
          firstname: member.firstname,
          lastname: member.lastname,
          email: member.email,
          role: member.role,
        },
        host,
        images,
      },
    });
  },

  //修改主辦方資料
  async updateHostProfile(req, res, next) {
    //有經過isAuth中介 可以取得req.user資料
    const member_id = req.user.id;

    if (!member_id) return next(appError(401, "請先登入會員"));

    const { name, country_code, phone, email, description, images } = req.body;

    if (
      isUndefined(name) ||
      isNotValidString(name) ||
      isUndefined(phone) ||
      isNotValidString(phone) ||
      isUndefined(country_code) ||
      isNotValidString(country_code) ||
      isUndefined(email) ||
      isNotValidString(email)
    ) {
      return next(appError(400, "欄位填寫錯誤"));
    }

    const hostRepo = dataSource.getRepository("Host");
    const imageRepo = dataSource.getRepository("Image");

    const findHost = await hostRepo.findOneBy({ member_id });

    logger.info("host是", findHost);

    if (!findHost) {
      return next(appError(404, "尚未建立主辦方資料"));
    }

    //已確定有該主辦方
    findHost.name = name || findHost.name;
    findHost.country_code = country_code || findHost.country_code;
    findHost.phone = phone || findHost.phone;
    findHost.email = email || findHost.email;
    findHost.description = description ?? findHost.description;
    const savedHost = await hostRepo.save(findHost);

    logger.info("已儲存更新的host資料", savedHost);

    // 如果有圖片，先刪除舊的再儲存新的（簡單做法）
    let updatedImages = [];
    if (Array.isArray(images)) {
      await imageRepo.delete({ owner_id: findHost.id, owner_type: "host" });

      const imageEntities = images.map((img) =>
        imageRepo.create({
          owner_id: findHost.id,
          owner_type: "host",
          image_url: img.image_url,
          image_type: img.image_type || null,
          description: img.description || null,
          sort_order: img.sort_order || 0,
        })
      );
      updatedImages = await imageRepo.save(imageEntities);
    }

    return res.status(200).json({
      status: "success",
      message: "主辦方資料已更新",
      data: {
        host: findHost,
        images: updatedImages,
      },
    });
  },
};

module.exports = hostController;
