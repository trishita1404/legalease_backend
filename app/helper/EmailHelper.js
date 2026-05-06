const nodemailer = require("nodemailer");

const SendEmail = async (EmailTo, EmailText, EmailSubject) => {

    let transporter = nodemailer.createTransport({
        service: "gmail",

        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },

        family: 4,
    });

    let mailOptions = {
        from: `LegalEase+ <${process.env.EMAIL_FROM}>`,
        to: EmailTo,
        subject: EmailSubject,
        text: EmailText,
    };

    return await transporter.sendMail(mailOptions);
};

module.exports = SendEmail;