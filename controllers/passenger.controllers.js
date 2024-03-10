const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const catchAsync = require("../utils/catchAsync");
const { CustomError } = require("../utils/errorHandler");
const { formattedDate } = require("../utils/formattedDate");

module.exports = {
  getAllPassengers: catchAsync(async (req, res, next) => {
    try {
      const { page = 1, limit = 10 } = req.query;

      const passengers = await prisma.passenger.findMany({
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
      });

      const totalPassengers = await prisma.airport.count();

      const pagination = getPagination(req, totalPassengers, Number(page), Number(limit));

      res.status(200).json({
        status: true,
        message: "show all passengers successful",
        data: { pagination, passengers },
      });
    } catch (err) {
      next(err);
    }
  }),

  createPassenger: catchAsync(async (req, res, next) => {
    try {
      const { name, familyName, bornDate, citizen, identityNumber, publisherCountry, validUntil, bookingId } = req.body;

      if (!name || !bornDate || !citizen || !identityNumber || !publisherCountry || !validUntil || !bookingId) {
        throw new CustomError(400, "Please provide name, bornDate, citizen, identityNumber, publisherCountry, validUntil, and bookingId");
      }

      let booking = await prisma.booking.findUnique({
        where: { id: Number(bookingId) },
      });

      if (!booking) throw new CustomError(404, "booking Not Found");

      let newPassenger = await prisma.passenger.create({
        data: {
          name,
          familyName,
          bornDate,
          citizen,
          identityNumber,
          publisherCountry,
          validUntil,
          bookingId: Number(bookingId),
          createdAt: formattedDate(new Date()),
          updatedAt: formattedDate(new Date()),
        },
      });

      res.status(201).json({
        status: true,
        message: "create passenger successful",
        data: { newPassenger },
      });
    } catch (err) {
      next(err);
    }
  }),

  getAllPassengersByBookingId: catchAsync(async (req, res, next) => {
    try {
      const { bookingId } = req.params;

      const booking = await prisma.passenger.findUnique({
        where: { id: Number(bookingId) },
      });

      if (!booking) throw new CustomError(404, "booking Not Found");

      const passengers = await prisma.passenger.findMany({
        where: { bookingId: Number(bookingId) },
      });

      res.status(200).json({
        status: true,
        message: "show all passengers by bookingId successful",
        data: { passengers },
      });
    } catch (err) {
      next(err);
    }
  }),
};
