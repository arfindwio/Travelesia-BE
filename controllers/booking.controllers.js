const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const catchAsync = require("../utils/catchAsync");
const { CustomError } = require("../utils/errorHandler");
const { formattedDate } = require("../utils/formattedDate");
const { generatedBookingCode } = require("../utils/codeGenerator");
const { getPagination } = require("../utils/getPagination");

module.exports = {
  getAllBookings: catchAsync(async (req, res, next) => {
    try {
      const { page = 1, limit = 10 } = req.query;

      const bookings = await prisma.booking.findMany({
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
      });

      const totalBookings = await prisma.airport.count();

      const pagination = getPagination(req, totalBookings, Number(page), Number(limit));

      res.status(200).json({
        status: true,
        message: "show all bookings successful",
        data: { pagination, bookings },
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

  payBooking: catchAsync(async (req, res, next) => {
    try {
      const { flightId } = req.params;
      const { bookingCode, methodPayment, cardNumber, cvv, expiryDate, bankName, store, message } = req.body;

      if (!bookingCode) throw new CustomError(400, "Please provide bookingCode");

      const booking = await prisma.booking.findUnique({
        where: { bookingCode },
      });

      if (!booking) throw new CustomError(404, "booking Not Found");

      let month = expiryDate.slice(0, 2);
      let year = expiryDate.slice(3);

      const apiUrl = isProduction ? `https://api.midtrans.com/v2/token?client_key=${PAYMENT_PROD_CLIENT_KEY}` : `https://api.sandbox.midtrans.com/v2/token?client_key=${PAYMENT_DEV_CLIENT_KEY}`;

      const response = await axios.get(`${apiUrl}&card_number=${cardNumber}&card_cvv=${cvv}&card_exp_month=${month}&card_exp_year=${`20${year}`}`);

      const token_id = response.data.token_id;

      const user = await prisma.user.findUnique({
        where: { id: Number(req.user.id) },
        include: {
          userProfile: true,
        },
      });

      const flight = await prisma.flight.findUnique({
        where: { id: Number(flightId) },
      });

      if (!flight) throw new CustomError(404, `Flight Not Found With Id ${flightId}`);

      let payBooking = await prisma.booking.update({
        where: { bookingCode },
        data: {
          status: "Paid",
          methodPayment,
          updatedAt: formattedDate(new Date()),
        },
      });

      // Define payment parameters for Midtrans API
      let parameter = {
        transaction_details: {
          order_id: `${generatedBookingCode()}`,
          gross_amount: parseInt(booking.amount),
        },
        customer_details: {
          first_name: user.userProfile.fullName,
          email: user.email,
          phone: user.userProfile.phoneNumber,
        },
      };

      // Set payment type based on the methodPayment
      if (methodPayment === "Credit Card") {
        if (!cardNumber || !cvv || !expiryDate || bankName !== undefined || store !== undefined || message !== undefined) {
          throw new CustomError(400, "For Credit Card payments, please provide only card details (cardNumber, cvv, expiryDate). Other fields are not applicable.");
        }

        parameter.payment_type = "credit_card";
        parameter.credit_card = {
          token_id: token_id,
          authentication: true,
        };
      }

      if (methodPayment === "Bank Transfer") {
        if (!bankName || cardNumber !== undefined || cvv !== undefined || expiryDate !== undefined || store !== undefined || message !== undefined) {
          throw new CustomError(400, "For this payment method, please provide only the required fields. Unnecessary fields are not applicable.");
        }

        parameter.payment_type = "bank_transfer";
        parameter.bank_transfer = {
          bank: bankName,
        };
      }

      if (methodPayment === "Mandiri Bill") {
        if (bankName !== undefined || cardNumber !== undefined || cvv !== undefined || expiryDate !== undefined || store !== undefined || message !== undefined) {
          throw new CustomError(400, "For this payment method, please provide only the required card details (cardNumber, cvv, expiryDate). Other fields are not applicable.");
        }

        parameter.payment_type = "echannel";
        parameter.echannel = {
          bill_info1: "Payment:",
          bill_info2: "Online purchase",
        };
      }

      if (methodPayment === "Permata") {
        if (bankName !== undefined || cardNumber !== undefined || cvv !== undefined || expiryDate !== undefined || store !== undefined || message !== undefined) {
          throw new CustomError(400, "For this payment method, please provide only the required card details (cardNumber, cvv, expiryDate). Other fields are not applicable.");
        }

        parameter.payment_type = "permata";
      }

      if (methodPayment === "Gopay") {
        if (bankName !== undefined || cardNumber !== undefined || cvv !== undefined || expiryDate !== undefined || store !== undefined || message !== undefined) {
          throw new CustomError(400, "For this payment method, please provide only the required card details (cardNumber, cvv, expiryDate). Other fields are not applicable.");
        }

        parameter.payment_type = "gopay";
        parameter.gopay = {
          enable_callback: true,
          callback_url: `${FRONTEND_URL}/payment-success`,
        };
      }

      if (methodPayment === "Counter") {
        if (bankName !== undefined || cardNumber !== undefined || cvv !== undefined || expiryDate !== undefined || !store || !message) {
          throw new CustomError(400, "Please provide only the required card details (cardNumber, cvv, expiryDate) for this payment method. Other fields are not applicable.");
        }

        parameter.payment_type = "cstore";
        if (store === "alfamart") {
          parameter.cstore = {
            store: "alfamart",
            message,
            alfamart_free_text_1: "1st row of receipt,",
            alfamart_free_text_2: "This is the 2nd row,",
            alfamart_free_text_3: "3rd row. The end.",
          };
        }

        if (store === "indomaret") {
          parameter.cstore = {
            store: "indomaret",
            message,
          };
        }
      }

      if (methodPayment === "Cardless Credit") {
        if (bankName !== undefined || cardNumber !== undefined || cvv !== undefined || expiryDate !== undefined || store !== undefined || message !== undefined) {
          throw new CustomError(400, "For this payment method, please provide only the required card details (cardNumber, cvv, expiryDate). Other fields are not applicable.");
        }

        parameter.payment_type = "akulaku";
      }

      let transaction = await core.charge(parameter);

      await prisma.notification.create({
        data: {
          title: "Notification",
          message: "You have successfully payment in the booking",
          userId: Number(req.user.id),
          createdAt: formattedDate(new Date()),
          updatedAt: formattedDate(new Date()),
        },
      });

      res.status(201).json({
        status: true,
        message: "Payment initiated successfully",
        data: {
          newPayment,
          transaction,
        },
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
