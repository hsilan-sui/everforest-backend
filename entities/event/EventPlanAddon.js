const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "EventPlanAddon",
  tableName: "EVENT_PLAN_ADDON",
  columns: {
    id: {
      type: "uuid",
      primary: true,
      nullable: false,
      generated: "uuid",
    },
    event_plan_id: {
      type: "uuid",
      nullable: false,
    },
    name: {
      type: "varchar",
      length: 100,
      nullable: false,
    },
    price: {
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
    eventPlanBox: {
      type: "many-to-one",
      target: "EventPlan",
      joinColumn: {
        name: "event_plan_id",
      },
      inverseSide: "eventPlanAddonBox",
      onDelete: "CASCADE",
    },
  },
});
