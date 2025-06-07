const { dataSource } = require("../db/data-source");
const appError = require("../utils/appError");
const logger = require("../utils/logger")("member");
const { isNotValidString, isValidURL, isValidDate } = require("../utils/validUtils");
const formidable = require("formidable");
const { uploadImageFile, ALLOWED_FILE_TYPES } = require("../utils/uploadImage");

const memberController = {
  async getProfile(req, res, next) {
    const userId = req.user.id;
    const memberRepo = dataSource.getRepository("MemberInfo");
    const existMember = await memberRepo.findOne({
      where: {
        id: userId,
      },
    });

    if (!existMember) {
      logger.warn("找不到會員資料");
      return next(appError(400, "找不到會員資料"));
    }

    return res.status(200).json({
      status: "success",
      message: "會員取得成功",
      data: {
        member: {
          id: existMember.id,
          firstname: existMember.firstname,
          lastname: existMember.lastname,
          username: existMember.username,
          birth: existMember.birth,
          gender: existMember.gender,
          phone: existMember.phone,
          email: existMember.email,
          role: existMember.role,
          photo_url: existMember.photo_url,
          is_verified: existMember.is_verified,
        },
      },
    });
  },

  async updateProfile(req, res, next) {
    const userId = req.user.id;
    const { firstname, lastname, gender, birth, photo_url } = req.body;
    const memberInfo = dataSource.getRepository("MemberInfo");
    const existMember = await memberInfo.findOne({
      where: {
        id: userId,
      },
    });

    if (!existMember) {
      logger.warn("找不到會員資料");
      return next(appError(400, "找不到會員資料"));
    }

    if (
      (firstname && isNotValidString(firstname)) ||
      (lastname && isNotValidString(lastname)) ||
      (gender && isNotValidString(gender)) ||
      (birth && !isValidDate(birth)) ||
      (photo_url && !isValidURL(photo_url))
    ) {
      return next(appError(400, "欄位未填寫正確"));
    }

    if (firstname) existMember.firstname = firstname;
    if (lastname) existMember.lastname = lastname;
    if (gender) existMember.gender = gender;
    if (birth) existMember.birth = new Date(birth); // 確保 birth 被轉換為 Date 類型
    if (photo_url) existMember.photo_url = photo_url;

    await memberInfo.save(existMember);

    return res.status(200).json({
      status: "success",
      message: "會員資料更新成功",
      data: {
        member: {
          id: existMember.id,
          firstname: existMember.firstname,
          lastname: existMember.lastname,
          username: existMember.username,
          birth: existMember.birth,
          gender: existMember.gender,
          phone: existMember.phone,
          email: existMember.email,
          role: existMember.role,
          photo_url: existMember.photo_url,
          is_verified: existMember.is_verified,
        },
      },
    });
  },

  async editMemberAvatar(req, res, next) {
    // 處理前端的檔案上傳請求
    const form = formidable.formidable({
      multiple: false,
    });

    // 解析來自前端的請求
    const [, files] = await form.parse(req);

    // 檢查是否有上傳檔案
    const imageFile = files.file?.[0];
    if (!imageFile) {
      return next(appError(400, "請上傳圖片"));
    }

    if (!ALLOWED_FILE_TYPES[imageFile.mimetype]) {
      return next(appError(400, "圖片格式錯誤，僅支援 JPG、PNG 格式"));
    }

    // 上傳圖片並獲取圖片 URL
    const imageUrl = await uploadImageFile(imageFile, "member-avatar");

    const memberRepo = dataSource.getRepository("MemberInfo");
    const updateMember = await memberRepo.update({ id: req.user.id }, { photo_url: imageUrl });

    if (updateMember.affected === 0) {
      return next(appError(404, "會員資料不存在"));
    }
    return res.status(200).json({
      status: "success",
      message: "會員頭貼更新成功",
      data: {
        avatar_url: imageUrl,
      },
    });
  },
};

module.exports = memberController;
