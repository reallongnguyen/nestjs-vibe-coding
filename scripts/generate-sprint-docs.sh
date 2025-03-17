#!/bin/bash

# generate-sprint-docs.sh
# Script to generate documentation for a sprint using repomix
# Usage: ./generate-sprint-docs.sh <sprint-number> [start-date] [end-date]

# Exit on any error
set -e

# Check if sprint number is provided
if [ $# -lt 1 ]; then
  echo "Usage: $0 <sprint-number> [start-date] [end-date]"
  echo "Example: $0 015 2023-05-29 2023-06-09"
  exit 1
fi

SPRINT_NUM=$1
START_DATE=${2:-""}  # Optional start date, defaults to empty string
END_DATE=${3:-""}    # Optional end date, defaults to empty string
TODAY=$(date +"%Y-%m-%d")
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Create directories if they don't exist
mkdir -p "$PROJECT_ROOT/docs/summaries/changes"

# Log script start
echo "Generating documentation for Sprint $SPRINT_NUM..."

# Get list of files changed during the sprint period
echo "Finding files changed during the sprint..."

if [ -n "$START_DATE" ] && [ -n "$END_DATE" ]; then
  # If dates are specified, use them
  git diff --name-only $(git rev-list --all --since="$START_DATE" --until="$END_DATE") HEAD > "$PROJECT_ROOT/docs/summaries/sprint-changed-files.txt"
else
  # Otherwise use the default of 2 weeks back
  git diff --name-only $(git rev-list --all --before="$(date -d '2 weeks ago' +'%Y-%m-%d')" --until="$(date +'%Y-%m-%d')") HEAD > "$PROJECT_ROOT/docs/summaries/sprint-changed-files.txt"
fi

# Generate summary of only the sprint's changed files
echo "Generating repomix summary..."
repomix --include-from-file "$PROJECT_ROOT/docs/summaries/sprint-changed-files.txt" \
  --style markdown \
  --output "$PROJECT_ROOT/docs/summaries/changes/sprint-${SPRINT_NUM}-changes-${TODAY}.md"

# Create or update sprint history document
SPRINT_HISTORY_PATH="$PROJECT_ROOT/docs/sprint-history.md"

# Check if sprint history file exists
if [ ! -f "$SPRINT_HISTORY_PATH" ]; then
  # Create new sprint history file
  echo "Creating sprint history document..."
  cat > "$SPRINT_HISTORY_PATH" << EOF
# Sprint History

Last Updated: **\`${TODAY}\`**

## Sprint Performance Overview

| Sprint | Dates | Velocity | Completion Rate | Story Points | New Issues |
|--------|-------|----------|-----------------|--------------|------------|
| ${SPRINT_NUM} (Current) | ${START_DATE:-"TBD"} to ${END_DATE:-"TBD"} | - | - | - | - |

## Sprint ${SPRINT_NUM} Summary (Current)

**Sprint Dates:** ${START_DATE:-"TBD"} to ${END_DATE:-"TBD"}
**Velocity:** TBD
**Story Points:** TBD
**Completion Rate:** TBD

### Key Achievements

- 

### Completed Features

- 

### Technical Debt Addressed

- 

### Issues and Blockers

- 

### Lessons Learned

1. 

## Repomix Sprint Summaries

- [Sprint ${SPRINT_NUM} Changes](docs/summaries/changes/sprint-${SPRINT_NUM}-changes-${TODAY}.md)

EOF
else
  # Update existing sprint history document
  echo "Updating sprint history document..."
  
  # Update last updated date
  sed -i'.bak' "s/Last Updated: \*\*\`.*\`\*\*/Last Updated: \*\*\`${TODAY}\`\*\*/" "$SPRINT_HISTORY_PATH"
  
  # Check if sprint already exists in the document
  if grep -q "## Sprint ${SPRINT_NUM} Summary" "$SPRINT_HISTORY_PATH"; then
    # Update existing sprint section
    echo "Updating existing sprint in history document..."
    
    # Update repomix summary link
    sed -i'.bak' "s|\[Sprint ${SPRINT_NUM} Changes\](docs/summaries/changes/sprint-${SPRINT_NUM}-changes-.*\.md)|\[Sprint ${SPRINT_NUM} Changes\](docs/summaries/changes/sprint-${SPRINT_NUM}-changes-${TODAY}.md)|" "$SPRINT_HISTORY_PATH"
  else
    # Sprint doesn't exist in document, add new sprint section
    echo "Adding new sprint to history document..."
    
    # Add new sprint to the table (at the top of the table, after the header line)
    awk -v sprint="$SPRINT_NUM" -v start="${START_DATE:-TBD}" -v end="${END_DATE:-TBD}" '
    /\| Sprint \| Dates \| Velocity \| Completion Rate \| Story Points \| New Issues \|/ {
      print;
      getline;
      print;
      print "| " sprint " (Current) | " start " to " end " | - | - | - | - |";
      next;
    }
    { print }
    ' "$SPRINT_HISTORY_PATH" > "$SPRINT_HISTORY_PATH.new"
    
    mv "$SPRINT_HISTORY_PATH.new" "$SPRINT_HISTORY_PATH"
    
    # Add new sprint section
    cat >> "$SPRINT_HISTORY_PATH" << EOF

## Sprint ${SPRINT_NUM} Summary (Current)

**Sprint Dates:** ${START_DATE:-"TBD"} to ${END_DATE:-"TBD"}
**Velocity:** TBD
**Story Points:** TBD
**Completion Rate:** TBD

### Key Achievements

- 

### Completed Features

- 

### Technical Debt Addressed

- 

### Issues and Blockers

- 

### Lessons Learned

1. 
EOF

    # Add link to repomix summary
    sed -i'.bak' "s|## Repomix Sprint Summaries|## Repomix Sprint Summaries\n\n- [Sprint ${SPRINT_NUM} Changes](docs/summaries/changes/sprint-${SPRINT_NUM}-changes-${TODAY}.md)|" "$SPRINT_HISTORY_PATH"
  fi
  
  rm -f "$SPRINT_HISTORY_PATH.bak"
fi

# Add a git commit with the documentation updates
echo "Committing documentation changes..."
git add "$PROJECT_ROOT/docs/summaries/changes/sprint-${SPRINT_NUM}-changes-${TODAY}.md"
git add "$PROJECT_ROOT/docs/sprint-history.md"
git commit -m "docs: update Sprint ${SPRINT_NUM} documentation for ${TODAY}"

echo "Sprint documentation generation complete for Sprint $SPRINT_NUM"
echo "Don't forget to update the sprint achievements, metrics, and lessons learned in the sprint history document!" 