const express = require("express");
const authRoutes = require("./modules/auth/authRoutes");
const app = express();

app.use(express.json());

app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
    res.json({
        mensaje: "API de reservas funcionando correctamente"
    });
});

module.exports = app;