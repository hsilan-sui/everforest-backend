const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "EventFavorite",
  tableName: "EVENT_FAVORITE",
  columns: {
    id: {
      type: "uuid",
      primary: true,
      generated: "uuid",
    },
    event_info_id: {
      type: "uuid",
      nullable: false,
    },
    member_info_id: {
      type: "uuid",
      nullable: false,
    },
    event_plan_id: {
      type: "uuid",
      nullable: true, // 如果有計畫才用到，否則可以 nullable: false
    },
    created_at: {
      type: "timestamptz",
      default: () => "CURRENT_TIMESTAMP",
    },
  },
  relations: {
    memberBox: {
      type: "many-to-one",
      target: "MemberInfo", // 改成正確的實體名稱
      joinColumn: { name: "member_info_id" },
      nullable: false,
      onDelete: "CASCADE",
      inverseSide: "favoriteBox", // 如果 MemberInfo 裡有對應的 inverseSide
    },
    eventBox: {
      type: "many-to-one",
      target: "EventInfo",
      joinColumn: { name: "event_info_id" },
      nullable: false,
      onDelete: "CASCADE",
      inverseSide: "favoriteBox", // 如果 EventInfo 裡有定義
    },
    eventPlanBox: {
      type: "many-to-one",
      target: "EventPlan",
      joinColumn: { name: "event_plan_id" },
      nullable: true, // 視需求決定
      onDelete: "CASCADE",
      inverseSide: "favoriteBox", // 如果 EventPlan 有對應
    },
  },
});
