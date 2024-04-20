const pasport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const { PrismaClient } = require("@prisma/client");
const passport = require("passport");
const prisma = new PrismaClient();

const { formattedDate } = require("../utils/formattedDate");

const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL } = process.env;

pasport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: GOOGLE_CALLBACK_URL,
    },
    async function (accessToken, refreshToken, profile, done) {
      try {
        let user = await prisma.user.upsert({
          where: { email: profile.emails[0].value },
          update: { googleId: profile.id },
          create: {
            email: profile.emails[0].value,
            isVerified: profile.emails[0].verified,
            googleId: profile.id,
            createdAt: formattedDate(new Date()),
            updatedAt: formattedDate(new Date()),
            userProfile: {
              create: {
                fullName: profile.displayName,
                profilePicture: profile.photos[0].value,
                createdAt: formattedDate(new Date()),
                updatedAt: formattedDate(new Date()),
              },
            },
          },
        });
        done(null, user);
      } catch (err) {
        done(err, null);
      }
    }
  )
);

module.exports = passport;
