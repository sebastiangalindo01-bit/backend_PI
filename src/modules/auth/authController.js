const pool = require("../../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const generarOTP = require("../../utils/generarOTP");

const {
    enviarOTP
} = require("./emailService");

const SALT_ROUNDS = 10;

const registrarUsuario = async (req, res) => {

    try {

        const { nombres, apellidos, email, telefono, contrasena, confirmarContrasena } = req.body;

        if (
            !nombres ||
            !apellidos ||
            !email ||
            !telefono ||
            !contrasena ||
            !confirmarContrasena
        ) {
            return res.status(400).json({
                mensaje: "Todos los campos son obligatorios"
            });
        }

        if (!/^\d{10}$/.test(telefono)) {
            return res.status(400).json({
                mensaje: "El teléfono debe tener exactamente 10 dígitos"
            });
        }

        if (contrasena !== confirmarContrasena) {
            return res.status(400).json({
                mensaje: "Las contraseñas no coinciden"
            });
        }

        if (contrasena.length < 8) {
            return res.status(400).json({
                mensaje: "La contraseña debe tener al menos 8 caracteres"
            });
        }

        const emailExistente = await pool.query(
            `
            SELECT id_usuario
            FROM usuario
            WHERE email = $1
            `,
            [email]
        );

        if (emailExistente.rows.length > 0) {
            return res.status(409).json({
                mensaje: "El correo ya está registrado"
            });
        }

        const telefonoExistente = await pool.query(
            `
            SELECT id_usuario
            FROM usuario
            WHERE telefono = $1
            `,
            [telefono]
        );

        if (telefonoExistente.rows.length > 0) {
            return res.status(409).json({
                mensaje: "El teléfono ya está registrado"
            });
        }

        const passwordHash = await bcrypt.hash(
            contrasena,
            SALT_ROUNDS
        );

        const nuevoUsuario = await pool.query(
            `
            INSERT INTO usuario
            (
                nombres,
                apellidos,
                email,
                telefono,
                contrasena,
                rol
            )
            VALUES
            (
                $1,
                $2,
                $3,
                $4,
                $5,
                $6
            )
            RETURNING
                id_usuario,
                nombres,
                apellidos,
                email,
                telefono,
                rol
            `,
            [
                nombres,
                apellidos,
                email,
                telefono,
                passwordHash,
                "EGRESADO"
            ]
        );

        res.status(201).json({
            mensaje: "Usuario registrado exitosamente",
            usuario: nuevoUsuario.rows[0]
        });

    } catch (error) {

        console.error(
            "Error registrando usuario:",
            error
        );

        res.status(500).json({
            mensaje: "Error interno del servidor"
        });

    }

};
const loginUsuario = async (req, res) => {

    try {

        const { email, contrasena } = req.body;

        if (!email || !contrasena) {
            return res.status(400).json({
                mensaje: "Email y contraseña son obligatorios"
            });
        }

        const resultado = await pool.query(
            `
            SELECT
                id_usuario,
                nombres,
                apellidos,
                email,
                telefono,
                contrasena,
                rol
            FROM usuario
            WHERE email = $1
            `,
            [email]
        );

        if (resultado.rows.length === 0) {
            return res.status(401).json({
                mensaje: "Correo o contraseña incorrectos"
            });
        }

        const usuario = resultado.rows[0];

        const passwordValida = await bcrypt.compare(
            contrasena,
            usuario.contrasena
        );

        if (!passwordValida) {
            return res.status(401).json({
                mensaje: "Correo o contraseña incorrectos"
            });
        }

        const token = jwt.sign(
            {
                id_usuario: usuario.id_usuario,
                email: usuario.email,
                rol: usuario.rol
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "8h"
            }
        );

        res.status(200).json({
            mensaje: "Login exitoso",
            token,
            usuario: {
                id_usuario: usuario.id_usuario,
                nombres: usuario.nombres,
                apellidos: usuario.apellidos,
                email: usuario.email,
                telefono: usuario.telefono,
                rol: usuario.rol
            }
        });

    } catch (error) {

        console.error("Error en login:", error);

        res.status(500).json({
            mensaje: "Error interno del servidor"
        });

    }

};

const recuperarPassword = async (req, res) => {

    try {

        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                mensaje: "El email es obligatorio"
            });
        }

        const resultado = await pool.query(
            `
            SELECT
                id_usuario,
                email
            FROM usuario
            WHERE email = $1
            `,
            [email]
        );

        if (resultado.rows.length === 0) {
            return res.status(200).json({
                mensaje: "Si el correo existe, se enviará un código"
            });
        }

        const usuario = resultado.rows[0];

        const codigo = generarOTP();
        const expiracion = new Date(Date.now() + 15 * 60 * 1000);

        await pool.query(
            `
            INSERT INTO codigos_verificacion
            (
                id_usuario,
                codigo,
                expiracion
            )
            VALUES
            (
                $1,
                $2,
                $3
            )
            `,
            [
                usuario.id_usuario,
                codigo,
                expiracion
            ]
        );

        await enviarOTP(
            email,
            codigo
        );

        res.status(200).json({
            mensaje: "Código enviado correctamente"
        });

    } catch (error) {

        console.error(
            "Error recuperando contraseña:",
            error
        );

        res.status(500).json({
            mensaje: "Error interno del servidor"
        });

    }

};

