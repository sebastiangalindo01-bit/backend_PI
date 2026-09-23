const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const enviarOTP = async (correoDestino, codigo) => {

    try {

        await transporter.sendMail({

            from: `"Reservas Salas Uceva" <${process.env.EMAIL_USER}>`,

            to: correoDestino,

            subject: "🔒 Código de recuperación de contraseña",

            html: `
                <div style="
                    font-family: Arial, sans-serif;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 30px;
                    border: 1px solid #e5e5e5;
                    border-radius: 12px;
                ">
                    <h2 style="
                        color: #222;
                        text-align: center;
                    ">
                        Reservas Salas Uceva
                    </h2>

                    <p>Hola,</p>

                    <p>
                        Hemos recibido una solicitud para restablecer tu contraseña.
                    </p>

                    <p>
                        Utiliza el siguiente código de verificación:
                    </p>

                    <div style="
                        text-align: center;
                        margin: 30px 0;
                    ">
                        <span style="
                            display: inline-block;
                            padding: 15px 30px;
                            font-size: 32px;
                            font-weight: bold;
                            letter-spacing: 5px;
                            background-color: #f5f5f5;
                            border-radius: 10px;
                        ">
                            ${codigo}
                        </span>
                    </div>

                    <p>
                        Este código expirará en
                        <strong>15 minutos</strong>.
                    </p>

                    <p>
                        Si no solicitaste este cambio,
                        puedes ignorar este correo.
                    </p>

                    <hr style="
                        margin: 25px 0;
                        border: none;
                        border-top: 1px solid #ddd;
                    ">

                    <p style="
                        font-size: 12px;
                        color: #777;
                        text-align: center;
                    ">
                        Reservas Salas Uceva © 2026
                    </p>
                </div>
            `

        });

    } catch (error) {

        console.error(
            "Error enviando correo OTP:",
            error
        );

        throw error;
    }
};

module.exports = {
    enviarOTP
};