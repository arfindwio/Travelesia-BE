const cron = require("node-cron");
const prisma = require("../libs/prismaClient");

module.exports = {
  promotionCheck: () => {
    // cron.schedule("0 0 * * *", async function () {
    cron.schedule("* * * * *", async function () {
      const flights = await prisma.flight.findMany();
      const promotions = await prisma.promotion.findMany();
      const validPromotionIds = flights.map((data) => data.promotionId).filter((promotionId) => promotionId !== null);

      for (const promotionId of validPromotionIds) {
        const promotion = promotions.find((promotion) => promotion.id === promotionId);

        if (!promotion || new Date(promotion.endDate) < new Date()) {
          const flightsToUpdate = flights.filter((flight) => flight.promotionId === promotionId);

          for (const flight of flightsToUpdate) {
            await prisma.flight.update({
              where: { id: flight.id },
              data: {
                price: flight.price / (1 - promotion.discount),
                promotionId: null,
              },
            });
          }
        }
      }
    });
  },
};
