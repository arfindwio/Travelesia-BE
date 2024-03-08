const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const catchAsync = require("../utils/catchAsync");
const { CustomError } = require("../utils/errorHandler");
const { formattedDate } = require("../utils/formattedDate");
const { generatedBookingCode } = require("../utils/codeGenerator");

module.exports = {
  getAllBookings: catchAsync(async (req, res, next) => {
    try {
      const bookings = await prisma.booking.findMany();

      res.status(200).json({
        status: true,
        message: "show all bookings successful",
        data: { bookings },
      });
    } catch (err) {
      next(err);
    }
  }),

  createBooking: catchAsync(async (req, res, next) => {
    try {
      const { flightId } = req.params;
      const { amount } = req.body;

      const flight = await prisma.flight.findUnique({
        where: { id: Number(flightId) },
      });

      if (!flight) throw new CustomError(404, "flight Not Found");

      let newBooking = await prisma.booking.create({
        data: {
          bookingCode: generatedBookingCode(),
          amount: parseInt(amount),
          userId: Number(req.user.id),
          flightId: Number(flightId),
          createdAt: formattedDate(new Date()),
          updatedAt: formattedDate(new Date()),
        },
      });
      res.status(201).json({
        status: true,
        message: "create booking successful",
        data: { newBooking },
      });
    } catch (err) {
      next(err);
    }
  }),

  getAllBookingsByAuth: catchAsync(async (req, res, next) => {
    try {
      const bookings = await prisma.booking.findMany({
        where: { userId: Number(req.user.id) },
      });

      res.status(200).json({
        status: true,
        message: "show all bookings by auth successful",
        data: { bookings },
      });
    } catch (err) {
      next(err);
    }
  }),
};
