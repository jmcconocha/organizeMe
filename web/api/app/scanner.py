"""Folder scanner for discovering git repositories and extracting metadata"""

import os
import json
import subprocess
from pathlib import Path
from typing import List, Dict, Any, Optional
from datetime import datetime


def is_git_repo(path: str) -> bool:
    """Check if a directory is a git repository"""
    git_dir = os.path.join(path, '.git')
    return os.path.isdir(git_dir)


def get_git_info(repo_path: str) -> Dict[str, Any]:
    """Extract git information from a repository"""
    info = {
        'current_branch': None,
        'remote_url': None,
        'last_commit_date': None,
        'last_commit_message': None,
    }
    
    try:
        # Get current branch
        result = subprocess.run(
            ['git', 'branch', '--show-current'],
            cwd=repo_path,
            capture_output=True,
            text=True,
            timeout=5
        )
        if result.returncode == 0:
            info['current_branch'] = result.stdout.strip()
        
        # Get remote URL
        result = subprocess.run(
            ['git', 'remote', 'get-url', 'origin'],
            cwd=repo_path,
            capture_output=True,
            text=True,
            timeout=5
        )
        if result.returncode == 0:
            info['remote_url'] = result.stdout.strip()
        
        # Get last commit info
        result = subprocess.run(
            ['git', 'log', '-1', '--format=%ci|%s'],
            cwd=repo_path,
            capture_output=True,
            text=True,
            timeout=5
        )
        if result.returncode == 0 and result.stdout.strip():
            parts = result.stdout.strip().split('|', 1)
            if len(parts) == 2:
                info['last_commit_date'] = parts[0]
                info['last_commit_message'] = parts[1]
    
    except (subprocess.TimeoutExpired, subprocess.SubprocessError, FileNotFoundError):
        pass
    
    return info


def detect_tech_stack(repo_path: str) -> Dict[str, Any]:
    """Detect technologies used in the repository based on files present"""
    tech_stack = {
        'languages': [],
        'frameworks': [],
        'tools': [],
        'package_managers': []
    }
    
    # Check for various technology indicator files
    indicators = {
        'package.json': {'language': 'JavaScript/Node.js', 'pm': 'npm'},
        'requirements.txt': {'language': 'Python', 'pm': 'pip'},
        'Pipfile': {'language': 'Python', 'pm': 'pipenv'},
        'poetry.lock': {'language': 'Python', 'pm': 'poetry'},
        'Gemfile': {'language': 'Ruby', 'pm': 'bundler'},
        'go.mod': {'language': 'Go', 'pm': 'go modules'},
        'Cargo.toml': {'language': 'Rust', 'pm': 'cargo'},
        'pom.xml': {'language': 'Java', 'pm': 'maven'},
        'build.gradle': {'language': 'Java/Kotlin', 'pm': 'gradle'},
        'composer.json': {'language': 'PHP', 'pm': 'composer'},
        'pubspec.yaml': {'language': 'Dart/Flutter'},
        'Package.swift': {'language': 'Swift'},
        '.csproj': {'language': 'C#/.NET'},
        'tsconfig.json': {'language': 'TypeScript'},
    }
    
    framework_indicators = {
        'next.config.js': 'Next.js',
        'vue.config.js': 'Vue.js',
        'angular.json': 'Angular',
        'gatsby-config.js': 'Gatsby',
        'nuxt.config.js': 'Nuxt.js',
        'svelte.config.js': 'Svelte',
        'vite.config.js': 'Vite',
        'webpack.config.js': 'Webpack',
        'Dockerfile': 'Docker',
        'docker-compose.yml': 'Docker Compose',
        '.github/workflows': 'GitHub Actions',
        'Makefile': 'Make',
    }
    
    # Scan for indicator files
    for root, dirs, files in os.walk(repo_path):
        # Skip common directories to avoid
        dirs[:] = [d for d in dirs if d not in ['.git', 'node_modules', 'venv', '.venv', 'dist', 'build', '__pycache__', '.next', 'target']]
        
        # Check root level only for most indicators
        if root == repo_path:
            for file in files:
                if file in indicators:
                    indicator = indicators[file]
                    if 'language' in indicator and indicator['language'] not in tech_stack['languages']:
                        tech_stack['languages'].append(indicator['language'])
                    if 'pm' in indicator and indicator['pm'] not in tech_stack['package_managers']:
                        tech_stack['package_managers'].append(indicator['pm'])
                
                if file in framework_indicators:
                    fw = framework_indicators[file]
                    if fw not in tech_stack['frameworks']:
                        tech_stack['frameworks'].append(fw)
            
            # Check for directories that indicate frameworks
            if '.github' in dirs:
                workflows_path = os.path.join(root, '.github', 'workflows')
                if os.path.isdir(workflows_path) and os.listdir(workflows_path):
                    if 'GitHub Actions' not in tech_stack['tools']:
                        tech_stack['tools'].append('GitHub Actions')
    
    # Try to extract more info from package.json
    if 'JavaScript/Node.js' in tech_stack['languages']:
        package_json_path = os.path.join(repo_path, 'package.json')
        if os.path.exists(package_json_path):
            try:
                with open(package_json_path, 'r') as f:
                    pkg = json.load(f)
                    deps = {**pkg.get('dependencies', {}), **pkg.get('devDependencies', {})}
                    
                    # Detect popular frameworks
                    if 'react' in deps and 'React' not in tech_stack['frameworks']:
                        tech_stack['frameworks'].append('React')
                    if 'vue' in deps and 'Vue.js' not in tech_stack['frameworks']:
                        tech_stack['frameworks'].append('Vue.js')
                    if 'express' in deps and 'Express.js' not in tech_stack['frameworks']:
                        tech_stack['frameworks'].append('Express.js')
                    if '@nestjs/core' in deps and 'NestJS' not in tech_stack['frameworks']:
                        tech_stack['frameworks'].append('NestJS')
            except (json.JSONDecodeError, IOError):
                pass
    
    return tech_stack


