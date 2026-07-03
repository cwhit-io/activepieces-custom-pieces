# Custom Pieces Workflow

## Commit custom folder & update main repo

When I ask to "commit the custom folder and update the main repo" or similar, do the following:

1. **Navigate** to the activepieces root: `cd /home/blackhawk/activepieces`

2. **Stash parent-level modified files** that would block the pull:

   ```bash
   git stash push -m "parent-file-changes" -- bun.lock docker-compose.yml tsconfig.base.json
   ```

3. **Pull** latest from `origin/main`:

   ```bash
   git pull origin main
   ```

4. **Stage and commit** all files under `packages/pieces/custom/`:

   ```bash
   git add packages/pieces/custom/
   git commit -m "feat: add custom planning center pieces"
   ```

5. **Pop the stash** to restore parent file changes:

   ```bash
   git stash pop
   ```

6. **Resolve conflicts** that arise:

   - `docker-compose.yml`: Keep the local (custom build) version — replace conflict markers with the stashed version (local image build)
   - `bun.lock`: Accept our local version (`git checkout --ours -- bun.lock`) then stage it
   - `tsconfig.base.json`: Usually merges cleanly

7. **Stage** resolved files and **drop the stash**:

   ```bash
   git add docker-compose.yml tsconfig.base.json
   git stash drop
   ```

8. **Regenerate** `bun.lock` to merge cleanly:
   ```bash
   bun install
   ```
