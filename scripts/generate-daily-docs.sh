#!/bin/bash

# generate-daily-docs.sh
# Script to generate daily documentation using repomix
# This script should be run at the end of each working day

# Exit on any error
set -e

# Get today's date in YYYY-MM-DD format
TODAY=$(date +"%Y-%m-%d")
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Create directories if they don't exist
mkdir -p "$PROJECT_ROOT/docs/summaries/changes"
mkdir -p "$PROJECT_ROOT/docs/summaries/metrics"

# Log script start
echo "Generating documentation for $TODAY..."

# Get list of files changed today
echo "Finding files changed today..."
git diff --name-only $(git rev-list --all --since="00:00:00" --until="23:59:59") HEAD > "$PROJECT_ROOT/docs/summaries/daily-changed-files.txt"

# Generate summary of only today's changed files using repomix
echo "Generating repomix summary..."
repomix --include-from-file "$PROJECT_ROOT/docs/summaries/daily-changed-files.txt" \
  --style markdown \
  --output "$PROJECT_ROOT/docs/summaries/changes/daily-changes-${TODAY}.md"

# Record test coverage if test:coverage script exists
if grep -q "\"test:coverage\"" "$PROJECT_ROOT/package.json"; then
  echo "Recording test coverage metrics..."
  npm run test:coverage > "$PROJECT_ROOT/docs/summaries/metrics/test-coverage-${TODAY}.txt"
fi

# Record performance metrics if benchmark script exists
if grep -q "\"benchmark\"" "$PROJECT_ROOT/package.json"; then
  echo "Recording performance metrics..."
  npm run benchmark > "$PROJECT_ROOT/docs/summaries/metrics/performance-${TODAY}.txt"
fi

# Update project status document with template if it doesn't exist
if [ ! -f "$PROJECT_ROOT/docs/project-status.md" ]; then
  echo "Creating project status document..."
  cat > "$PROJECT_ROOT/docs/project-status.md" << EOF
# Project Status

Last Updated: **\`${TODAY}\`**

## Daily Status Summary

Status: 🟢 **On Track**

### Today's Activities

- 

### Active Tasks

| Task ID | Status | Assignee | Progress | Due Date |
|---------|--------|----------|----------|----------|
| | | | | |

### Current Blockers

- 

### Progress Metrics

- Tasks completed today: 
- Tests added: 
- Test coverage: 
- Pull requests merged: 
- Code review comments addressed: 

### Daily Change Summary

[View today's code changes](docs/summaries/changes/daily-changes-${TODAY}.md)

## Sprint Overview

- Sprint: 
- Start Date: 
- End Date: 
- Days Remaining: 
- Tasks Completed: 

## Notes

- 
EOF
fi

# Update last updated timestamp in project status
sed -i'.bak' "s/Last Updated: \*\*\`.*\`\*\*/Last Updated: \*\*\`${TODAY}\`\*\*/" "$PROJECT_ROOT/docs/project-status.md"
sed -i'.bak' "s|\[View today's code changes\](docs/summaries/changes/daily-changes-.*\.md)|\[View today's code changes\](docs/summaries/changes/daily-changes-${TODAY}.md)|" "$PROJECT_ROOT/docs/project-status.md"
rm -f "$PROJECT_ROOT/docs/project-status.md.bak"

# Add a git commit with the documentation updates
echo "Committing documentation changes..."
git add "$PROJECT_ROOT/docs/summaries/changes/daily-changes-${TODAY}.md"
git add "$PROJECT_ROOT/docs/project-status.md"
git add "$PROJECT_ROOT/docs/summaries/metrics/"
git commit -m "docs: update project documentation for ${TODAY}"

echo "Documentation generation complete for $TODAY"
echo "Don't forget to update your project status document with today's activities!" 