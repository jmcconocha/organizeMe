from fastapi import APIRouter
from pydantic import BaseModel
import os

router = APIRouter(prefix="/api/admin", tags=["admin"])


class AiConfig(BaseModel):
    api_key: str
    model: str | None = None


class AiConfigResponse(BaseModel):
    ai_enabled: bool
    model: str | None = None


class GithubConfig(BaseModel):
    token: str


class GithubConfigResponse(BaseModel):
    github_enabled: bool


@router.get("/ai-config", response_model=AiConfigResponse)
async def get_ai_config():
    api_key = os.getenv("OPENAI_API_KEY")
    model = os.getenv("OPENAI_MODEL", "gpt-4o-mini") if api_key else None
    return AiConfigResponse(ai_enabled=bool(api_key), model=model)


@router.post("/ai-config", response_model=AiConfigResponse)
async def set_ai_config(cfg: AiConfig):
    # Development-only: stores in process env (not persisted). Use secrets store for production.
    os.environ["OPENAI_API_KEY"] = cfg.api_key
    if cfg.model:
        os.environ["OPENAI_MODEL"] = cfg.model
    return AiConfigResponse(ai_enabled=True, model=cfg.model or os.getenv("OPENAI_MODEL", "gpt-4o-mini"))


@router.get("/github-config", response_model=GithubConfigResponse)
async def get_github_config():
    token = os.getenv("GITHUB_TOKEN")
    return GithubConfigResponse(github_enabled=bool(token))


@router.post("/github-config", response_model=GithubConfigResponse)
async def set_github_config(cfg: GithubConfig):
    # Development-only: stores in process env (not persisted). Use secrets store for production.
    os.environ["GITHUB_TOKEN"] = cfg.token
    return GithubConfigResponse(github_enabled=True)
