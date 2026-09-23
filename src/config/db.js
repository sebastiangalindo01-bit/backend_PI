const { Pool } = require("pg"); // Importamos el módulo 'pg' para trabajar con PostgreSQL
const dotenv = require("dotenv"); // Importamos el módulo 'dotenv' para cargar las variables de entorno desde el archivo .env

dotenv.config(); // Cargamos las variables de entorno desde el archivo .env

const pool = new Pool({ // Creamos una nueva instancia de Pool para gestionar las conexiones a la base de datos
    host: process.env.DB_HOST, // Obtenemos el host de la base de datos desde las variables de entorno
    port: process.env.DB_PORT, // Obtenemos el puerto de la base de datos desde las variables de entorno
    database: process.env.DB_NAME, // Obtenemos el nombre de la base de datos desde las variables de entorno
    user: process.env.DB_USER, // Obtenemos el usuario de la base de datos desde las variables de entorno
    password: process.env.DB_PASSWORD // Obtenemos la contraseña de la base de datos desde las variables de entorno
});

module.exports = pool; // Exportamos la instancia de Pool para que pueda ser utilizada en otras partes de la aplicación