const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "OrderTicket",
  tableName: "ORDER_TICKET",
  columns: {
    id: {
      type: "uuid",
      primary: true,
      generated: "uuid",
    },
    ticket_code: {
      type: "varchar",
      length: 228,
      unique: true,
      nullable: false,
    },
    status: {
      type: "enum",
      enum: ["有效", "已使用", "作廢"],
      default: "有效",
    },
    issued_at: {
      type: "timestamptz",
      nullable: false,
    },
    used_at: {
      type: "timestamptz",
      nullable: true,
    },
  },
  relations: {
    orderInfoBox: {
      type: "many-to-one",
      target: "OrderInfo",
      joinColumn: { name: "order_info_id" },
      onDelete: "CASCADE",
    },
  },
});
