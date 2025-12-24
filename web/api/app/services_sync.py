"""Shared repository sync logic (commits, PRs, releases)."""

from datetime import datetime, timedelta
from typing import Optional

from sqlalchemy.orm import Session

from app.github_client import GitHubClient, parse_repo_full_name
from app.models import Activity, Repository


async def sync_repository(db: Session, repo: Repository) -> Repository:
    """Sync a repository's metadata and activities using public GitHub API."""
    owner_login, repo_name = parse_repo_full_name(repo.full_name)
    github = GitHubClient(token=None)  # Use public API

    # Commits (last 7 days)
    commits = await github.get_repository_commits(
        owner_login,
        repo_name,
        since=datetime.utcnow() - timedelta(days=7),
    )
    if commits:
        for commit in commits:
            exists = db.query(Activity).filter(
                Activity.repository_id == repo.id,
                Activity.activity_type == "commit",
                Activity.url == commit.get("html_url"),
            ).first()
            if exists:
                continue
            activity = Activity(
                project_id=repo.project_id,
                repository_id=repo.id,
                activity_type="commit",
                title=(commit.get("commit", {}).get("message", "").split("\n")[0] or "Commit"),
                description=commit.get("commit", {}).get("message"),
                url=commit.get("html_url"),
                author=commit.get("commit", {}).get("author", {}).get("name"),
                timestamp=datetime.fromisoformat(
                    commit.get("commit", {})
                    .get("author", {})
                    .get("date", datetime.utcnow().isoformat())
                    .replace("Z", "+00:00")
                ),
            )
            db.add(activity)

    # Pull requests
    pulls = await github.get_repository_pulls(owner_login, repo_name, state="all")
    if pulls:
        for pr in pulls:
            exists = db.query(Activity).filter(
                Activity.repository_id == repo.id,
                Activity.activity_type == "pull_request",
                Activity.url == pr.get("html_url"),
            ).first()
            if exists:
                continue
            activity = Activity(
                project_id=repo.project_id,
                repository_id=repo.id,
                activity_type="pull_request",
                title=pr.get("title"),
                description=pr.get("body"),
                url=pr.get("html_url"),
                author=(pr.get("user") or {}).get("login"),
                timestamp=datetime.fromisoformat(
                    (pr.get("created_at") or datetime.utcnow().isoformat()).replace("Z", "+00:00")
                ),
            )
            db.add(activity)

    # Releases
    releases = await github.get_repository_releases(owner_login, repo_name)
    if releases:
        for release in releases:
            exists = db.query(Activity).filter(
                Activity.repository_id == repo.id,
                Activity.activity_type == "release",
                Activity.url == release.get("html_url"),
            ).first()
            if exists:
                continue
            activity = Activity(
                project_id=repo.project_id,
                repository_id=repo.id,
                activity_type="release",
                title=release.get("name") or release.get("tag_name"),
                description=release.get("body"),
                url=release.get("html_url"),
                author=(release.get("author") or {}).get("login"),
                timestamp=datetime.fromisoformat(
                    (release.get("published_at") or datetime.utcnow().isoformat()).replace("Z", "+00:00")
                ),
            )
            db.add(activity)

    # Repo metadata
    repo_info = await github.get_repository(owner_login, repo_name)
    if repo_info:
        repo.stars = repo_info.get("stargazers_count", 0)
        repo.forks = repo_info.get("forks_count", 0)
        repo.open_issues = repo_info.get("open_issues_count", 0)

    repo.last_synced = datetime.utcnow()
    db.commit()
    db.refresh(repo)
    return repo
