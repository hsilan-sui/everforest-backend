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
    },
    status: {
      type: "enum",
      enum: ["Unpaid", "Paying", "Paid", "Refunding", "Refunded", "Cancelled"],
      default: "Unpaid",
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
    merchantTradeNo: {
      type: "varchar",
      length: 20,
      unique: true,
      nullable: true,
    },
    cancelled_at: {
      type: "timestamptz",
      nullable: true,
    },
    cancellation_reason: {
      type: "text",
      nullable: true,
    },
    event_addons: {
      type: "jsonb",
      nullable: true,
      default: () => "'[]'",
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
  },
  relations: {
    memberBox: {
      type: "many-to-one",
      target: "MemberInfo", // 目標 Entity 名稱
      inverseSide: "orderBox", // 在 MemberInfo 裡對應的欄位名（反向關聯）
      joinColumn: {
        name: "member_info_id", // 自己的關聯欄位
      },
      onDelete: "CASCADE",
    },
    eventPlanBox: {
      type: "many-to-one",
      target: "EventPlan",
      inverseSide: "orderBox",
      joinColumn: {
        name: "event_plan_id",
      },
      onDelete: "CASCADE",
    },
    orderPayBox: {
      type: "one-to-one",
      target: "OrderPay",
      inverseSide: "orderInfoBox",
      cascade: true,
    },
    orderTicketBox: {
      type: "one-to-many",
      target: "OrderTicket",
      inverseSide: "orderInfoBox",
      cascade: true,
    },
  },
});
