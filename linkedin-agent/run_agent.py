import os, subprocess, sys
from pathlib import Path

_project_dir = Path(__file__).resolve().parent

env_path = _project_dir / '.env'
if env_path.exists():
    for line in env_path.read_text(encoding='utf-8').splitlines():
        line = line.strip()
        if line and not line.startswith('#') and '=' in line:
            key, _, val = line.partition('=')
            os.environ.setdefault(key.strip(), val.strip())

sys.path.insert(0, str(_project_dir))
from agent import run
run()
