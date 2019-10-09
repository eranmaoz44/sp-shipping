import os
import psycopg2

DATABASE_URL = os.environ['DATABASE_URL']


class DBConnecter(object):
    def __init__(self):
        pass


    @staticmethod
    def execute_write_query(query, parameters=()):
        conn = psycopg2.connect(DATABASE_URL)

        # Open a cursor to perform database operations
        cur = conn.cursor()

        # Execute a command: this creates a new table
        #cur.execute("CREATE TABLE shipping (id varchar PRIMARY KEY, order_number varchar, image_path varchar);")

        # Pass data to fill a query placeholders and let Psycopg perform
        # the correct conversion (no more SQL injections!)
        #cur.execute("INSERT INTO test (num, data) VALUES (%s, %s)",(100, "abc'def"))
        cur.execute(query, parameters)

        # Query the database and obtain data as Python objects
        #>> > cur.execute("SELECT * FROM test;")
        #>> > cur.fetchone()
        #(1, 100, "abc'def")

        # Make the changes to the database persistent
        conn.commit()

        # Close communication with the database
        cur.close()
        conn.close()

    @staticmethod
    def execute_read_query(query, parameters=()):
        conn = psycopg2.connect(DATABASE_URL)

        # Open a cursor to perform database operations
        cur = conn.cursor()

        # Execute a command: this creates a new table
        #cur.execute("CREATE TABLE shipping (id varchar PRIMARY KEY, order_number varchar, image_path varchar);")

        # Pass data to fill a query placeholders and let Psycopg perform
        # the correct conversion (no more SQL injections!)
        #cur.execute("INSERT INTO test (num, data) VALUES (%s, %s)",(100, "abc'def"))
        cur.execute(query, parameters)

        res = cur.fetchall()

        # Query the database and obtain data as Python objects
        #>> > cur.execute("SELECT * FROM test;")
        #>> > cur.fetchone()
        #(1, 100, "abc'def")

        # Make the changes to the database persistent
        conn.commit()

        # Close communication with the database
        cur.close()
        conn.close()

        return res