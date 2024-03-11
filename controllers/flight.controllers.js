const path = require("path");

const prisma = require("../libs/prismaClient");
const imagekit = require("../libs/imagekit");
const { CustomError } = require("../utils/errorHandler");
const catchAsync = require("../utils/catchAsync");
const { formattedDate } = require("../utils/formattedDate");
const { getPagination } = require("../utils/getPagination");

module.exports = {
  getAllFlights: catchAsync(async (req, res, next) => {
    try {
      const { search, d, a, s, f, page = 1, limit = 10 } = req.query;

      let flightsQuery = {
        where: {},
      };

      if (search) {
        flightsQuery.where = { flightCode: { contains: search, mode: "insensitive" } };
      }

      if (d || a || s) {
        if ((d && a && s) || (d && a) || (d && s) || (a && s)) {
          flightsQuery.where.AND = [];
          if (d) flightsQuery.where.AND.push({ departureTerminal: { airport: { city: { contains: d, mode: "insensitive" } } } });
          if (a) flightsQuery.where.AND.push({ arrivalTerminal: { airport: { city: { contains: a, mode: "insensitive" } } } });
          if (s) flightsQuery.where.AND.push({ seatClass: { contains: s, mode: "insensitive" } });
        } else {
          flightsQuery.where.OR = [];
          if (d) flightsQuery.where.OR.push({ departureTerminal: { airport: { city: { contains: d, mode: "insensitive" } } } });
          if (a) flightsQuery.where.OR.push({ arrivalTerminal: { airport: { city: { contains: a, mode: "insensitive" } } } });
          if (s) flightsQuery.where.OR.push({ seatClass: { contains: s, mode: "insensitive" } });
        }
      }

      if (f) {
        if (!flightsQuery.where.OR) flightsQuery.where.OR = [];
        flightsQuery.where.OR.push({ departureTerminal: { airport: { continent: { contains: f, mode: "insensitive" } } } }, { arrivalTerminal: { airport: { continent: { contains: f, mode: "insensitive" } } } });
      }

      const flights = await prisma.flight.findMany({
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        where: flightsQuery.where,
      });

      const totalFlights = await prisma.flight.count({
        where: flightsQuery.where,
      });

      const pagination = getPagination(req, totalFlights, Number(page), Number(limit));

      res.status(200).json({
        status: true,
        message: "show all flights successful",
        data: { pagination, flights },
      });
    } catch (err) {
      next(err);
    }
  }),

  createFlight: catchAsync(async (req, res, next) => {
    try {
      const { flightCode, seatClass, price, departureTime, arrivalTime, airlineId, departureId, arrivalId } = req.body;
      const file = req.file;
      let imageURL;

      if (!flightCode || !seatClass || !price || !departureTime || !arrivalTime || !airlineId || !departureId || !arrivalId)
        throw new CustomError(400, "Please provide flightCode, seatClass, price, departureTime, arrivalTime, airlineId, departureId, and arrivalId");

      let airline = await prisma.airline.findUnique({
        where: { id: Number(airlineId) },
      });

      if (!airline) throw new CustomError(404, "airline Not Found");

      const terminal1 = await prisma.terminal.findUnique({
        where: {
          id: Number(departureId),
        },
      });

      const terminal2 = await prisma.terminal.findUnique({
        where: {
          id: Number(arrivalId),
        },
      });

      if (!terminal1 || !terminal2) throw new CustomError(404, "terminal  Not Found");

      if (file) {
        const strFile = file.buffer.toString("base64");

        const { url } = await imagekit.upload({
          fileName: Date.now() + path.extname(req.file.originalname),
          file: strFile,
        });

        imageURL = url;
      }

      let newFlight = await prisma.flight.create({
        data: {
          ...req.body,
          flightImg: imageURL,
          price: parseInt(price),
          airlineId: Number(airlineId),
          departureId: Number(departureId),
          arrivalId: Number(arrivalId),
          createdAt: formattedDate(new Date()),
          updatedAt: formattedDate(new Date()),
        },
      });

      return res.status(201).json({
        status: true,
        message: "create flight successful",
        data: { newFlight },
      });
    } catch (err) {
      next(err);
    }
  }),

  editFlight: catchAsync(async (req, res, next) => {
    try {
      const { flightId } = req.params;
      const { flightCode, seatClass, price, departureTime, arrivalTime, airlineId, departureId, arrivalId } = req.body;
      const file = req.file;
      let imageURL;

      if (!flightCode || !seatClass || !price || !departureTime || !arrivalTime || !airlineId || !departureId || !arrivalId)
        throw new CustomError(400, "Please provide flightCode, seatClass, price,departureTime, arrivalTime, airlineId, departureId, and arrivalId");

      const flight = await prisma.flight.findUnique({
        where: { id: Number(flightId) },
      });

      if (!flight) throw new CustomError(404, "flight Not Found");

      let airline = await prisma.airline.findUnique({
        where: { id: Number(airlineId) },
      });

      if (!airline) throw new CustomError(404, "airline Not Found");

      const terminal1 = await prisma.terminal.findUnique({
        where: {
          id: Number(departureId),
        },
      });

      const terminal2 = await prisma.terminal.findUnique({
        where: {
          id: Number(arrivalId),
        },
      });

      if (!terminal1 || !terminal2) throw new CustomError(404, "terminal Not Found");

      if (file) {
        const strFile = file.buffer.toString("base64");

        const { url } = await imagekit.upload({
          fileName: Date.now() + path.extname(req.file.originalname),
          file: strFile,
        });

        imageURL = url;
      }

      let newFlight = await prisma.flight.update({
        where: { id: Number(flightId) },
        data: {
          flightCode,
          flightImg: imageURL,
          seatClass,
          price: parseInt(price),
          arrivalTime,
          airlineId: Number(airlineId),
          departureId: Number(departureId),
          arrivalId: Number(arrivalId),
          updatedAt: formattedDate(new Date()),
        },
      });

      return res.status(200).json({
        status: true,
        message: "update flight successful",
        data: { newFlight },
      });
    } catch (err) {
      next(err);
    }
  }),

  deleteFlight: catchAsync(async (req, res, next) => {
    try {
      const { flightId } = req.params;

      const flight = await prisma.flight.findUnique({
        where: { id: Number(flightId) },
      });

      if (!flight) throw new CustomError(404, "flight Not Found");

      const deletedFlight = await prisma.flight.delete({
        where: {
          id: Number(flightId),
        },
      });

      res.status(200).json({
        status: true,
        message: "delete flight successful",
        data: { deletedFlight },
      });
    } catch (err) {
      next(err);
    }
  }),
};
