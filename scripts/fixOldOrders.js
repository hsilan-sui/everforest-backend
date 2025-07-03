const { dataSource } = require("../db/data-source");

const fixOldOrders = async () => {
  try {
    await dataSource.initialize();
    const orderRepo = dataSource.getRepository("OrderInfo");

    const orders = await orderRepo.find({
      relations: {
        eventPlanBox: true,
      },
    });

    for (const order of orders) {
      const skipStatuses = ["Paid", "Refunded"];
      if (skipStatuses.includes(order.status)) continue;
      const plan = order.eventPlanBox;
      if (!plan) continue;

      const quantity = order.quantity;
      const addons = order.event_addons || [];
      const addonsTotal = addons.reduce((sum, addon) => sum + Number(addon.price || 0), 0);

      const discountedPrice = Number(plan.discounted_price);
      const useDiscount = discountedPrice > 0;
      const unitPrice = useDiscount ? discountedPrice : Number(plan.price);
      const newTotalPrice = unitPrice * quantity + addonsTotal;

      if (order.total_price !== newTotalPrice) {
        console.warn(`🛠️ 修正訂單 ${order.id}：${order.total_price} → ${newTotalPrice}`);
        order.total_price = newTotalPrice;
        await orderRepo.save(order);
      }
    }

    console.warn("✅ 所有舊訂單已修正完成");
    process.exit();
  } catch (err) {
    console.error("❌ 修正過程發生錯誤：", err);
    process.exit(1);
  }
};

fixOldOrders();
