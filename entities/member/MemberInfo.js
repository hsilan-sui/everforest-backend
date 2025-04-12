const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "Member",
  tableName: "MEMBER",
  columns: {
    id: {
      type: "uuid",
      primary: true,
      generated: "uuid",
      nullable: false,
    },
    email: {
      type: "varchar",
      length: 32,
      nullable: false,
      unique: true,
    },
    firstname: {
      type: "varchar",
      length: 50,
      nullable: false,
    },
    lastname: {
      type: "varchar",
      length: 50,
      nullable: false,
    },
    phone: {
      type: "varchar",
      length: 15,
      nullable: true,
      unique: true,
    },
    country_code: {
      type: "varchar",
      length: 8,
      nullable: true,
      default: "+886",
    },
    provider: {
      type: "varchar",
      length: 20,
      default: "local",
    },
    password: {
      type: "varchar",
      length: 72,
      select: false, //預設查詢不會帶出 password
      nullable: true,
    },
    role: {
      type: "varchar",
      length: 20,
      default: "member",
    },
    is_verified: {
      type: "boolean",
      default: false,
    },
    email_verified_at: {
      type: "timestamptz",
      nullable: true,
    },
    mobile_number: {
      type: "varchar",
      length: 15,
      nullable: true,
    },
    google_sub: {
      type: "varchar",
      length: 64,
      unique: true,
      nullable: true,
    },
    birth: {
      type: "date",
      nullable: true,
    },
    nickname: {
      type: "varchar",
      length: 48,
      nullable: true,
    },
    gender: {
      type: "enum",
      enum: ["male", "female", "other"],
      nullable: true,
    },
    email_verify_token: {
      type: "varchar",
      length: 128,
      nullable: true,
    },
    email_token_expired_at: {
      type: "timestamptz",
      nullable: true,
    },
    created_at: {
      type: "timestamptz",
      default: () => "CURRENT_TIMESTAMP",
    },
    updated_at: {
      type: "timestamptz",
      default: () => "CURRENT_TIMESTAMP",
    },
  },
});
