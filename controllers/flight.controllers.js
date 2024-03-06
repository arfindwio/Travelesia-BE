const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const path = require("path");

const imagekit = require("../libs/imagekit");
const { CustomError } = require("../utils/errorHandler");
const catchAsync = require("../utils/catchAsync");
const { formattedDate } = require("../utils/formattedDate");

module.exports = {
  getAllFlights: catchAsync(async (req, res, next) => {
    try {
      const flights = await prisma.flight.findMany();

      res.status(200).json({
        status: true,
        message: "show all flights successful",
        data: { flights },
      });
    } catch (err) {
      next(err);
    }
  }),

  createFlight: catchAsync(async (req, res, next) => {
    try {
      const { flightCode, economyClassPrice, premiumEconomyPrice, businessPrice, firstClassPrice, departureTime, arrivalTime, airlineId, departureId, arrivalId } = req.body;
      const file = req.file;
      let imageURL;

      if (!flightCode || !economyClassPrice || !premiumEconomyPrice || !businessPrice || !firstClassPrice || !departureTime || !arrivalTime || !airlineId || !departureId || !arrivalId)
        throw new CustomError(400, "Please provide flightCode, economyClassPrice, premiumEconomyPrice, businessPrice, firstClassPrice, departureTime, arrivalTime, airlineId, departureId, and arrivalId");

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
          economyClassPrice: parseInt(economyClassPrice),
          premiumEconomyPrice: parseInt(premiumEconomyPrice),
          businessPrice: parseInt(businessPrice),
          firstClassPrice: parseInt(firstClassPrice),
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
      const { flightCode, economyClassPrice, premiumEconomyPrice, businessPrice, firstClassPrice, departureTime, arrivalTime, airlineId, departureId, arrivalId } = req.body;
      const file = req.file;
      let imageURL;

      if (!flightCode || !economyClassPrice || !premiumEconomyPrice || !businessPrice || !firstClassPrice || !departureTime || !arrivalTime || !airlineId || !departureId || !arrivalId)
        throw new CustomError(400, "Please provide flightCode,flightImg,economyClassPrice,premiumEconomyPrice,businessPrice,firstClassPrice,departureTime, arrivalTime, airlineId, departureId, and arrivalId");

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
          economyClassPrice: parseInt(economyClassPrice),
          premiumEconomyPrice: parseInt(premiumEconomyPrice),
          businessPrice: parseInt(businessPrice),
          firstClassPrice: parseInt(firstClassPrice),
          departureTime,
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
