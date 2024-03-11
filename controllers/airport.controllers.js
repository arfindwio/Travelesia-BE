const prisma = require("../libs/prismaClient");
const catchAsync = require("../utils/catchAsync");
const { CustomError } = require("../utils/errorHandler");
const { formattedDate } = require("../utils/formattedDate");
const { getPagination } = require("../utils/getPagination");

module.exports = {
  getAllAirports: catchAsync(async (req, res, next) => {
    try {
      const { search, page = 1, limit = 10 } = req.query;

      const airports = await prisma.airport.findMany({
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        where: search ? { airportName: { contains: search, mode: "insensitive" } } : {},
      });

      const totalAirports = await prisma.airport.count({
        where: search ? { airportName: { contains: search, mode: "insensitive" } } : {},
      });

      const pagination = getPagination(req, totalAirports, Number(page), Number(limit));

      res.status(200).json({
        status: true,
        message: "show all airports successful",
        data: { pagination, airports },
      });
    } catch (err) {
      next(err);
    }
  }),

  createAirport: catchAsync(async (req, res, next) => {
    try {
      const { airportName, continent, country, city } = req.body;

      if (!airportName || !continent || !country || !city) throw new CustomError(400, "Please provide airportName, continent, country, and city");

      let newAirport = await prisma.airport.create({
        data: {
          airportName,
          continent,
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

  editAirport: catchAsync(async (req, res, next) => {
    try {
      const { airportId } = req.params;
      const { airportName, continent, country, city } = req.body;

      if (!airportName || !continent || !country || !city) throw new CustomError(400, "Please provide airportName, continent, country, and city");

      const airport = await prisma.airport.findUnique({
        where: { id: Number(airportId) },
      });

      if (!airport) throw new CustomError(404, "airport Not Found");

      let editedAirport = await prisma.airport.update({
        where: {
          id: Number(airportId),
        },
        data: {
          airportName,
          continent,
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
