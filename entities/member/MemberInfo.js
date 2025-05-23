const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "MemberInfo",
  tableName: "MEMBER_INFO",
  columns: {
    id: {
      type: "uuid",
      primary: true,
      nullable: false,
      generated: "uuid",
    },
    email: {
      type: "varchar",
      length: 256,
      nullable: false,
      unique: true,
    },
    username: {
      type: "varchar",
      length: 16,
      nullable: false,
      unique: true,
    },
    firstname: {
      type: "varchar",
      length: 16,
      nullable: false,
    },
    lastname: {
      type: "varchar",
      length: 16,
      nullable: false,
    },
    phone: {
      type: "varchar",
      length: 72,
      nullable: true,
      unique: true,
    },
    password: {
      type: "varchar",
      length: 256,
      select: false, //預設查詢不會帶出 password
      nullable: true, //註冊密碼，僅 local 登入者會有
    },
    role: {
      type: "varchar",
      enum: ["member", "host", "admin"],
      default: "member", //預設都是會員
    },
    photo_url: {
      type: "varchar",
      length: 1024,
      nullable: true, //預設是可以null
    },
    birth: {
      type: "date",
      nullable: true,
    },
    gender: {
      type: "enum",
      enum: ["male", "female", "other"],
      nullable: true,
    },
    is_verified: {
      type: "boolean",
      default: false,
    },
    email_verified_at: {
      type: "timestamptz",
      nullable: true,
    },
    email_verify_token: {
      type: "varchar",
      length: 200,
      nullable: true,
    },
    email_token_expired_at: {
      type: "timestamptz",
      nullable: true,
    },
    primary_provider: {
      type: "enum",
      enum: ["local", "google"],
      default: "local", //預設本地登入
    },
    reset_password_token: {
      //用 bcrypt.hash() 產生 儲存哈希後的 token
      type: "varchar",
      length: 256,
      nullable: true,
    },
    reset_password_expired_at: {
      //	通常 15–30 分鐘即可 設定 token 過期時間
      type: "timestamptz",
      nullable: true,
    },
    created_at: {
      type: "timestamptz",
      default: () => "CURRENT_TIMESTAMP",
      nullable: false,
    },
    updated_at: {
      type: "timestamptz",
      default: () => "CURRENT_TIMESTAMP",
      onUpdate: "CURRENT_TIMESTAMP",
      nullable: false,
    },
  },
  relations: {
    /*
    relations 裡的 key（例如hostBox）
    是你在 JavaScript / TypeORM 中存取關聯時用的「變數名稱」，
    ！！！不是資料表名稱、不是 Entity 名稱、也不是資料庫欄位名稱！！！
    這層的key是關聯的變數名稱，小寫命名慣例 & 作為 inverseSide 用*/
    hostBox: {
      type: "one-to-one",
      target: "HostInfo",
      mappedBy: "memberBox", // 與target:HostInfo 中relations關聯變數 `memberBox` 對應
      cascade: true,
    },
    /*小寫命名慣例 & 作為 inverseSide 用*/
    memberAuthProviderBox: {
      type: "one-to-many",
      target: "MemberAuthProvider",
      inverseSide: "memberBox", // 與target:MemberAuthProvider 中relations關聯變數 `memberBox` 對應
      cascade: true,
    },
    eventCommentBox: {
      type: "one-to-many",
      target: "EventComment",
      inverseSide: "memberBox", // 與target:EventComment 中relations關聯變數 `memberBox` 對應
      cascade: true,
    },

    orderBox: {
      type: "one-to-many",
      target: "OrderInfo",
      mappedBy: "memberBox", // 對應 OrderInfo 的 memberBox
    },
  },
});
