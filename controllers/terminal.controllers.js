const prisma = require("../libs/prismaClient");
const catchAsync = require("../utils/catchAsync");
const { CustomError } = require("../utils/errorHandler");
const { formattedDate } = require("../utils/formattedDate");
const { getPagination } = require("../utils/getPagination");

module.exports = {
  getAllTerminals: catchAsync(async (req, res, next) => {
    try {
      const { search, page = 1, limit = 10 } = req.query;

      const terminals = await prisma.terminal.findMany({
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        where: search ? { terminalName: { contains: search, mode: "insensitive" } } : {},
      });

      const totalTerminals = await prisma.airport.count({
        where: search ? { terminalName: { contains: search, mode: "insensitive" } } : {},
      });

      const pagination = getPagination(req, totalTerminals, Number(page), Number(limit));

      res.status(200).json({
        status: true,
        message: "show all terminals successful",
        data: { pagination, terminals },
      });
    } catch (err) {
      next(err);
    }
  }),

  createTerminal: catchAsync(async (req, res, next) => {
    try {
      const { terminalName, airportId } = req.body;

      if (!terminalName || !airportId) throw new CustomError(400, "Please provide terminalName and airportId");

      let airport = await prisma.airport.findUnique({
        where: { id: Number(airportId) },
      });

      if (!airport) throw new CustomError(404, "airport Not Found");

      let newTerminal = await prisma.terminal.create({
        data: {
          terminalName,
          airportId,
          createdAt: formattedDate(new Date()),
          updatedAt: formattedDate(new Date()),
        },
      });

      res.status(201).json({
        status: true,
        message: "create terminal successful",
        data: { newTerminal },
      });
    } catch (err) {
      next(err);
    }
  }),

  editTerminal: catchAsync(async (req, res, next) => {
    try {
      const { terminalId } = req.params;
      const { terminalName, airportId } = req.body;

      if (!terminalName || !airportId) throw new CustomError(400, "Please provide terminalName, and airportId");

      const terminal = await prisma.terminal.findUnique({
        where: { id: Number(terminalId) },
      });

      if (!terminal) throw new CustomError(404, "terminal Not Found");

      const airport = await prisma.airport.findUnique({
        where: { id: Number(airportId) },
      });

      if (!airport) throw new CustomError(404, "airport Not Found");

      let editedTerminal = await prisma.terminal.update({
        where: {
          id: Number(terminalId),
        },
        data: {
          terminalName,
          airportId,
          updatedAt: formattedDate(new Date()),
        },
      });

      res.status(200).json({
        status: true,
        message: "update terminal successful",
        data: { editedTerminal },
      });
    } catch (err) {
      next(err);
    }
  }),

  deleteTerminal: catchAsync(async (req, res, next) => {
    try {
      const { terminalId } = req.params;

      const terminal = await prisma.terminal.findUnique({
        where: { id: Number(terminalId) },
      });

      if (!terminal) throw new CustomError(404, "terminal Not Found");

      const deletedTerminal = await prisma.terminal.delete({
        where: {
          id: Number(terminalId),
        },
      });

      res.status(200).json({
        status: true,
        message: "delete terminal successful",
        data: { deletedTerminal },
      });
    } catch (err) {
      next(err);
    }
  }),
};
