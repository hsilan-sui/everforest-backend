const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "MemberAuthProvider",
  tableName: "MEMBER_AUTH_PROVIDER",
  columns: {
    id: {
      type: "uuid",
      primary: true,
      nullable: false,
      generated: "uuid",
    },
    member_info_id: {
      //外鍵
      type: "uuid",
      nullable: false,
    },
    provider: {
      type: "enum",
      enum: ["local", "google"],
      nullable: false,
    },
    provider_sub: {
      //第三方平台提供的唯一 ID
      type: "varchar",
      length: 128,
      nullable: false,
    },
    email: {
      type: "varchar",
      length: 256,
      nullable: true,
    },
    name: {
      type: "varchar",
      length: 64,
      nullable: true,
    },
    picture_url: {
      type: "varchar",
      length: 1024,
      nullable: true,
    },
    email_verified: {
      type: "boolean",
      default: false,
    },
    created_at: {
      type: "timestamptz",
      default: () => "CURRENT_TIMESTAMP",
      nullable: false,
    },
  },
  uniques: [
    {
      columns: ["provider", "provider_sub"],
    },
  ],
  relations: {
    /*
    relations 裡的 key（例如authProviders）
    是你在 JavaScript / TypeORM 中存取關聯時用的「變數名稱」，
    ！！！不是資料表名稱、不是 Entity 名稱、也不是資料庫欄位名稱！！！
    這層的key是關聯的變數名稱，小寫命名慣例 & 作為 inverseSide 用*/
    memberInfo: {
      type: "many-to-one",
      target: "MemberInfo",
      joinColumn: {
        name: "member_info_id",
      },
      nullable: false,
      onDelete: "CASCADE",
    },
  },
});
