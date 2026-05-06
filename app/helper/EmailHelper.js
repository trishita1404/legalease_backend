const nodemailer = require("nodemailer");

const SendEmail = async (EmailTo, EmailText, EmailSubject) => {

    const transporter = nodemailer.createTransport({
        service: "gmail",

        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: EmailTo,
        subject: EmailSubject,
        text: EmailText,
    };

    return await transporter.sendMail(mailOptions);
};

module.exports = SendEmail;