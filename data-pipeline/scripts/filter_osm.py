import argparse
import subprocess
from pathlib import Path


DATA_PIPELINE_DIR = Path(__file__).resolve().parent.parent
NOTEBOOKS_DIR = DATA_PIPELINE_DIR / "notebooks"

OUTPUT_PBF_PATH = (
    DATA_PIPELINE_DIR
    / "processed"
    / "colombia-colmaps.osm.pbf"
)

NOTEBOOKS = [
    NOTEBOOKS_DIR / "02_define_feature_scope.ipynb",
    NOTEBOOKS_DIR / "03_validate_feature_scope.ipynb",
    NOTEBOOKS_DIR / "04_prepare_osm_dataset.ipynb",
]


def print_progress(current: int, total: int, notebook_name: str) -> None:
    """Display the current notebook pipeline progress."""
    bar_length = 30
    progress = current / total

    filled = int(bar_length * progress)
    bar = "#" * filled + "-" * (bar_length - filled)

    print(
        f"\n[{bar}] "
        f"{current}/{total} "
        f"({progress * 100:.0f}%) "
        f"{notebook_name}"
    )


def validate_notebooks() -> None:
    """Verify that all required notebooks exist."""
    for notebook in NOTEBOOKS:
        if not notebook.exists():
            raise FileNotFoundError(
                f"Required notebook not found: {notebook}"
            )

def run_notebook(notebook: Path) -> None:
    """Execute a pipeline notebook in place."""
    print(f"Running: {notebook.name}")

    result = subprocess.run(
        [
            "jupyter",
            "nbconvert",
            "--to",
            "notebook",
            "--execute",
            "--inplace",
            str(notebook),
        ],
        cwd=NOTEBOOKS_DIR,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
    )

    if result.returncode != 0:
        print(result.stdout)
        print(result.stderr)

        raise RuntimeError(
            f"Notebook execution failed: {notebook.name}"
        )

    print(f"Completed: {notebook.name}")


def run_pipeline(force: bool = False) -> None:
    """Execute the reproducible ColMaps filtering pipeline."""
    print("Starting ColMaps filtering pipeline...")

    validate_notebooks()

    if OUTPUT_PBF_PATH.exists() and not force:
        print(
            f"Processed dataset already exists:\n"
            f"{OUTPUT_PBF_PATH}"
        )
        print("Skipping filtering pipeline.")
        print("Use --force to regenerate the dataset.")
        return

    if force and OUTPUT_PBF_PATH.exists():
        print("Force mode enabled. Regenerating processed dataset.")

    total = len(NOTEBOOKS)

    for index, notebook in enumerate(NOTEBOOKS, start=1):
        print_progress(index, total, notebook.name)
        run_notebook(notebook)

    if not OUTPUT_PBF_PATH.exists():
        raise RuntimeError(
            "Filtering pipeline completed, but the expected "
            f"output was not created: {OUTPUT_PBF_PATH}"
        )

    print_progress(total, total, "Pipeline completed")

    print(
        f"\nFiltering pipeline completed successfully.\n"
        f"Processed dataset: {OUTPUT_PBF_PATH}"
    )


def parse_arguments() -> argparse.Namespace:
    """Parse command-line arguments."""
    parser = argparse.ArgumentParser(
        description="Run the ColMaps OSM filtering pipeline."
    )

    parser.add_argument(
        "--force",
        action="store_true",
        help="Regenerate the processed dataset even if it already exists.",
    )

    return parser.parse_args()


def main() -> None:
    args = parse_arguments()
    run_pipeline(force=args.force)


if __name__ == "__main__":
    main()