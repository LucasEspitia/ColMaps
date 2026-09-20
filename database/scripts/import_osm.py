import argparse
import getpass
import os
import subprocess
from pathlib import Path

import psycopg # type: ignore
from dotenv import load_dotenv #type: ignore

PROJECT_ROOT = Path(__file__).resolve().parents[2]

load_dotenv(PROJECT_ROOT / ".env")


PBF_PATH = (
    PROJECT_ROOT
    / "data-pipeline"
    / "processed"
    / "colombia-colmaps.osm.pbf"
)

LUA_CONFIG_PATH = (
    PROJECT_ROOT
    / "database"
    / "osm2pgsql"
    / "colmaps.lua"
)


DB_NAME = os.getenv("DB_NAME", "colmaps")
DB_USER = os.getenv("DB_USER", "colmaps")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")

OUTPUT_TABLE = "osm_features"
PROPERTIES_TABLE = "osm2pgsql_properties"


def validate_inputs() -> None:
    """Verify that all required import inputs exist."""
    required_files = [
        PBF_PATH,
        LUA_CONFIG_PATH,
    ]

    for path in required_files:
        if not path.exists():
            raise FileNotFoundError(
                f"Required import input not found: {path}"
            )


def get_database_password() -> str:
    """Get the database password from the environment or prompt securely."""
    password = os.getenv("DB_PASSWORD")

    if password:
        return password

    return getpass.getpass(
        f"Password for PostgreSQL user '{DB_USER}': "
    )


def get_connection(password: str):
    """Create a PostgreSQL connection."""
    return psycopg.connect(
        dbname=DB_NAME,
        user=DB_USER,
        password=password,
        host=DB_HOST,
        port=DB_PORT,
    )


def table_exists(connection, table_name: str) -> bool:
    """Check whether a table exists in the public schema."""
    with connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT to_regclass(%s);
            """,
            (f"public.{table_name}",),
        )

        return cursor.fetchone()[0] is not None


def get_feature_count(connection) -> int:
    """Return the number of imported ColMaps features."""
    with connection.cursor() as cursor:
        cursor.execute(
            f"SELECT COUNT(*) FROM public.{OUTPUT_TABLE};"
        )

        return cursor.fetchone()[0]


def imported_dataset_exists(connection) -> bool:
    """Check whether the ColMaps dataset has already been imported."""
    if not table_exists(connection, OUTPUT_TABLE):
        return False

    count = get_feature_count(connection)

    return count > 0


def clean_previous_import(connection) -> None:
    """Remove tables created by the ColMaps osm2pgsql import."""
    print("Removing previous osm2pgsql import...")

    with connection.cursor() as cursor:
        cursor.execute(
            f"DROP TABLE IF EXISTS public.{OUTPUT_TABLE};"
        )

        cursor.execute(
            f"DROP TABLE IF EXISTS public.{PROPERTIES_TABLE};"
        )

    connection.commit()

    print("Previous import removed.")


def run_osm2pgsql(password: str) -> None:
    """Import the prepared OSM dataset using osm2pgsql Flex output."""
    print("\nStarting osm2pgsql import...")
    print(f"Dataset:     {PBF_PATH}")
    print(f"Flex config: {LUA_CONFIG_PATH}")
    print(
        f"Database:    "
        f"{DB_USER}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    )

    command = [
        "osm2pgsql",
        "--create",
        "-O",
        "flex",
        "-S",
        str(LUA_CONFIG_PATH),
        "-d",
        DB_NAME,
        "-U",
        DB_USER,
        "-H",
        DB_HOST,
        "-P",
        DB_PORT,
        str(PBF_PATH),
    ]

    environment = os.environ.copy()

    # libpq reads PGPASSWORD automatically.
    environment["PGPASSWORD"] = password

    subprocess.run(
        command,
        env=environment,
        check=True,
    )


def validate_import(connection) -> None:
    """Validate the imported PostGIS dataset."""
    if not table_exists(connection, OUTPUT_TABLE):
        raise RuntimeError(
            f"Expected table was not created: {OUTPUT_TABLE}"
        )

    with connection.cursor() as cursor:
        cursor.execute(
            f"""
            SELECT
                COUNT(*),
                COUNT(*) FILTER (WHERE geom IS NULL)
            FROM public.{OUTPUT_TABLE};
            """
        )

        feature_count, null_geometries = cursor.fetchone()

    if feature_count == 0:
        raise RuntimeError(
            "Import completed but no features were created."
        )

    if null_geometries > 0:
        raise RuntimeError(
            f"Import contains {null_geometries} null geometries."
        )

    print("\nImport validation successful.")
    print(f"Imported features: {feature_count:,}")
    print("Null geometries:   0")


def run_import(force: bool = False) -> None:
    """Run the complete ColMaps PostGIS import workflow."""
    validate_inputs()

    password = get_database_password()

    try:
        with get_connection(password) as connection:
            if imported_dataset_exists(connection):
                feature_count = get_feature_count(connection)

                if not force:
                    print("ColMaps dataset is already imported.")
                    print(
                        f"Existing features: {feature_count:,}"
                    )
                    print("Skipping PostGIS import.")
                    print(
                        "Use --force to recreate the imported dataset."
                    )
                    return

                print(
                    f"Existing import found: "
                    f"{feature_count:,} features."
                )

                clean_previous_import(connection)

            elif force:
                # Clean possible incomplete previous imports.
                clean_previous_import(connection)

    except psycopg.Error as error:
        raise RuntimeError(
            "Could not connect to the ColMaps PostgreSQL database."
        ) from error

    run_osm2pgsql(password)

    with get_connection(password) as connection:
        validate_import(connection)

    print("\nPostGIS import completed successfully.")


def parse_arguments() -> argparse.Namespace:
    """Parse command-line arguments."""
    parser = argparse.ArgumentParser(
        description=(
            "Import the prepared ColMaps OSM dataset into PostGIS."
        )
    )

    parser.add_argument(
        "--force",
        action="store_true",
        help="Delete the existing import and recreate it.",
    )

    return parser.parse_args()


def main() -> None:
    args = parse_arguments()

    run_import(force=args.force)


if __name__ == "__main__":
    main()