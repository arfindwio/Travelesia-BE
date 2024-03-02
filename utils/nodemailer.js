const nodemailer = require("nodemailer");
const ejs = require("ejs");

const { SMTP_USER, SMTP_PASS } = process.env;

module.exports = {
  sendEmail: async (to, subject, html) => {
    try {
      const transport = nodemailer.createTransport({
        host: "smtp.gmail.com",
        secure: true,
        auth: {
          user: SMTP_USER,
          pass: SMTP_PASS,
        },
      });

      const mailOptions = {
        from: SMTP_USER,
        to,
        subject,
        html,
      };

      await new Promise((resolve, reject) => {
        transport.sendMail(mailOptions, (err, info) => {
          if (err) {
            console.error(err);
            reject(err);
          } else {
            resolve(info);
          }
        });
      });
    } catch (error) {
      console.error(error);
    }
  },
  getHtml: (fileName, data) => {
    return new Promise((resolve, reject) => {
      const path = `${__dirname}/../views/templates/${fileName}`;

      ejs.renderFile(path, data, (err, data) => {
        if (err) {
          return reject(err);
        }
        return resolve(data);
      });
    });
  },
};
