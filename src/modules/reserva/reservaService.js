const pool = require('../../config/db');

const crearReserva = async({
    id_usuario,
    id_laboratorio,
    fecha,
    horaInicio,
    horaFin
}) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

    //Verificar el usuario

    const usuarioResult = await client.query(
        `
        SELECT 
            id_usuario,
            rol,
            tipo_usuario
        FROM 
            usuario
        WHERE id_usuario = $1
        `, 
        [id_usuario]
    );

    if (usuarioResult.rows.length === 0) {
        throw new Error('Usuario no encontrado');
    }

    const usuario = usuarioResult.rows[0];
    
    //Verificar el rol del usuario

    if (usuario.rol !== 'USUARIO' || !['ESTUDIANTE', 'EGRESADO'].includes(usuario.tipo_usuario)) {
        throw new Error('Solo los estudiantes y egresados pueden realizar reservas');
    }

    //Verificar el laboratorio

    const laboratorioResult = await client.query(
        `
        SELECT 
            id_laboratorio,
            nombre,
            estado,
            capacidad
        FROM laboratorio
        WHERE id_laboratorio = $1
        `, 
        [id_laboratorio]
    );

    if (laboratorioResult.rows.length === 0) {
        throw new Error('Laboratorio no encontrado');
    }

    const laboratorio = laboratorioResult.rows[0];

    //Verificar el estado del laboratorio

    if (laboratorio.estado !== 'DISPONIBLE') {
        throw new Error('El laboratorio no está disponible para reservas actualmente');
    }

    //Verificar la fecha

    const fechaResult = await client.query(
        `
        SELECT CURRENT_DATE <= $1 AS fecha_valida
        `,
        [fecha]
    );

    if (!fechaResult.rows[0].fecha_valida) {
        throw new Error('No se puede realizar una reserva para una fecha pasada');
    }

    //Verificar el horario de la reserva

    const horarioResult = await client.query(
        `
        SELECT id_horario
        FROM horario
        WHERE dia_semana = EXTRACT(ISODOW FROM $1::date)
         AND $2::time >= hora_apertura
         AND $3::time <= hora_cierre
        `,
        [fecha, horaInicio, horaFin]
    );

    if (horarioResult.rows.length === 0) {
        throw new Error('El horario de la reserva no está dentro del horario de funcionamiento del laboratorio');
    }

    //Verificar si el usuario tiene otra reserva en el mismo horario

    const reservaUsuarioResult = await client.query(
        `
        SELECT id_reserva
        FROM reserva
        WHERE id_usuario = $1
            AND fecha = $2
            AND estado IN ('PENDIENTE', 'CONFIRMADA')
            AND hora_inicio < $4::time
            AND hora_fin > $3::time
        LIMIT 1
        `,
        [id_usuario, fecha, horaInicio, horaFin]
    );

    if (reservaUsuarioResult.rows.length > 0) {
        throw new Error('Ya tienes una reserva en el mismo horario');
    }

    //Contar las reservas que se cruzan en el mismo horario

    const disponibilidadResult = await client.query(
        `
        SELECT COUNT(*) AS reservas_actuales
        FROM reserva
        WHERE id_laboratorio = $1
            AND fecha = $2
            AND estado IN ('PENDIENTE', 'CONFIRMADA')
            AND hora_inicio < $4::time
            AND hora_fin > $3::time
        `,
        [id_laboratorio, fecha, horaInicio, horaFin]
    );

    const reservasActuales = Number(disponibilidadResult.rows[0].reservas_actuales);

    //Verificar la capacidad del laboratorio

    if(reservasActuales >= laboratorio.capacidad) {
        throw new Error('No hay cupos disponibles para el laboratorio en el horario seleccionado');
    }

    //Crear la reserva

    const nuevaReserva = await client.query(
        `
        INSERT INTO reserva (
        id_usuario, 
        id_laboratorio, 
        fecha, hora_inicio,
         hora_fin, 
         estado
        )
        VALUES ($1, $2, $3, $4, $5, 'PENDIENTE')
        RETURNING *
        `,
        [id_usuario, id_laboratorio, fecha, horaInicio, horaFin]
    );

    await client.query('COMMIT');
    
    return nuevaReserva.rows[0];

    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

//Obtener todas las reservas

const obtenerReservas = async (id_usuario = null) => {
    const consulta = `
        SELECT
            r.id_reserva,
            r.id_usuario,
            u.nombres,
            u.apellidos,
            r.id_laboratorio,
            l.nombre AS laboratorio,
            r.fecha,
            r.hora_inicio,
            r.hora_fin,
            r.estado,
            r.fecha_creacion
        FROM reserva AS r
        INNER JOIN usuario AS u
            ON r.id_usuario = u.id_usuario
        INNER JOIN laboratorio AS l
            ON r.id_laboratorio = l.id_laboratorio
        ${id_usuario !== null ? 'WHERE r.id_usuario = $1' : ''}
        ORDER BY r.fecha DESC, r.hora_inicio DESC
    `;

    const parametros = id_usuario !== null ? [id_usuario] : [];
    const result = await pool.query(consulta, parametros);

    return result.rows;
};


