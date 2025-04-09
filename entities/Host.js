const { EntitySchema } = require("typeorm");
/**
 * 與會員資料表的關聯
 */
module.exports = new EntitySchema({
  name: "Host",
  tableName: "HOST",
  columns: {
    id: {
      type: "uuid",
      primary: true,
      generated: "uuid",
      nullable: false,
    },
    member_id: {
      //外鍵
      type: "uuid",
      unique: true,
      nullable: false,
    },
    name: {
      //'主辦方單位名稱'
      type: "varchar",
      length: 100,
      nullable: false,
    },
    description: {
      //主辦單位簡介
      type: "text",
      nullable: true,
    },
    verification_status: {
      type: "enum",
      enum: ["已認證", "未認證"],
      default: "未認證",
    },

    country_code: {
      type: "varchar",
      length: 8,
      nullable: true,
      default: "+886",
    },
    phone: {
      type: "varchar",
      length: 15,
      nullable: false,
      unique: true,
    },
    email: {
      type: "varchar",
      length: 100,
      nullable: false,
      unique: true,
    },
    created_at: {
      type: "timestamptz",
      createDate: true,
    },
    updated_at: {
      type: "timestamptz",
      updateDate: true,
    },
  },
  //relations
  relations: {
    Member: {
      target: "Member",
      type: "one-to-one",
      //// 對應上方的 Member Entity 名稱

      joinColumn: {
        name: "member_id", //// 這會讓 member_id 自動作為 FK 欄位
        referenceColumnName: "id",
        //如果沒有指定 foreignKeyConstraintName，TypeORM 會自動產生隨機名稱，未來就難以管理
        foreignKeyConstraintName: "host_member_id_fk",
        //SQL 層級的設定，用來設定「這條外鍵的約束名稱 (constraint name)
        // ALTER TABLE COACH
        // ADD CONSTRAINT coach_user_id_fk
        // FOREIGN KEY (user_id) REFERENCES USER(id);
        // user_id 只能參考 USER 表的 id
        // 不能隨便刪除 USER.id，否則會影響 COACH.user_id
        // 這條約束的名稱是 "coach_user_id_fk"
      },
      onDelete: "CASCADE",
    },
  },
});

/*
對應資料表
//活動主辦方
Table HOST_主辦方 {
  id uuid [pk, not null, note: '主辦方 ID']
  member_id uuid [unique, not null, ref: > MEMBER_會員資料表.id, note: '對應的會員帳號 ID']
  name varchar(100) [not null, note: '主辦方單位名稱']
  description text [note: '主辦方簡介']
  //image_url varchar(255) [note: '主辦方封面圖片']
  verification_status enum('已認證', '未認證') [default: '未認證', note: '主辦方審核狀態']
  phone varchar(15) [not null, unique, note: '單位電話']
  email varchar(15) [not null, unique, note: '單位email'] 
  created_at timestamptz
  updated_at timestamptz
}

*/
