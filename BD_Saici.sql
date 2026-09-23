-- Tabla usuario
CREATE TABLE usuario (
	id_usuario serial primary key,
	nombres varchar(100) not null,
	apellidos varchar(100) not null,
	email varchar (100) unique not null,
	telefono varchar (20) unique not null,
	contrasena varchar (255) not null,
	rol varchar (30) not null,

	CONSTRAINT chk_rol_usuario
		CHECK (rol IN ('ADMINISTRADOR', 'EGRESADO'))
);

-- Tabla de laboratorio
CREATE TABLE laboratorio (
    id_laboratorio serial primary key,
    nombre varchar(100) not null,
    ubicacion varchar(150) not null,
    estado varchar(30) not null,
    capacidad smallint not null
);

-- Tabla de reserva
CREATE TABLE reserva (
	id_reserva serial primary key,
	id_usuario integer not null,
    id_laboratorio integer not null,
    fecha date not null,
    hora_inicio time not null,
    hora_fin time not null,
    estado varchar(30) not null,
    fecha_creacion timestamp default current_timestamp,

    CONSTRAINT fk_reserva_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuario(id_usuario),

    CONSTRAINT fk_reserva_laboratorio
        FOREIGN KEY (id_laboratorio)
        REFERENCES laboratorio(id_laboratorio),

    CONSTRAINT chk_horas_reserva
        CHECK (hora_fin > hora_inicio),

    CONSTRAINT chk_estado_reserva
        CHECK (estado IN (
            'PENDIENTE',
            'CONFIRMADA',
            'CANCELADA',
            'FINALIZADA'
        ))
	
);

-- Tabla de horarios laboratorios
CREATE TABLE horario (
    id_horario serial primary key,
    dia_semana smallint not null,
    hora_apertura time not null,
    hora_cierre time not null,

    CONSTRAINT chk_dia_semana
        CHECK (dia_semana BETWEEN 1 AND 7),

    CONSTRAINT chk_horas
        CHECK (hora_cierre > hora_apertura)
);

-- Tabla de codigos de verificacion
CREATE TABLE codigos_verificacion (
    id_verificacion serial primary key,
    id_usuario integer not null,
    codigo varchar(10) not null,
    usado boolean not null default false,
    expiracion timestamp not null,
    token_recuperacion varchar(255),

    CONSTRAINT fk_codigo_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuario(id_usuario)
);

SELECT * FROM usuario;