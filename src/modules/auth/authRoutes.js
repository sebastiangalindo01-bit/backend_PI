const express = require("express");

const {
    registrarUsuario,
    loginUsuario,
    recuperarPassword,
    verificarCodigo,
    nuevaPassword,
    actualizarPerfil,
    cambiarPassword
} = require("./authController");

const verificarToken = require("../../middlewares/authMiddleware");

const router = express.Router();

router.post("/register", registrarUsuario);
router.post("/login", loginUsuario);
router.post("/recuperar-password", recuperarPassword);
router.post("/verificar-codigo", verificarCodigo);
router.post("/nueva-password", nuevaPassword);
router.put("/perfil", verificarToken, actualizarPerfil);
router.put('/cambiar-password', verificarToken, cambiarPassword);

router.get(
    "/perfil",
    verificarToken,
    (req, res) => {

        res.json({
            mensaje: "Acceso permitido",
            usuario: req.usuario
        });

    }
);



module.exports = router;