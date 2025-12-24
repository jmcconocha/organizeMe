"""GitHub integration utilities for repository tracking and activity sync"""

import os
import httpx
from typing import Optional, Dict, List, Any
from datetime import datetime, timedelta

GITHUB_API_BASE = "https://api.github.com"

class GitHubClient:
    def __init__(self, token: Optional[str] = None):
        """Initialize GitHub client with optional personal access token"""
        self.token = token
        self.headers = {
            "Accept": "application/vnd.github.v3+json",
        }
        if token:
            self.headers["Authorization"] = f"token {token}"
    
    async def get_user(self, username: str) -> Optional[Dict[str, Any]]:
        """Get GitHub user by username"""
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    f"{GITHUB_API_BASE}/users/{username}",
                    headers=self.headers,
                    timeout=10
                )
                response.raise_for_status()
                return response.json()
            except (httpx.HTTPError, httpx.TimeoutException):
                return None
    
    async def get_repository(self, owner: str, repo: str) -> Optional[Dict[str, Any]]:
        """Get repository details"""
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    f"{GITHUB_API_BASE}/repos/{owner}/{repo}",
                    headers=self.headers,
                    timeout=10
                )
                response.raise_for_status()
                return response.json()
            except (httpx.HTTPError, httpx.TimeoutException):
                return None
    
    async def get_user_repositories(self, username: str, page: int = 1) -> Optional[List[Dict[str, Any]]]:
        """Get user's repositories"""
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    f"{GITHUB_API_BASE}/users/{username}/repos",
                    headers=self.headers,
                    params={"sort": "updated", "per_page": 100, "page": page},
                    timeout=10
                )
                response.raise_for_status()
                return response.json()
            except (httpx.HTTPError, httpx.TimeoutException):
                return None
    
    async def get_repository_commits(
        self,
        owner: str,
        repo: str,
        since: Optional[datetime] = None,
        per_page: int = 30
    ) -> Optional[List[Dict[str, Any]]]:
        """Get recent commits from a repository"""
        params = {"per_page": per_page}
        if since:
            params["since"] = since.isoformat()
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    f"{GITHUB_API_BASE}/repos/{owner}/{repo}/commits",
                    headers=self.headers,
                    params=params,
                    timeout=10
                )
                response.raise_for_status()
                return response.json()
            except (httpx.HTTPError, httpx.TimeoutException):
                return None
    
    async def get_repository_pulls(
        self,
        owner: str,
        repo: str,
        state: str = "all",
        per_page: int = 30
    ) -> Optional[List[Dict[str, Any]]]:
        """Get pull requests from a repository"""
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    f"{GITHUB_API_BASE}/repos/{owner}/{repo}/pulls",
                    headers=self.headers,
                    params={"state": state, "per_page": per_page},
                    timeout=10
                )
                response.raise_for_status()
                return response.json()
            except (httpx.HTTPError, httpx.TimeoutException):
                return None
    
    async def get_repository_releases(
        self,
        owner: str,
        repo: str,
        per_page: int = 30
    ) -> Optional[List[Dict[str, Any]]]:
        """Get releases from a repository"""
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    f"{GITHUB_API_BASE}/repos/{owner}/{repo}/releases",
                    headers=self.headers,
                    params={"per_page": per_page},
                    timeout=10
                )
                response.raise_for_status()
                return response.json()
            except (httpx.HTTPError, httpx.TimeoutException):
                return None

def parse_repo_full_name(full_name: str) -> tuple[str, str]:
    """Parse 'owner/repo' into (owner, repo) tuple"""
    parts = full_name.split("/")
    if len(parts) != 2:
        raise ValueError(f"Invalid repo format: {full_name}")
    return parts[0], parts[1]
