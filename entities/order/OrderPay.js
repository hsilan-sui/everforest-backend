const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "OrderPay",
  tableName: "ORDER_PAY",
  columns: {
    id: {
      type: "uuid",
      primary: true,
      nullable: false,
      generated: "uuid",
    },

    order_info_id: {
      type: "uuid",
      nullable: false,
    },
    method: {
      type: "varchar",
      length: 30,
      nullable: false,
    },

    gateway: {
      type: "enum",
      enum: ["ecpay", "newebpay", "linepay"],
      nullable: false,
    },

    status: {
      type: "enum",
      enum: ["Unpaid", "Payed", "Refunded"],
      nullable: false,
      default: () => "Unpaid",
    },

    amount: {
      type: "integer",
      nullable: false,
    },

    transaction_id: {
      type: "varchar",
      length: 128,
      nullable: false,
      unique: true,
    },

    paid_at: {
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
});
