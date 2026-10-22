import sqlite3
import os

def init_db():
    # Ensure backend directory exists
    os.makedirs('backend', exist_ok=True)
    
    # Conectar a SQLite (crea el archivo si no existe)
    conn = sqlite3.connect('backend/m360_sports.db')
    cursor = conn.cursor()

    # Crear tabla de Jugadores (Paso 1: Alta en Pantalla)
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS jugadores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre_completo TEXT NOT NULL,
        fecha_nacimiento DATE NOT NULL,
        posicion TEXT,
        dorsal INTEGER,
        talla_inicial_cm REAL,
        peso_inicial_kg REAL,
        fase_ludologica TEXT NOT NULL
    )
    ''')

    # Crear tabla de Evaluaciones Técnicas (Paso 2: Evaluación Puntual)
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS evaluaciones_tecnicas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        jugador_id INTEGER NOT NULL,
        fecha_evaluacion DATETIME DEFAULT CURRENT_TIMESTAMP,
        score_biomecanica INTEGER CHECK(score_biomecanica >= 0 AND score_biomecanica <= 100),
        score_iq_perceptivo INTEGER CHECK(score_iq_perceptivo >= 0 AND score_iq_perceptivo <= 100),
        score_decision_tactica INTEGER CHECK(score_decision_tactica >= 0 AND score_decision_tactica <= 100),
        diagnostico_ia TEXT,
        prescripcion_microciclo TEXT,
        FOREIGN KEY (jugador_id) REFERENCES jugadores (id)
    )
    ''')

    # Insertar un par de jugadores de prueba basados en el diseño
    cursor.execute("SELECT count(*) FROM jugadores")
    if cursor.fetchone()[0] == 0:
        cursor.execute('''
        INSERT INTO jugadores (nombre_completo, fecha_nacimiento, posicion, dorsal, fase_ludologica)
        VALUES ('Juan Pérez', '2012-05-14', 'Volante Interior', 8, 'SUMA I')
        ''')
        cursor.execute('''
        INSERT INTO jugadores (nombre_completo, fecha_nacimiento, posicion, dorsal, fase_ludologica)
        VALUES ('Carlos Méndez', '2010-08-21', 'Defensa Central', 5, 'EGO II')
        ''')

    conn.commit()
    conn.close()
    print("Base de datos SQLite inicializada exitosamente.")

if __name__ == '__main__':
    init_db()