const obtenerReservaPorId = async (id_reserva) => {
    const result = await pool.query(
        `SELECT 
            r.id_reserva,
            r.id_usuario,
            u.nombres,
            u.apellidos,
            r.id_laboratorio,
            l.nombre AS laboratorio, 
            r.fecha,
            r.hora_inicio,
            r.hora_fin,
            r.estado,
            r.fecha_creacion
        FROM reserva AS r
        INNER JOIN usuario AS u ON r.id_usuario = u.id_usuario
        INNER JOIN laboratorio AS l ON r.id_laboratorio = l.id_laboratorio
        WHERE r.id_reserva = $1
        `, [id_reserva]);

        return result.rows;
};

const editarReserva = async (
    id_reserva,
    id_usuario,
    id_laboratorio,
    fecha,
    horaInicio,
    horaFin
) => {
    const client = await pool.connect();

    try {

        await client.query('BEGIN');

        //Verificar si la reserva existe y pertenece al usuario
        const reservaResult = await client.query(
            `SELECT * FROM reserva WHERE id_reserva = $1 AND id_usuario = $2` , [id_reserva, id_usuario]);

            if (reservaResult.rows.length === 0) {
                throw new Error('Reserva no encontrada o no pertenece al usuario');
            }

            const reserva = reservaResult.rows[0];

            if(reserva.estado === 'CANCELADA' || reserva.estado === 'FINALIZADA') {
                throw new Error('No se pueden editar reservas CANCELADAS o FINALIZADAS');
            }

            //Verificar el laboratorio

            const laboratorioResult = await client.query(
                `SELECT 
                estado, capacidad
                FROM laboratorio
                WHERE id_laboratorio = $1
                `, [id_laboratorio]
            );
            
            if (laboratorioResult.rows.length === 0) {
                throw new Error('Laboratorio no encontrado');
            }

            if(laboratorioResult.rows[0].estado !== 'DISPONIBLE') {
                throw new Error('El laboratorio no está disponible para reservas actualmente');
            }

            //Verificar la fecha

            const fechaResult = await client.query(
                `SELECT CURRENT_DATE <= $1::date AS valida`, [fecha]
            );

            if (!fechaResult.rows[0].valida) {
                throw new Error('No se puede realizar una reserva para una fecha pasada');
            }

            //Verificar el horario de la reserva

            const horarioResult = await client.query(
                `SELECT id_horario
                FROM horario
                WHERE dia_semana = EXTRACT(ISODOW FROM $1::date)
                AND $2::time >= hora_apertura
                AND $3::time <= hora_cierre
                `, [fecha, horaInicio, horaFin]
            );

            if (horarioResult.rows.length === 0) {
                throw new Error('El horario de la reserva no está dentro del horario de funcionamiento del laboratorio');
            }

            //Verificar si el usuario tiene otra reserva en el mismo horario

            const cruceUsuario = await client.query(
                `SELECT id_reserva
                FROM reserva
                WHERE id_usuario = $1
                AND id_reserva <> $2
                AND fecha = $3
                AND estado IN ('PENDIENTE', 'CONFIRMADA')
                AND hora_inicio < $5::time
                AND hora_fin > $4::time
                LIMIT 1
                `, [id_usuario, id_reserva, fecha, horaInicio, horaFin]
            );

            if(cruceUsuario.rows.length > 0) {
                throw new Error('Ya tienes una reserva en el mismo horario');
            }

            //Verificar la capacidad del laboratorio

            const capacidadResult = await client.query(
                `SELECT COUNT(*) AS reservas_actuales
                FROM reserva
                WHERE id_laboratorio = $1
                AND id_reserva <> $2
                AND fecha = $3
                AND estado IN ('PENDIENTE', 'CONFIRMADA')
                AND hora_inicio < $5::time
                AND hora_fin > $4::time
                `, [id_laboratorio, id_reserva, fecha, horaInicio, horaFin]
            );

            const reservasActuales = Number(capacidadResult.rows[0].reservas_actuales);

            if(reservasActuales >= laboratorioResult.rows[0].capacidad) {
                throw new Error('No hay cupos disponibles para el laboratorio en el horario seleccionado');
            }

            //Actualizar la reserva

            const updateResult = await client.query(
                `UPDATE reserva
                SET id_laboratorio = $1,
                    fecha = $2, 
                    hora_inicio = $3,
                    hora_fin = $4
                WHERE id_reserva = $5
                RETURNING *
                `, [id_laboratorio, fecha, horaInicio, horaFin, id_reserva]
            );

                await client.query('COMMIT');

                return updateResult.rows[0];
    } catch (error) {
        
        await client.query('ROLLBACK');
        throw error;
                    
    } finally {
        client.release();
    }

};


const cancelarReserva = async (id_reserva, id_usuario) => {

        const result = await pool.query(    
            `UPDATE reserva
            SET estado = 'CANCELADA'
            WHERE id_reserva = $1 
            AND id_usuario = $2
            RETURNING *
            `, [id_reserva, id_usuario]
        );

        if (result.rows.length === 0) {
            throw new Error('Reserva no encontrada o no puede ser cancelada');
        }

        return result.rows[0];
};


module.exports = {
    crearReserva,
    obtenerReservas,
    obtenerReservaPorId,
    editarReserva,
    cancelarReserva
};