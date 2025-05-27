const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "EventPlan",
  tableName: "EVENT_PLAN",
  columns: {
    id: {
      type: "uuid",
      primary: true,
      nullable: false,
      generated: "uuid",
    },
    event_info_id: {
      type: "uuid",
      nullable: false,
    },
    title: {
      type: "varchar",
      length: 100,
      nullable: false,
    },
    price: {
      type: "integer",
      nullable: false,
    },
    discounted_price: {
      type: "integer",
      nullable: true,
    },
    people_capacity: {
      type: "integer",
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
  relations: {
    eventBox: {
      type: "many-to-one", //多個方案可以對應一個露營活動
      target: "EventInfo",
      joinColumn: {
        name: "event_info_id",
      },
      inverseSide: "eventPlanBox",
      onDelete: "CASCADE",
    },
    eventPlanAddonBox: {
      type: "one-to-many",
      target: "EventPlanAddon",
      inverseSide: "eventPlanBox",
    },
    eventPlanContentBox: {
      type: "one-to-many",
      target: "EventPlanContent",
      inverseSide: "eventPlanBox",
    },

    orderBox: {
      type: "many-to-one",
      target: "OrderInfo",
      mappedBy: "eventPlanBox", // 對應 OrderInfo 的 eventPlanBox
    },
  },
});
