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

        const { nombres, apellidos, email, telefono, contrasena, confirmarContrasena, tipo_usuario } = req.body;

        if (
            !nombres ||
            !apellidos ||
            !email ||
            !telefono ||
            !contrasena ||
            !confirmarContrasena ||
            !tipo_usuario
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

        if (!["EGRESADO", "ESTUDIANTE"].includes(tipo_usuario)) {
            return res.status(400).json({
                mensaje: "Debes seleccionar un tipo de persona válido"
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
                rol,
                tipo_usuario
            )
            VALUES
            (
                $1,
                $2,
                $3,
                $4,
                $5,
                $6,
                $7
            )
            RETURNING
                id_usuario,
                nombres,
                apellidos,
                email,
                telefono,
                rol,
                tipo_usuario
            `,
            [
                nombres,
                apellidos,
                email,
                telefono,
                passwordHash,
                "USUARIO",
                tipo_usuario
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
                rol,
                tipo_usuario
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
                rol: usuario.rol,
                tipo_usuario: usuario.tipo_usuario
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


const actualizarPerfil = async (req, res) => {
    try {
        const idUsuario = req.usuario?.id_usuario;
        const { nombres, apellidos, email, telefono } = req.body;

        if (!idUsuario) {
            return res.status(401).json({
                mensaje: "No se pudo identificar al usuario autenticado"
            });
        }

        if (
            typeof nombres !== "string" ||
            typeof apellidos !== "string" ||
            typeof email !== "string" ||
            typeof telefono !== "string" ||
            !nombres.trim() ||
            !apellidos.trim() ||
            !email.trim() ||
            !telefono.trim()
        ) {
            return res.status(400).json({
                mensaje: "Todos los campos son obligatorios"
            });
        }

        const nombreLimpio = nombres.trim();
        const apellidoLimpio = apellidos.trim();
        const emailLimpio = email.trim().toLowerCase();
        const telefonoLimpio = telefono.trim();

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLimpio)) {
            return res.status(400).json({
                mensaje: "Ingresa un correo electrónico válido"
            });
        }

        if (!/^\d{10}$/.test(telefonoLimpio)) {
            return res.status(400).json({
                mensaje: "El teléfono debe tener exactamente 10 dígitos"
            });
        }

        const usuarioExistente = await pool.query(
            `SELECT id_usuario
             FROM usuario
             WHERE (LOWER(email) = $1 OR telefono = $2)
               AND id_usuario <> $3`,
            [emailLimpio, telefonoLimpio, idUsuario]
        );

        if (usuarioExistente.rows.length > 0) {
            return res.status(409).json({
                mensaje: "El correo o el teléfono ya pertenece a otro usuario"
            });
        }

        const resultado = await pool.query(
            `UPDATE usuario
             SET nombres = $1,
                 apellidos = $2,
                 email = $3,
                 telefono = $4
             WHERE id_usuario = $5
             RETURNING
                 id_usuario,
                 nombres,
                 apellidos,
                 email,
                 telefono,
                 rol,
                 tipo_usuario`,
            [
                nombreLimpio,
                apellidoLimpio,
                emailLimpio,
                telefonoLimpio,
                idUsuario
            ]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                mensaje: "Usuario no encontrado"
            });
        }

        const usuario = resultado.rows[0];

        return res.status(200).json({
            mensaje: "Perfil actualizado correctamente",
            usuario
        });

    } catch (error) {
        if (error.code === "23505") {
            return res.status(409).json({
                mensaje: "El correo o el teléfono ya está registrado"
            });
        }

        console.error("Error actualizando perfil:", error);

        return res.status(500).json({
            mensaje: "Error interno del servidor"
        });
    }
};



const cambiarPassword = async (req, res) => {
    try {
        const { contrasenaActual, nuevaContrasena, confirmarContrasena } =
            req.body;

        const idUsuario = req.usuario?.id_usuario;

        if (!idUsuario) {
            return res.status(401).json({
                mensaje: 'No se pudo identificar al usuario autenticado.',
            });
        }

        if (!contrasenaActual || !nuevaContrasena || !confirmarContrasena) {
            return res.status(400).json({
                mensaje: 'Todos los campos de contraseña son obligatorios.',
            });
        }

        if (nuevaContrasena !== confirmarContrasena) {
            return res.status(400).json({
                mensaje: 'Las contraseñas nuevas no coinciden.',
            });
        }

        if (nuevaContrasena === contrasenaActual) {
            return res.status(400).json({
                mensaje: 'La nueva contraseña debe ser diferente a la actual.',
            });
        }

        if (nuevaContrasena.length < 8) {
            return res.status(400).json({
                mensaje: 'La nueva contraseña debe tener al menos 8 caracteres.',
            });
        }

        const resultado = await pool.query(
            `SELECT contrasena
       FROM usuario
       WHERE id_usuario = $1`,
            [idUsuario]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                mensaje: 'Usuario no encontrado.',
            });
        }

        const contrasenaValida = await bcrypt.compare(
            contrasenaActual,
            resultado.rows[0].contrasena
        );

        if (!contrasenaValida) {
            return res.status(400).json({
                mensaje: 'La contraseña actual es incorrecta.',
            });
        }

        const hashNuevo = await bcrypt.hash(nuevaContrasena, 10);

        await pool.query(
            `UPDATE usuario
       SET contrasena = $1
       WHERE id_usuario = $2`,
            [hashNuevo, idUsuario]
        );

        return res.status(200).json({
            success: true,
            mensaje: 'Contraseña actualizada correctamente.',
        });
    } catch (error) {
        console.error('Error al cambiar contraseña:', error);

        return res.status(500).json({
            mensaje: 'Error interno al cambiar la contraseña.',
        });
    }
};


module.exports = {
    registrarUsuario,
    loginUsuario,
    recuperarPassword,
    verificarCodigo,
    nuevaPassword,
    actualizarPerfil,
    cambiarPassword
};