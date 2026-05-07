const nodemailer = require("nodemailer");

const SendEmail = async (EmailTo, EmailText, EmailSubject) => {

    try {

        const transporter = nodemailer.createTransport({

            host: "smtp.gmail.com",
            port: 465,
            secure: true,

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

        const info = await transporter.sendMail(mailOptions);

        console.log("EMAIL SENT:", info.response);

        return info;

    } catch (error) {

        console.log("EMAIL ERROR:");
        console.log(error);

        throw error;
    }
};

module.exports = SendEmail;