const verificarCodigo = async (req, res) => {

    try {

        const { email, codigo } = req.body;

        if (!email || !codigo) {
            return res.status(400).json({
                mensaje: "Email y código son obligatorios"
            });
        }

        const resultadoUsuario = await pool.query(
            `
            SELECT
                id_usuario
            FROM usuario
            WHERE email = $1
            `,
            [email]
        );

        if (resultadoUsuario.rows.length === 0) {
            return res.status(404).json({
                mensaje: "Usuario no encontrado"
            });
        }

        const idUsuario =
            resultadoUsuario.rows[0].id_usuario;

        const resultadoCodigo = await pool.query(
            `
            SELECT
                id_verificacion,
                codigo,
                usado,
                expiracion
            FROM codigos_verificacion
            WHERE
                id_usuario = $1
                AND codigo = $2
            ORDER BY id_verificacion DESC
            LIMIT 1
            `,
            [
                idUsuario,
                codigo
            ]
        );

        if (resultadoCodigo.rows.length === 0) {
            return res.status(400).json({
                mensaje: "Código incorrecto"
            });
        }

        const otp = resultadoCodigo.rows[0];

        if (otp.usado) {
            return res.status(400).json({
                mensaje: "El código ya fue utilizado"
            });
        }

        const ahora = new Date();
        const expiracion = new Date(
            otp.expiracion
        );

        if (ahora > expiracion) {
            return res.status(400).json({
                mensaje: "El código expiró"
            });
        }

        await pool.query(
            `
            UPDATE codigos_verificacion
            SET usado = true
            WHERE id_verificacion = $1
            `,
            [otp.id_verificacion]
        );

        const tokenRecuperacion =
            crypto.randomBytes(32).toString("hex");

        await pool.query(
            `
            UPDATE codigos_verificacion
            SET token_recuperacion = $1
            WHERE id_verificacion = $2
            `,
            [
                tokenRecuperacion,
                otp.id_verificacion
            ]
        );

        res.status(200).json({
            mensaje: "Código verificado correctamente",
            token_recuperacion: tokenRecuperacion
        });

    } catch (error) {

        console.error(
            "Error verificando código:",
            error
        );

        res.status(500).json({
            mensaje: "Error interno del servidor"
        });

    }

};

const nuevaPassword = async (req, res) => {

    try {

        const {
            token_recuperacion,
            nuevaContrasena
        } = req.body;

        if (
            !token_recuperacion ||
            !nuevaContrasena
        ) {
            return res.status(400).json({
                mensaje: "Todos los campos son obligatorios"
            });
        }

        if (nuevaContrasena.length < 8) {
            return res.status(400).json({
                mensaje: "La contraseña debe tener al menos 8 caracteres"
            });
        }

        const resultado = await pool.query(
            `
            SELECT
                id_verificacion,
                id_usuario  
            FROM codigos_verificacion
            WHERE token_recuperacion = $1
            `,
            [token_recuperacion]
        );

        if (resultado.rows.length === 0) {
            return res.status(400).json({
                mensaje: "Token inválido"
            });
        }

        const registro = resultado.rows[0];

        const passwordHash = await bcrypt.hash(
            nuevaContrasena,
            SALT_ROUNDS
        );

        await pool.query(
            `
            UPDATE usuario
            SET contrasena = $1
            WHERE id_usuario = $2
            `,
            [
                passwordHash,
                registro.id_usuario
            ]
        );

        await pool.query(
            `
            UPDATE codigos_verificacion
            SET token_recuperacion = NULL
            WHERE id_verificacion = $1
            `,
            [registro.id_verificacion]
        );

        res.status(200).json({
            mensaje: "Contraseña actualizada correctamente"
        });

    } catch (error) {

        console.error(
            "Error actualizando contraseña:",
            error
        );

        res.status(500).json({
            mensaje: "Error interno del servidor"
        });

    }

};

module.exports = {
    registrarUsuario,
    loginUsuario,
    recuperarPassword,
    verificarCodigo,
    nuevaPassword
};