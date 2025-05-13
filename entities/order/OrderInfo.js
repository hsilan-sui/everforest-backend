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
    merchantTradeNo: {
      type: "varchar",
      length: 20,
      unique: true,
      nullable: true,
    },
    status: {
      type: "enum",
      enum: ["未付款", "付款中", "已付款", "退款中", "已退款"],
      default: "未付款",
    },
    quantity: {
      type: "int",
      default: 1,
    },
    total_price: {
      type: "int",
      nullable: false,
    },
    cancelled_at: {
      type: "timestamptz",
      nullable: true,
    },
    cancellation_reason: {
      type: "text",
      nullable: true,
    },
    book_at: {
      type: "timestamptz",
      nullable: false,
    },
    created_at: {
      type: "timestamptz",
      default: () => "CURRENT_TIMESTAMP",
      nullable: false,
    },
  },
  relations: {
    memberBox: {
      type: "many-to-one",
      target: "MemberInfo",
      joinColumn: { name: "member_info_id" },
      onDelete: "CASCADE",
    },
    eventPlanBox: {
      type: "many-to-one",
      target: "EventPlan",
      joinColumn: { name: "event_plan_id" },
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
