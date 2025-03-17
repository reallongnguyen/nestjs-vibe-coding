#!/bin/bash

# generate-feature-docs.sh
# Script to generate documentation for a specific feature using repomix
# Usage: ./generate-feature-docs.sh <feature-name> <feature-branch>

# Exit on any error
set -e

# Check if feature name is provided
if [ $# -lt 1 ]; then
  echo "Usage: $0 <feature-name> [feature-branch]"
  echo "Example: $0 authentication feature/auth"
  exit 1
fi

FEATURE_NAME=$1
FEATURE_BRANCH=${2:-""}  # Optional branch name, defaults to empty string
TODAY=$(date +"%Y-%m-%d")
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Create directories if they don't exist
mkdir -p "$PROJECT_ROOT/docs/summaries/changes"
mkdir -p "$PROJECT_ROOT/docs/summaries/feature-docs"

# Log script start
echo "Generating documentation for feature: $FEATURE_NAME..."

# Get list of files changed for this feature
echo "Finding files changed for this feature..."
if [ -n "$FEATURE_BRANCH" ]; then
  # If branch is specified, compare with main/master branch
  MAIN_BRANCH=$(git remote show origin | grep 'HEAD branch' | cut -d' ' -f5)
  git diff --name-only "origin/$MAIN_BRANCH...$FEATURE_BRANCH" > "$PROJECT_ROOT/docs/summaries/feature-changed-files.txt"
else
  # Otherwise use merge-base to find changes
  git diff --name-only $(git merge-base HEAD main) HEAD > "$PROJECT_ROOT/docs/summaries/feature-changed-files.txt"
fi

# Generate summary of only the changed files for this feature
echo "Generating repomix summary..."
repomix --include-from-file "$PROJECT_ROOT/docs/summaries/feature-changed-files.txt" \
  --style markdown \
  --output "$PROJECT_ROOT/docs/summaries/changes/${FEATURE_NAME}-changes-${TODAY}.md"

# Create or update feature status document
FEATURE_STATUS_PATH="$PROJECT_ROOT/docs/feature-status.md"

# Check if feature status file exists
if [ ! -f "$FEATURE_STATUS_PATH" ]; then
  # Create new feature status file
  echo "Creating feature status document..."
  cat > "$FEATURE_STATUS_PATH" << EOF
# Feature Status

Last Updated: **\`${TODAY}\`**

## Feature Overview

| Feature | Status | Progress | Priority | Target Release |
|---------|--------|----------|----------|---------------|
| $FEATURE_NAME | 🟢 In Progress | 0% | Medium | TBD |

## Detailed Feature Status

### $FEATURE_NAME

**Progress: 0%** 🟢

**Recent Changes:**
- Initial setup (${TODAY})

**Remaining Work:**
- Implementation
- Testing
- Documentation

**Known Issues:**
- None yet

**Repomix Summary:** [${FEATURE_NAME}-changes-${TODAY}.md](docs/summaries/changes/${FEATURE_NAME}-changes-${TODAY}.md)

## Feature Roadmap

### Current Sprint
- $FEATURE_NAME initial implementation

EOF
else
  # Check if feature already exists in the document
  if grep -q "### $FEATURE_NAME" "$FEATURE_STATUS_PATH"; then
    # Update existing feature section
    echo "Updating existing feature in status document..."
    
    # Update last updated date
    sed -i'.bak' "s/Last Updated: \*\*\`.*\`\*\*/Last Updated: \*\*\`${TODAY}\`\*\*/" "$FEATURE_STATUS_PATH"
    
    # Update repomix summary link
    sed -i'.bak' "s|\*\*Repomix Summary:\*\* \[${FEATURE_NAME}-changes-.*\.md\]|\*\*Repomix Summary:\*\* \[${FEATURE_NAME}-changes-${TODAY}.md\]|" "$FEATURE_STATUS_PATH"
    
    # Add today's change to recent changes list (after the Recent Changes: line)
    sed -i'.bak' "/\*\*Recent Changes:\*\*/a\\- Updated feature (${TODAY})" "$FEATURE_STATUS_PATH"
    
    rm -f "$FEATURE_STATUS_PATH.bak"
  else
    # Feature doesn't exist in document, append new feature section
    echo "Adding new feature to status document..."
    
    # Update last updated date
    sed -i'.bak' "s/Last Updated: \*\*\`.*\`\*\*/Last Updated: \*\*\`${TODAY}\`\*\*/" "$FEATURE_STATUS_PATH"
    
    # Append new feature section
    cat >> "$FEATURE_STATUS_PATH" << EOF

### $FEATURE_NAME

**Progress: 0%** 🟢

**Recent Changes:**
- Initial setup (${TODAY})

**Remaining Work:**
- Implementation
- Testing
- Documentation

**Known Issues:**
- None yet

**Repomix Summary:** [${FEATURE_NAME}-changes-${TODAY}.md](docs/summaries/changes/${FEATURE_NAME}-changes-${TODAY}.md)
EOF
    
    # Also add to the feature overview table
    # This is a bit more complex as we need to insert a line in the table
    awk -v feature="$FEATURE_NAME" -v today="$TODAY" '
    /\| Feature \| Status \| Progress \| Priority \| Target Release \|/ {
      print;
      getline;
      print;
      print "| " feature " | 🟢 In Progress | 0% | Medium | TBD |";
      next;
    }
    { print }
    ' "$FEATURE_STATUS_PATH" > "$FEATURE_STATUS_PATH.new"
    
    mv "$FEATURE_STATUS_PATH.new" "$FEATURE_STATUS_PATH"
    rm -f "$FEATURE_STATUS_PATH.bak"
  fi
fi

# Add a git commit with the documentation updates
echo "Committing documentation changes..."
git add "$PROJECT_ROOT/docs/summaries/changes/${FEATURE_NAME}-changes-${TODAY}.md"
git add "$PROJECT_ROOT/docs/feature-status.md"
git commit -m "docs: update $FEATURE_NAME documentation for ${TODAY}"

echo "Feature documentation generation complete for $FEATURE_NAME"
echo "Don't forget to update the feature progress and remaining work in the feature status document!" 