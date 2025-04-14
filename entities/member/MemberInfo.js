const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "MemberInfo",
  tableName: "MEMBER_INFO",
  columns: {
    id: {
      type: "uuid",
      primary: true,
      generated: "uuid",
      nullable: false,
    },
    email: {
      type: "varchar",
      length: 256,
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
    username: {
      type: "varchar",
      length: 16,
      nullable: false,
    },
    password: {
      type: "varchar",
      length: 256,
      select: false, //預設查詢不會帶出 password
      nullable: true, //搭配provider判斷是否為第三方登入
    },
    phone: {
      type: "varchar",
      length: 72,
      nullable: true,
      unique: true,
    },
    provider: {
      type: "varchar",
      length: 20,
      default: "local", //預設本地登入
    },
    role: {
      type: "varchar",
      length: 20,
      default: "member", //預設都是會員
    },
    photo_url: {
      type: "varchar",
      length: 1024,
      nullable: true, //預設是可以null
    },
    created_at: {
      type: "timestamptz",
      default: () => "CURRENT_TIMESTAMP",
    },
    updated_at: {
      type: "timestamptz",
      default: () => "CURRENT_TIMESTAMP",
    },
    birth: {
      type: "date",
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
    google_sub: {
      type: "varchar",
      length: 64,
      unique: true,
      nullable: true,
    },
    gender: {
      type: "enum",
      enum: ["male", "female", "other"],
      nullable: true,
    },
    email_verify_token: {
      type: "varchar",
      length: 1024,
      nullable: true,
    },
    email_token_expired_at: {
      type: "timestamptz",
      nullable: true,
    },
  },
});
