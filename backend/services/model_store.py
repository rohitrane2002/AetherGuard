import shutil
import tarfile
import tempfile
import zipfile
from pathlib import Path
from typing import Optional
from urllib.request import Request, urlopen

from huggingface_hub import snapshot_download

from config import settings


REQUIRED_MODEL_FILES = {"config.json", "tokenizer_config.json"}


def _looks_like_model_dir(path: Path) -> bool:
    return path.exists() and REQUIRED_MODEL_FILES.issubset({item.name for item in path.iterdir()})


def _download_archive(url: str, destination: Path, token: Optional[str] = None) -> None:
    destination.mkdir(parents=True, exist_ok=True)

    with tempfile.TemporaryDirectory() as tmpdir:
        archive_path = Path(tmpdir) / "model_bundle"
        headers = {"User-Agent": "AetherGuard/1.0"}
        if token:
            headers["Authorization"] = f"Bearer {token}"

        request = Request(url, headers=headers)
        with urlopen(request) as response, archive_path.open("wb") as archive_file:
            shutil.copyfileobj(response, archive_file)

        suffix = Path(url).suffix.lower()
        if suffix == ".zip":
            with zipfile.ZipFile(archive_path) as archive:
                archive.extractall(destination)
        elif suffix in {".gz", ".tgz"} or url.endswith(".tar.gz"):
            with tarfile.open(archive_path) as archive:
                archive.extractall(destination)
        else:
            raise RuntimeError(
                "Unsupported MODEL_SOURCE_URL archive format. Use a .zip or .tar.gz model bundle."
            )

        extracted_dirs = [item for item in destination.iterdir() if item.is_dir()]
        if len(extracted_dirs) == 1 and not _looks_like_model_dir(destination):
            extracted_root = extracted_dirs[0]
            for item in extracted_root.iterdir():
                shutil.move(str(item), destination / item.name)
            extracted_root.rmdir()


def ensure_model_dir() -> Path:
    model_dir = settings.model_dir

    if _looks_like_model_dir(model_dir):
        return model_dir

    if settings.model_repo_id:
        snapshot_download(
            repo_id=settings.model_repo_id,
            revision=settings.model_revision,
            local_dir=str(model_dir),
            token=settings.hf_token,
            local_dir_use_symlinks=False,
        )
        if _looks_like_model_dir(model_dir):
            return model_dir
        raise RuntimeError(f"Downloaded Hugging Face repo does not contain a valid model at {model_dir}")

    if settings.model_source_url:
        _download_archive(settings.model_source_url, model_dir, token=settings.hf_token)
        if _looks_like_model_dir(model_dir):
            return model_dir
        raise RuntimeError(f"Downloaded archive did not contain a valid model at {model_dir}")

    if settings.allow_base_model_fallback:
        return Path("microsoft/codebert-base")

    raise RuntimeError(
        "No trained model found. Set MODEL_REPO_ID or MODEL_SOURCE_URL, or deploy the trained model into MODEL_DIR."
    )
