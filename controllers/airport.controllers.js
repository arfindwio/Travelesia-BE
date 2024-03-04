const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const catchAsync = require("../utils/catchAsync");
const { CustomError } = require("../utils/errorHandler");
const { formattedDate } = require("../utils/formattedDate");

module.exports = {
  createAirport: catchAsync(async (req, res, next) => {
    try {
      const { airportName, country, city } = req.body;

      if (!airportName || !country || !city) throw new CustomError(400, "Please provide airportName, country, and city");

      let newAirport = await prisma.airport.create({
        data: {
          airportName,
          country,
          city,
          createdAt: formattedDate(new Date()),
          updatedAt: formattedDate(new Date()),
        },
      });

      res.status(201).json({
        status: true,
        message: "create airport successful",
        data: { newAirport },
      });
    } catch (err) {
      next(err);
    }
  }),

  getAllAirports: catchAsync(async (req, res, next) => {
    try {
      const airports = await prisma.airport.findMany();

      res.status(200).json({
        status: true,
        message: "show all airports successful",
        data: { airports },
      });
    } catch (err) {
      next(err);
    }
  }),

  editAirport: catchAsync(async (req, res, next) => {
    try {
      const { airportId } = req.params;
      const { airportName, country, city } = req.body;

      if (!airportName || !country || !city) throw new CustomError(400, "Please provide airportName, country, and city");

      let editedAirport = await prisma.airport.update({
        where: {
          id: Number(airportId),
        },
        data: {
          airportName,
          country,
          city,
          updatedAt: formattedDate(new Date()),
        },
      });

      res.status(200).json({
        status: true,
        message: "update airport successful",
        data: { editedAirport },
      });
    } catch (err) {
      next(err);
    }
  }),

  deleteAirport: catchAsync(async (req, res, next) => {
    try {
      const { airportId } = req.params;

      const airport = await prisma.airport.findUnique({
        where: { id: Number(airportId) },
      });

      if (!airport) throw new CustomError(404, "airport Not Found");

      const deletedAirport = await prisma.airport.delete({
        where: {
          id: Number(airportId),
        },
      });

      res.status(200).json({
        status: true,
        message: "delete airport successful",
        data: { deletedAirport },
      });
    } catch (err) {
      next(err);
    }
  }),
};
