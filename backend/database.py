import sqlite3
import json
import os

DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'database.db')


def get_connection(db_path: str = DB_PATH):
    return sqlite3.connect(db_path)


def init_db(db_path: str = DB_PATH, seed_json: str = os.path.join(os.path.dirname(__file__), '..', 'data.json')):
    conn = get_connection(db_path)
    c = conn.cursor()
    c.execute('CREATE TABLE IF NOT EXISTS players (name TEXT PRIMARY KEY, data TEXT)')
    conn.commit()
    c.execute('SELECT COUNT(*) FROM players')
    count = c.fetchone()[0]
    if count == 0 and os.path.exists(seed_json):
        with open(seed_json, 'r', encoding='utf-8') as f:
            data = json.load(f)
        for name, pdata in data.items():
            c.execute('INSERT INTO players (name, data) VALUES (?, ?)', (name, json.dumps(pdata)))
        conn.commit()
    conn.close()


def load_all(db_path: str = DB_PATH):
    conn = get_connection(db_path)
    c = conn.cursor()
    c.execute('SELECT name, data FROM players')
    rows = c.fetchall()
    conn.close()
    return {name: json.loads(data) for name, data in rows}


def load_player(name: str, db_path: str = DB_PATH):
    conn = get_connection(db_path)
    c = conn.cursor()
    c.execute('SELECT data FROM players WHERE name=?', (name,))
    row = c.fetchone()
    conn.close()
    return json.loads(row[0]) if row else None


def save_all(data: dict, db_path: str = DB_PATH):
    conn = get_connection(db_path)
    c = conn.cursor()
    for name, pdata in data.items():
        c.execute('INSERT OR REPLACE INTO players (name, data) VALUES (?, ?)',
                  (name, json.dumps(pdata)))
    conn.commit()
    conn.close()
