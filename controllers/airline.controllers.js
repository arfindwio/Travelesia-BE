const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const catchAsync = require("../utils/catchAsync");
const { CustomError } = require("../utils/errorHandler");
const { formattedDate } = require("../utils/formattedDate");
const { getPagination } = require("../utils/getPagination");

module.exports = {
  getAllAirlines: catchAsync(async (req, res, next) => {
    try {
      const { page = 1, limit = 10 } = req.query;

      const airlines = await prisma.airline.findMany({
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
      });

      const totalAirlines = await prisma.airport.count();

      const pagination = getPagination(req, totalAirlines, Number(page), Number(limit));

      res.status(200).json({
        status: true,
        message: "show all airlines successful",
        data: { pagination, airlines },
      });
    } catch (err) {
      next(err);
    }
  }),

  createAirline: catchAsync(async (req, res, next) => {
    try {
      const { airlineName, baggage, cabinBaggage } = req.body;

      if (!airlineName || !baggage || !cabinBaggage) throw new CustomError(400, "Please provide airlineName, country, and city");

      let newAirline = await prisma.airline.create({
        data: {
          airlineName,
          baggage,
          cabinBaggage,
          createdAt: formattedDate(new Date()),
          updatedAt: formattedDate(new Date()),
        },
      });

      res.status(201).json({
        status: true,
        message: "create airline successful",
        data: { newAirline },
      });
    } catch (err) {
      next(err);
    }
  }),

  editAirline: catchAsync(async (req, res, next) => {
    try {
      const { airlineId } = req.params;
      const { airlineName, baggage, cabinBaggage } = req.body;

      if (!airlineName || !baggage || !cabinBaggage) throw new CustomError(400, "Please provide airlineName, country, and city");

      const airline = await prisma.airline.findUnique({
        where: { id: Number(airlineId) },
      });

      if (!airline) throw new CustomError(404, "airline Not Found");

      let editedAirline = await prisma.airline.update({
        where: {
          id: Number(airlineId),
        },
        data: {
          airlineName,
          baggage,
          cabinBaggage,
          updatedAt: formattedDate(new Date()),
        },
      });

      res.status(200).json({
        status: true,
        message: "update airline successful",
        data: { editedAirline },
      });
    } catch (err) {
      next(err);
    }
  }),

  deleteAirline: catchAsync(async (req, res, next) => {
    try {
      const { airlineId } = req.params;

      const airline = await prisma.airline.findUnique({
        where: { id: Number(airlineId) },
      });

      if (!airline) throw new CustomError(404, "airline Not Found");

      const deletedAirline = await prisma.airline.delete({
        where: {
          id: Number(airlineId),
        },
      });

      res.status(200).json({
        status: true,
        message: "delete airline successful",
        data: { deletedAirline },
      });
    } catch (err) {
      next(err);
    }
  }),
};
