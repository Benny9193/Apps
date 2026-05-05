#!/usr/bin/env bash
# Copy a template into apps/<name>.
#
# Usage: scripts/new-app.sh <template> <name>
#   <template> is one of the directories under templates/
#   <name>     is the new app's directory under apps/
#
# Example: scripts/new-app.sh web-react todo-list
set -euo pipefail

repo_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
templates_dir="$repo_root/templates"
apps_dir="$repo_root/apps"

usage() {
  echo "Usage: $0 <template> <name>" >&2
  echo "" >&2
  echo "Available templates:" >&2
  if [ -d "$templates_dir" ]; then
    for t in "$templates_dir"/*/; do
      [ -d "$t" ] && echo "  - $(basename "$t")" >&2
    done
  fi
  exit 64
}

[ $# -eq 2 ] || usage

template="$1"
name="$2"
src="$templates_dir/$template"
dest="$apps_dir/$name"

if [ ! -d "$src" ]; then
  echo "error: template '$template' not found at $src" >&2
  usage
fi

if [[ ! "$name" =~ ^[a-zA-Z0-9._-]+$ ]]; then
  echo "error: name '$name' must match [a-zA-Z0-9._-]+" >&2
  exit 64
fi

if [ -e "$dest" ]; then
  echo "error: $dest already exists" >&2
  exit 1
fi

mkdir -p "$apps_dir"
cp -R "$src" "$dest"

echo "Created $dest from template '$template'."
echo "Next: cd apps/$name && cat README.md"
