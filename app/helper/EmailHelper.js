const nodemailer = require("nodemailer");

const SendEmail = async (EmailTo, EmailText, EmailSubject) => {

    let transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,

        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },

        family: 4,
    });

    let mailOptions = {
        from: process.env.EMAIL_USER,
        to: EmailTo,
        subject: EmailSubject,
        text: EmailText,
    };

    return await transporter.sendMail(mailOptions);
};

module.exports = SendEmail;