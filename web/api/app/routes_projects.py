from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Project, Repository, Activity
from app.schemas import Project as ProjectSchema, ProjectCreate, ProjectUpdate, ProjectSummary
from typing import List, Optional
from datetime import datetime, timedelta
import os

try:
    from openai import OpenAI
except ImportError:  # pragma: no cover - optional dependency
    OpenAI = None

router = APIRouter(prefix="/api/projects", tags=["projects"])

@router.get("", response_model=List[ProjectSchema])
async def list_projects(
    skip: int = 0,
    limit: int = 100,
    status: str = None,
    db: Session = Depends(get_db)
):
    """List all projects (single-user mode)"""
    query = db.query(Project)
    if status:
        query = query.filter(Project.status == status)
    projects = query.order_by(Project.position).offset(skip).limit(limit).all()
    return projects

@router.post("", response_model=ProjectSchema)
async def create_project(
    project: ProjectCreate,
    db: Session = Depends(get_db)
):
    """Create a new project"""
    db_project = Project(**project.dict())
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project

@router.get("/{project_id}", response_model=ProjectSchema)
async def get_project(
    project_id: int,
    db: Session = Depends(get_db)
):
    """Get a specific project"""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@router.patch("/{project_id}", response_model=ProjectSchema)
async def update_project(
    project_id: int,
    project_update: ProjectUpdate,
    db: Session = Depends(get_db)
):
    """Update a project"""
    db_project = db.query(Project).filter(Project.id == project_id).first()
    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    for key, value in project_update.dict(exclude_unset=True).items():
        setattr(db_project, key, value)
    
    db.commit()
    db.refresh(db_project)
    return db_project

@router.delete("/{project_id}")
async def delete_project(
    project_id: int,
    db: Session = Depends(get_db)
):
    """Delete a project"""
    db_project = db.query(Project).filter(Project.id == project_id).first()
    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    db.delete(db_project)
    db.commit()
    return {"deleted": True}


def _health_label(days_since_activity: Optional[int]) -> str:
    if days_since_activity is None:
        return "unknown"
    if days_since_activity <= 14:
        return "healthy"
    if days_since_activity <= 45:
        return "stale"
    return "dormant"


def _build_recommendations(has_repos: bool, health: str, open_issues: int, last_synced: datetime | None) -> list[str]:
    recs: list[str] = []
    if not has_repos:
        recs.append("Link a repository to track activity and generate insights.")
    if health in {"stale", "dormant"}:
        recs.append("Sync repositories to pull recent commits/PRs and reassess priority.")
    if open_issues > 0:
        recs.append("Review open issues to triage work or close stale tickets.")
    if last_synced is None:
        recs.append("Run a sync to fetch repository metadata and activity.")
    return recs or ["No immediate actions detected."]


def _summarize_project(db: Session, project: Project) -> ProjectSummary:
    now = datetime.utcnow()
    repos = db.query(Repository).filter(Repository.project_id == project.id).all()
    activities = db.query(Activity).filter(Activity.project_id == project.id).order_by(Activity.timestamp.desc()).limit(200).all()

    last_activity_ts = activities[0].timestamp if activities else None
    days_since_activity = (now - last_activity_ts).days if last_activity_ts else None
    health = _health_label(days_since_activity)

    last_synced_ts = None
    if repos:
        last_synced_ts = max([r.last_synced for r in repos if r.last_synced], default=None)

    repo_count = len(repos)
    open_issues = sum((r.open_issues or 0) for r in repos)

    summary_parts = []
    if repo_count == 0:
        summary_parts.append("No repositories linked yet.")
    else:
        summary_parts.append(f"{repo_count} repo(s) linked, {open_issues} open issues.")

    if last_activity_ts:
        summary_parts.append(f"Last activity {days_since_activity} day(s) ago.")
    else:
        summary_parts.append("No recent activity recorded.")

    if last_synced_ts:
        sync_age_days = (now - last_synced_ts).days
        summary_parts.append(f"Last sync {sync_age_days} day(s) ago.")
    else:
        summary_parts.append("Not synced yet.")

    summary_text = " ".join(summary_parts)

    recs = _build_recommendations(repo_count > 0, health, open_issues, last_synced_ts)

    ai_available = bool(os.getenv("OPENAI_API_KEY")) or os.getenv("AI_AGENT_ENABLED", "false").lower() == "true"

    return ProjectSummary(
        project_id=project.id,
        status=project.status or "backlog",
        health=health,
        repo_count=repo_count,
        open_issues=open_issues,
        last_activity_at=last_activity_ts,
        last_synced_at=last_synced_ts,
        summary=summary_text,
        recommendations=recs,
        generator="heuristic" if not ai_available else "heuristic+ai",
        ai_available=ai_available,
    )


def _ai_client() -> Optional[OpenAI]:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key or not OpenAI:
        return None
    return OpenAI(api_key=api_key)


async def _summarize_project_ai(project: Project, summary: ProjectSummary) -> Optional[ProjectSummary]:
    client = _ai_client()
    if not client:
        return None

    model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    system_prompt = "You are a concise project portfolio assistant. Summarize project health and next steps."
    user_prompt = (
        f"Project: {project.name}\n"
        f"Domain: {project.domain}\n"
        f"Phase: {project.phase}\n"
        f"Complexity: {project.complexity}\n"
        f"Status: {summary.status}\n"
        f"Repos: {summary.repo_count}\n"
        f"Open issues: {summary.open_issues}\n"
        f"Health: {summary.health}\n"
        f"Last activity: {summary.last_activity_at}\n"
        f"Last sync: {summary.last_synced_at}\n"
        f"Heuristic summary: {summary.summary}\n"
        "Provide: 1) A one-line status, 2) 2-3 bullet recommendations focused on actionability."
    )

    try:
        resp = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.3,
            max_tokens=220,
        )
        content = resp.choices[0].message.content.strip()
        # Split into first line + bullets
        lines = [line.strip() for line in content.split("\n") if line.strip()]
        if not lines:
            return None
        one_liner = lines[0].lstrip("-• ")
        recs = [line.lstrip("-• ").strip() for line in lines[1:]] or summary.recommendations
        return ProjectSummary(
            project_id=summary.project_id,
            status=summary.status,
            health=summary.health,
            repo_count=summary.repo_count,
            open_issues=summary.open_issues,
            last_activity_at=summary.last_activity_at,
            last_synced_at=summary.last_synced_at,
            summary=one_liner,
            recommendations=recs,
            generator="ai",
            ai_available=True,
        )
    except Exception:
        return None


@router.get("/{project_id}/summary", response_model=ProjectSummary)
async def get_project_summary(
    project_id: int,
    strategy: str = "heuristic",  # heuristic | ai
    db: Session = Depends(get_db)
):
    """Compute a project status/summary. Uses heuristics; optionally upgraded with AI when enabled."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    summary = _summarize_project(db, project)

    if strategy == "ai":
        ai_summary = await _summarize_project_ai(project, summary)
        if ai_summary:
            return ai_summary
    return summary
