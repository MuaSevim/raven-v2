#!/bin/bash

OUTPUT="ai_project_report.md"

echo "# AI Project Report" > $OUTPUT
echo "" >> $OUTPUT

echo "Generated: $(date)" >> $OUTPUT
echo "" >> $OUTPUT

echo "## Current Branch" >> $OUTPUT
git branch --show-current >> $OUTPUT
echo "" >> $OUTPUT

echo "## Git Status" >> $OUTPUT
git status >> $OUTPUT
echo "" >> $OUTPUT

echo "## Recent Commits" >> $OUTPUT
git log --graph --decorate --oneline -30 >> $OUTPUT
echo "" >> $OUTPUT

echo "## Staged Changes Summary" >> $OUTPUT
git diff --cached --stat >> $OUTPUT
echo "" >> $OUTPUT

echo "## Staged Changes" >> $OUTPUT
git diff --cached >> $OUTPUT
echo "" >> $OUTPUT

echo "## Unstaged Changes Summary" >> $OUTPUT
git diff --stat >> $OUTPUT
echo "" >> $OUTPUT

echo "## Unstaged Changes" >> $OUTPUT
git diff >> $OUTPUT
echo "" >> $OUTPUT

echo "## Untracked Files" >> $OUTPUT
git ls-files --others --exclude-standard >> $OUTPUT
echo "" >> $OUTPUT

echo "## Project Structure" >> $OUTPUT
find . \
  -path './node_modules' -prune -o \
  -path './.git' -prune -o \
  -path './dist' -prune -o \
  -path './build' -prune -o \
  -path './.expo' -prune -o \
  -path './server/node_modules' -prune -o \
  -path './server/dist' -prune -o \
  -path './client/node_modules' -prune -o \
  -path './client/dist' -prune -o \
  -print >> $OUTPUT

echo ""
echo "AI report generated: $OUTPUT"