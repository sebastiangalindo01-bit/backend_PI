const express = require("express");

const {
    registrarUsuario,
    loginUsuario,
    recuperarPassword,
    verificarCodigo,
    nuevaPassword
} = require("./authController");

const verificarToken = require("../../middlewares/authMiddleware");

const router = express.Router();

router.post("/register", registrarUsuario);
router.post("/login", loginUsuario);
router.post("/recuperar-password", recuperarPassword);
router.post("/verificar-codigo", verificarCodigo);
router.post("/nueva-password", nuevaPassword);

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