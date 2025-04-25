const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "EventNotice",
  tableName: "EVENT_NOTICE",
  columns: {
    //     Table EVENT_NOTICE {
    //   id uuid [primary key, not null]
    //   event_info_id uuid [not null, ref: > EVENT_INFO.id, note: '關聯活動表單']
    //   type varchar(20) [default: '行前提醒', note: "提醒類型(比較彈性): 行前提醒 寵物須知 ex..交通資訊?"]
    //   content text [not null, note: '行前提醒內容']
    // }
    id: {
      type: "uuid",
      primary: true,
      nullable: false,
      generated: "uuid",
    },
    event_info_id: {
      type: "uuid",
      nullable: false,
      // foreignKey: true,
      // reference: "EVENT_INFO.id",
    },
    type: {
      type: "varchar",
      length: 20,
      default: "行前提醒",
      nullable: false,
    },
    content: {
      type: "text",
      nullable: false,
    },
    created_at: {
      type: "timestamptz",
      default: () => "CURRENT_TIMESTAMP",
      nullable: false,
    },
    updated_at: {
      type: "timestamptz",
      default: () => "CURRENT_TIMESTAMP",
      onUpdate: () => "CURRENT_TIMESTAMP",
      nullable: false,
    },
  },
  relationIds: {
    eventBox: {
      type: "many-to-one",
      target: "EventInfo",
      joinColumn: {
        name: "event_info_id",
      },
      inverseSide: "eventNoticeBox",
      onDelete: "CASCADE",
    },
  },
});
