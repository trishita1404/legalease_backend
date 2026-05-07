const nodemailer = require("nodemailer");

const SendEmail = async (EmailTo, EmailText, EmailSubject) => {

    try {

        let transporter = nodemailer.createTransport({

            service: "gmail",

            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },

            family: 4, // FORCE IPV4 (IMPORTANT FIX)

        });

        await transporter.verify();

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

        console.log("EMAIL HELPER ERROR:");
        console.log(error);

        throw error;
    }
};

module.exports = SendEmail;