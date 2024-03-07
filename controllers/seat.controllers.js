const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const catchAsync = require("../utils/catchAsync");
const { CustomError } = require("../utils/errorHandler");
const { formattedDate } = require("../utils/formattedDate");

module.exports = {
  createManySeats: catchAsync(async (req, res, next) => {
    try {
      const { totalRows, flightId } = req.body;

      if (!totalRows || !flightId) throw new CustomError(400, "Please provide totalRows and flightId");

      let airport = await prisma.airport.findUnique({
        where: { id: Number(flightId) },
      });

      if (!airport) throw new CustomError(404, "Airport Not Found");

      let seatData = [];

      for (let i = 1; i <= totalRows; i++) {
        const seatRows = ["A", "B", "C", "D", "E", "F"];

        for (const seatRow of seatRows) {
          const seatNumber = `${seatRow}-${i}`;

          seatData.push({
            seatNumber,
            flightId,
            createdAt: formattedDate(new Date()),
            updatedAt: formattedDate(new Date()),
          });
        }
      }

      const newSeats = await prisma.seat.createMany({
        data: seatData,
      });

      res.status(201).json({
        status: true,
        message: "Create seats successful",
        data: { newSeats },
      });
    } catch (err) {
      next(err);
    }
  }),

  getAllSeatsByFlightId: catchAsync(async (req, res, next) => {
    try {
      const { flightId } = req.params;

      const seats = await prisma.seat.findMany({
        where: { flightId: Number(flightId) },
      });

      if (!seats.length) throw new CustomError(404, "seats Not Found");

      res.status(200).json({
        status: true,
        message: "show all seats successful",
        data: { seats },
      });
    } catch (err) {
      next(err);
    }
  }),

  reserveSeatById: catchAsync(async (req, res, next) => {
    try {
      const { seatId } = req.params;

      const seat = await prisma.seat.findUnique({
        where: { id: Number(seatId) },
      });

      if (!seat) throw new CustomError(404, "seat Not Found");

      let editedSeat = await prisma.seat.update({
        where: {
          id: Number(seatId),
        },
        data: {
          isBooked: true,
          updatedAt: formattedDate(new Date()),
        },
      });

      res.status(200).json({
        status: true,
        message: "update seat successful",
        data: { editedSeat },
      });
    } catch (err) {
      next(err);
    }
  }),

  deleteManySeatsByFlightId: catchAsync(async (req, res, next) => {
    try {
      const { flightId } = req.params;

      const flight = await prisma.flight.findUnique({
        where: { id: Number(flightId) },
      });

      if (!flight) throw new CustomError(404, "flight Not Found");

      const deletedSeats = await prisma.seat.deleteMany({
        where: {
          flightId: Number(flightId),
        },
      });

      res.status(200).json({
        status: true,
        message: "delete seats successful",
        data: { deletedSeats },
      });
    } catch (err) {
      next(err);
    }
  }),
};
