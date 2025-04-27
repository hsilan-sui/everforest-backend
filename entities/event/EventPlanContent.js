const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "EventPlanContent",
  tableName: "EVENT_PLAN_CONTENT",
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
  relations: {
    eventPlanBox: {
      type: "many-to-one",
      target: "EventPlan",
      joinColumn: {
        name: "event_plan_id",
      },
      inverseSide: "eventPlanContentBox",
      onDelete: "CASCADE",
    },
  },
});
