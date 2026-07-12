import psycopg2
import psycopg2.extras

DB_DSN = "dbname=copilote_supervision user=postgres password=postgres host=localhost port=5432"


def get_connection():
    return psycopg2.connect(DB_DSN, cursor_factory=psycopg2.extras.RealDictCursor)


def fetch_all(query: str, params: tuple = ()):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(query, params)
            return cur.fetchall()
    finally:
        conn.close()


def fetch_one(query: str, params: tuple = ()):
    rows = fetch_all(query, params)
    return rows[0] if rows else None
