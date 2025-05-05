const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "OrderInfo",
  tableName: "ORDER_INFO",
  columns: {
    id: {
      type: "uuid",
      primary: true,
      nullable: false,
      generated: "uuid",
    },

    member_info_id: {
      type: "uuid",
      nullable: false,
    },
    event_plan_id: {
      type: "uuid",
      nullable: false,
      unique: true,
    },

    quantity: {
      type: "integer",
      default: () => "1",
      nullable: false,
    },

    total_price: {
      type: "integer",
      nullable: false,
    },

    book_at: {
      type: "timestamptz",
      default: () => "CURRENT_TIMESTAMP",
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
      onUpdate: "CURRENT_TIMESTAMP",
      nullable: false,
    },

    relations: {
      //訂單活動關聯
      eventBox: {
        target: "EventInfo",
        type: "one-to-one",
        inverseSide: "orderBox", //關聯的table(me)
        joinColumn: {
          name: "event_plan_id", //自己table關聯欄位
        },
      },
    },
  },
});
