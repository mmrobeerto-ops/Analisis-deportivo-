-- Esquema de Base de Datos para M-360 Sports IQ (Supabase / PostgreSQL)

-- Extensión requerida para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabla de Usuarios (Admin, DT, Padres, etc.)
CREATE TABLE usuarios (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  nombre text NOT NULL,
  email text UNIQUE NOT NULL,
  rol text CHECK (rol IN ('admin', 'dt', 'videoanalista', 'padre', 'jugador'))
);

-- Tabla de Jugadores
CREATE TABLE jugadores (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  nombre text NOT NULL,
  fecha_nacimiento date,
  sub_etapa_ludologica text CHECK (sub_etapa_ludologica IN ('Ego 0', 'Ego I', 'Ego II', 'Suma I', 'Suma II', 'Especializacion')),
  posicion_principal text,
  tutor_id uuid REFERENCES usuarios(id)
);

-- Tabla de Estrategias MBP (Catálogo de tareas)
CREATE TABLE estrategias_mbp (
  id serial PRIMARY KEY,
  numero_estrategia integer UNIQUE NOT NULL,
  nombre_tarea text NOT NULL,
  tipo text CHECK (tipo IN ('Analitica', 'Global', 'Sistemica')),
  fase_objetivo text
);

-- Tabla de Partidos y Sesiones Grabadas
CREATE TABLE partidos_sesiones (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  categoria text,
  fecha timestamp with time zone DEFAULT now(),
  video_url_raw text,
  estado_procesamiento text CHECK (estado_procesamiento IN ('pendiente', 'procesando', 'completado')) DEFAULT 'pendiente'
);

-- Tabla de Evaluaciones y Métricas
CREATE TABLE evaluaciones_analiticas (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  jugador_id uuid REFERENCES jugadores(id),
  partido_id uuid REFERENCES partidos_sesiones(id),
  timestamp_video numeric, -- Momento exacto de la jugada en segundos
  
  -- Métricas Posturales
  angulo_flexion_rodillas numeric,
  perfil_cuerpo_grados numeric,
  
  -- Métricas Cognitivas
  escaneo_cabeza_previo boolean,
  frecuencia_escaneo integer,
  
  -- Resultados Nivel 100 100 100
  causa_raiz text CHECK (causa_raiz IN ('FALLA_PERCEPCION_OJOS', 'FALLA_TACTICA_CABEZA', 'FALLA_TECNICA_PIES', 'CONSOLIDADO')),
  zona_desarrollo text CHECK (zona_desarrollo IN ('ZDR', 'ZDPx', 'ZDPt')),
  puntuacion_100_100_100 numeric
);

-- Tabla de Microciclos Prescriptos (La Receta)
CREATE TABLE microciclos_prescriptos (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  equipo_o_jugador_id uuid, -- Puede referenciar un jugador o un ID de equipo
  fecha_inicio date,
  tarea_mbp_id integer REFERENCES estrategias_mbp(id),
  mindset_audio_url text
);
