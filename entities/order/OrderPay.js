const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "OrderPay",
  tableName: "ORDER_PAY",
  columns: {
    id: {
      type: "uuid",
      primary: true,
      generated: "uuid",
    },
    method: {
      type: "varchar",
      length: 20,
      nullable: false,
    },
    gateway: {
      type: "enum",
      enum: ["ecpay", "newebpay", "linepay"],
      nullable: false,
    },
    amount: {
      type: "int",
      nullable: false,
    },
    transaction_id: {
      type: "varchar",
      length: 128,
      nullable: true,
      unique: true,
    },
    paid_at: {
      type: "timestamptz",
      nullable: true,
    },
    refund_at: {
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
      onUpdate: "CURRENT_TIMESTAMP",
    },
  },
  relations: {
    orderInfoBox: {
      type: "one-to-one",
      target: "OrderInfo",
      joinColumn: { name: "order_info_id" },
      onDelete: "CASCADE", // 當訂單被刪除時，支付資訊也會被刪除
    },
  },
});
