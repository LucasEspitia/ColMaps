from hashlib import sha256
from pathlib import Path
from urllib.request import urlopen


DATASET_URL = (
    "https://download.geofabrik.de/"
    "south-america/colombia-260901.osm.pbf"
)

EXPECTED_SHA256 = (
    "94f936ae50a2050cdab53103d7ab63ed"
    "6bd4b3e9e9b67ebea0ebbe752f115c58"
)

RAW_DIR = Path(__file__).resolve().parent.parent / "raw"
OUTPUT_PATH = RAW_DIR / "colombia-260901.osm.pbf"
TEMP_PATH = OUTPUT_PATH.with_suffix(OUTPUT_PATH.suffix + ".tmp")


def calculate_sha256(path: Path) -> str:
    """Calculate the SHA-256 checksum of a file."""
    digest = sha256()

    with path.open("rb") as file:
        for chunk in iter(lambda: file.read(1024 * 1024), b""):
            digest.update(chunk)

    return digest.hexdigest()


def verify_dataset(path: Path) -> bool:
    """Verify that the dataset matches the expected snapshot."""
    print("Verifying dataset integrity...")

    actual_hash = calculate_sha256(path)

    if actual_hash != EXPECTED_SHA256:
        print(f"Expected SHA-256: {EXPECTED_SHA256}")
        print(f"Actual SHA-256:   {actual_hash}")
        return False

    print("Dataset integrity verified.")
    return True


def download_with_progress(url: str, destination: Path) -> None:
    """Download a file while displaying progress."""
    with urlopen(url) as response:
        total_size = int(response.headers.get("Content-Length", 0))
        downloaded = 0
        chunk_size = 1024 * 1024  # 1 MB

        with destination.open("wb") as output:
            while chunk := response.read(chunk_size):
                output.write(chunk)
                downloaded += len(chunk)

                if total_size:
                    progress = downloaded / total_size * 100
                    downloaded_mb = downloaded / (1024 * 1024)
                    total_mb = total_size / (1024 * 1024)

                    print(
                        f"\rDownloading: "
                        f"{progress:6.2f}% "
                        f"({downloaded_mb:.1f}/{total_mb:.1f} MB)",
                        end="",
                        flush=True,
                    )

    print()


def download_dataset() -> None:
    """Download the fixed GeoFabrik dataset snapshot."""
    RAW_DIR.mkdir(parents=True, exist_ok=True)

    # Reuse the dataset when the correct snapshot already exists.
    if OUTPUT_PATH.exists():
        print(f"Dataset already exists: {OUTPUT_PATH}")

        if verify_dataset(OUTPUT_PATH):
            return

        raise RuntimeError(
            "Existing dataset does not match the expected snapshot."
        )

    print(f"Downloading dataset from:\n{DATASET_URL}")

    try:
        download_with_progress(DATASET_URL, TEMP_PATH)

        if not verify_dataset(TEMP_PATH):
            TEMP_PATH.unlink(missing_ok=True)
            raise RuntimeError(
                "Downloaded dataset failed integrity verification."
            )

        TEMP_PATH.replace(OUTPUT_PATH)

    except Exception:
        TEMP_PATH.unlink(missing_ok=True)
        raise

    print(f"Dataset ready: {OUTPUT_PATH}")


if __name__ == "__main__":
    download_dataset()