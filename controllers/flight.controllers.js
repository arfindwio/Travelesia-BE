const path = require("path");

const prisma = require("../libs/prismaClient");
const imagekit = require("../libs/imagekit");
const { CustomError } = require("../utils/errorHandler");
const catchAsync = require("../utils/catchAsync");
const { formattedDate, convertDateTime } = require("../utils/formattedDate");
const { getPagination } = require("../utils/getPagination");
const { calculateDurationDateTime } = require("../utils/calculateDuration");

module.exports = {
  getAllFlights: catchAsync(async (req, res, next) => {
    try {
      // filter
      // search=search, d=departure, a=arrival, s=seat, c=continent, f=date, w=allFilter: cheapest, duration, earliest, latest
      const { search, d, a, s, c, f, w, page = 1, limit = 10 } = req.query;

      let flightsQuery = {
        where: {},
      };

      if (search || d || a || s || c || f) {
        if ((search && (d || a || s || f)) || (d && (search || a || s || f)) || (a && (d || search || s || f)) || (s && (d || a || search || f)) || (f && (search || d || a || s || c))) {
          flightsQuery.where.AND = [];
          if (search)
            flightsQuery.where.AND.push({
              OR: [
                { departureTerminal: { airport: { city: { contains: search, mode: "insensitive" } } } },
                { arrivalTerminal: { airport: { city: { contains: search, mode: "insensitive" } } } },
                { flightCode: { contains: search, mode: "insensitive" } },
              ],
            });
          if (d) flightsQuery.where.AND.push({ departureTerminal: { airport: { city: { contains: d, mode: "insensitive" } } } });
          if (a) flightsQuery.where.AND.push({ arrivalTerminal: { airport: { city: { contains: a, mode: "insensitive" } } } });
          if (s) flightsQuery.where.AND.push({ seatClass: { contains: s, mode: "insensitive" } });
          if (f)
            flightsQuery.where.AND.push({
              OR: [{ departureTime: { contains: f, mode: "insensitive" } }, { arrivalTime: { contains: f, mode: "insensitive" } }],
            });
        } else {
          flightsQuery.where.OR = [];
          if (search)
            flightsQuery.where.OR.push(
              { departureTerminal: { airport: { city: { contains: search, mode: "insensitive" } } } },
              { arrivalTerminal: { airport: { city: { contains: search, mode: "insensitive" } } } },
              { flightCode: { contains: search, mode: "insensitive" } }
            );
          if (d) flightsQuery.where.OR.push({ departureTerminal: { airport: { city: { contains: d, mode: "insensitive" } } } });
          if (a) flightsQuery.where.OR.push({ arrivalTerminal: { airport: { city: { contains: a, mode: "insensitive" } } } });
          if (s) flightsQuery.where.OR.push({ seatClass: { contains: s, mode: "insensitive" } });
          if (c) flightsQuery.where.OR.push({ departureTerminal: { airport: { continent: { contains: c, mode: "insensitive" } } } }, { arrivalTerminal: { airport: { continent: { contains: c, mode: "insensitive" } } } });
          if (f) flightsQuery.where.OR.push({ departureTime: { contains: f, mode: "insensitive" } }, { arrivalTime: { contains: f, mode: "insensitive" } });
        }
      }

      if (w) {
        flightsQuery.orderBy = {};
        if (w === "cheapest") flightsQuery.orderBy.price = "asc";
        if (w === "duration") flightsQuery.orderBy.duration = "asc";
        if (w === "earliest departure") flightsQuery.orderBy.departureTime = "asc";
        if (w === "latest departure") flightsQuery.orderBy.departureTime = "desc";
        if (w === "earliest arrival") flightsQuery.orderBy.arrivalTime = "asc";
        if (w === "latest arrival") flightsQuery.orderBy.arrivalTime = "desc";
      }

      const flights = await prisma.flight.findMany({
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        where: flightsQuery.where,
        orderBy: flightsQuery.orderBy,
        select: {
          id: true,
          flightCode: true,
          flightImg: true,
          seatClass: true,
          price: true,
          departureTime: true,
          arrivalTime: true,
          duration: true,
          airline: {
            select: {
              airlineName: true,
              baggage: true,
              cabinBaggage: true,
            },
          },
          departureTerminal: {
            select: {
              terminalName: true,
              airport: {
                select: {
                  airportName: true,
                  city: true,
                  continent: true,
                  country: true,
                },
              },
            },
          },
          arrivalTerminal: {
            select: {
              terminalName: true,
              airport: {
                select: {
                  airportName: true,
                  city: true,
                  continent: true,
                  country: true,
                },
              },
            },
          },
        },
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
      const { flightCode, seatClass, price, departureTime, arrivalTime, airlineId, promotionId, departureId, arrivalId } = req.body;
      const file = req.file;
      let imageURL;
      let finalPrice = price;

      if (!flightCode || !file || !seatClass || !price || !departureTime || !arrivalTime || !airlineId || !departureId || !arrivalId)
        throw new CustomError(400, "Please provide flightCode, flightImg, seatClass, price, departureTime, arrivalTime, airlineId, departureId, and arrivalId");

      if (promotionId === "null") throw new CustomError(400, "promotionId cannot be null");

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

      const departureDateTime = convertDateTime(departureTime);
      const arrivalDateTime = convertDateTime(arrivalTime);
      const durationFlight = calculateDurationDateTime(departureDateTime, arrivalDateTime);

      if (promotionId) {
        const promotion = await prisma.promotion.findUnique({
          where: { id: Number(promotionId) },
        });

        if (!promotion) throw new CustomError(404, "Promotion not found");

        finalPrice = price - promotion.discount * price;
      }

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
          price: parseInt(finalPrice),
          departureTime: departureDateTime,
          arrivalTime: arrivalDateTime,
          duration: parseInt(durationFlight),
          airlineId: Number(airlineId),
          promotionId: promotionId ? Number(promotionId) : null,
          departureId: Number(departureId),
          arrivalId: Number(arrivalId),
          createdAt: formattedDate(new Date()),
          updatedAt: formattedDate(new Date()),
        },
      });

      res.status(201).json({
        status: true,
        message: "create flight successful",
        data: { newFlight },
      });
    } catch (err) {
      next(err);
    }
  }),

  getFlightById: catchAsync(async (req, res, next) => {
    try {
      const { flightId } = req.params;

      const flight = await prisma.flight.findUnique({
        where: { id: Number(flightId) },
        select: {
          flightCode: true,
          seatClass: true,
          price: true,
          departureTime: true,
          arrivalTime: true,
          duration: true,
          airline: {
            select: {
              airlineName: true,
              baggage: true,
              cabinBaggage: true,
            },
          },
          promotion: {
            select: {
              discount: true,
              startDate: true,
              endDate: true,
            },
          },
          departureTerminal: {
            select: {
              terminalName: true,
              airport: {
                select: {
                  airportName: true,
                },
              },
            },
          },
          arrivalTerminal: {
            select: {
              terminalName: true,
              airport: {
                select: {
                  airportName: true,
                },
              },
            },
          },
          seat: {
            select: {
              id: true,
              seatNumber: true,
              isBooked: true,
            },
          },
        },
      });

      if (!flight) throw new CustomError(404, "flight Not Found");

      res.status(200).json({
        status: true,
        message: "show all flights successful",
        data: { flight },
      });
    } catch (err) {
      next(err);
    }
  }),

  editFlightById: catchAsync(async (req, res, next) => {
    try {
      const { flightId } = req.params;
      let { flightCode, seatClass, price, departureTime, arrivalTime, airlineId, promotionId, departureId, arrivalId } = req.body;
      const file = req.file;
      let imageURL;
      let durationFlight;
      let departureDateTime;
      let arrivalDateTime;
      let finalPrice = price;

      if (!flightCode || !seatClass || !price || !departureTime || !arrivalTime || !airlineId || !departureId || !arrivalId)
        throw new CustomError(400, "Please provide flightCode, seatClass, price, departureTime, arrivalTime, airlineId, departureId, and arrivalId");

      if (promotionId === "null") throw new CustomError(400, "promotionId cannot be null");

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

      if (departureTime || arrivalTime) {
        if (departureTime) {
          departureDateTime = convertDateTime(departureTime);
          durationFlight = parseInt(calculateDurationDateTime(departureDateTime, flight.arrivalTime));
        }
        if (arrivalTime) {
          arrivalDateTime = convertDateTime(arrivalTime);
          durationFlight = parseInt(calculateDurationDateTime(flight.departureTime, arrivalDateTime));
        }
        if (departureTime && arrivalTime) {
          departureDateTime = convertDateTime(departureTime);
          arrivalDateTime = convertDateTime(arrivalTime);
          durationFlight = parseInt(calculateDurationDateTime(departureDateTime, arrivalDateTime));
        }
      }

      if (promotionId) {
        const promotion = await prisma.promotion.findUnique({
          where: { id: Number(promotionId) },
        });

        if (!promotion) throw new CustomError(404, "Promotion not found");

        finalPrice = price - promotion.discount * price;
      }

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
          price: parseInt(finalPrice),
          departureTime: departureDateTime,
          arrivalTime: arrivalDateTime,
          duration: durationFlight,
          airlineId: Number(airlineId),
          promotionId: promotionId ? Number(promotionId) : null,
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
