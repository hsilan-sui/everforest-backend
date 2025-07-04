const cron = require("node-cron");

const { dataSource } = require("../db/data-source");

const { In } = require("typeorm");

const updateEventStatus = async () => {
  const validStatuses = [
    "preparing",
    "registering",
    "expired",
    "full",
    "refunding",
    "cancelled",
    "finished",
  ];
  const eventRepo = dataSource.getRepository("EventInfo");

  const events = await eventRepo.find({
    where: {
      active: "published",
      status: In(validStatuses),
    },
    relations: ["orderBox"], // 載入報名訂單
  });

  const now = new Date();
  let updatedCount = 0;

  for (const event of events) {
    const {
      registration_open_time,
      registration_close_time,
      start_time,
      end_time,
      max_participants,
    } = event;

    const currentParticipants = event.orderBox?.length || 0;

    const isFull =
      typeof max_participants === "number" &&
      max_participants > 0 &&
      currentParticipants >= max_participants;

    let newStatus = event.status;

    if (registration_open_time && now < registration_open_time) {
      newStatus = "preparing";
    } else if (
      registration_open_time &&
      now >= registration_open_time &&
      (!registration_close_time || now <= registration_close_time)
    ) {
      newStatus = isFull ? "full" : "registering";
    } else if (
      registration_close_time &&
      now > registration_close_time &&
      start_time &&
      now < start_time
    ) {
      newStatus = "expired";
    } else if (start_time && end_time && now >= start_time && now <= end_time) {
      newStatus = "finished";
    } else if (end_time && now > end_time) {
      newStatus = "expired";
    }

    if (newStatus !== event.status && validStatuses.includes(newStatus)) {
      try {
        event.status = newStatus;
        await eventRepo.save(event);
        updatedCount++;
      } catch (err) {
        console.error("❌ 儲存活動狀態失敗", {
          id: event.id,
          title: event.title,
          status: newStatus,
          error: err.message,
        });
      }
    }
  }

  console.warn(`✅ 活動狀態更新完成，共更新 ${updatedCount} 筆`);
};

// 每天凌晨 3:00 執行一次
cron.schedule("0 3 * * *", async () => {
  console.warn("⏰ 開始每日活動狀態更新任務...");

  try {
    if (!dataSource.isInitialized) {
      await dataSource.initialize();
    }

    await updateEventStatus();
  } catch (error) {
    console.error("❌ 排程任務執行失敗", error.message);
  }
});