def scan_directory(root_path: str, max_depth: int = 3) -> List[Dict[str, Any]]:
    """
    Scan a directory tree for git repositories
    
    Args:
        root_path: Root directory to start scanning
        max_depth: Maximum depth to recurse (0 = only root, 1 = one level deep, etc.)
    
    Returns:
        List of dictionaries containing repo information
    """
    discovered_repos = []
    root_path = os.path.abspath(root_path)
    
    if not os.path.isdir(root_path):
        return discovered_repos
    
    def scan_recursive(current_path: str, current_depth: int):
        # Check if current path is a git repo
        if is_git_repo(current_path):
            repo_name = os.path.basename(current_path)
            git_info = get_git_info(current_path)
            tech_stack = detect_tech_stack(current_path)
            
            discovered_repos.append({
                'name': repo_name,
                'path': current_path,
                'git_info': git_info,
                'tech_stack': tech_stack,
                'discovered_at': datetime.utcnow().isoformat()
            })
            # Don't recurse into subdirectories of a git repo
            return
        
        # If not at max depth, scan subdirectories
        if current_depth < max_depth:
            try:
                entries = os.listdir(current_path)
                for entry in entries:
                    # Skip hidden directories and common non-project directories
                    if entry.startswith('.') or entry in ['node_modules', 'venv', '.venv', 'dist', 'build', '__pycache__']:
                        continue
                    
                    entry_path = os.path.join(current_path, entry)
                    if os.path.isdir(entry_path):
                        scan_recursive(entry_path, current_depth + 1)
            except PermissionError:
                # Skip directories we can't access
                pass
    
    scan_recursive(root_path, 0)
    return discovered_repos


def extract_readme_description(repo_path: str) -> Optional[str]:
    """Try to extract a description from README file"""
    readme_files = ['README.md', 'README.rst', 'README.txt', 'README']
    
    for readme in readme_files:
        readme_path = os.path.join(repo_path, readme)
        if os.path.exists(readme_path):
            try:
                with open(readme_path, 'r', encoding='utf-8') as f:
                    content = f.read(500)  # Read first 500 chars
                    # Try to extract first meaningful line (skip titles)
                    lines = [line.strip() for line in content.split('\n') if line.strip()]
                    for line in lines:
                        if not line.startswith('#') and len(line) > 20:
                            return line[:200]
            except (IOError, UnicodeDecodeError):
                pass
    
    return None
