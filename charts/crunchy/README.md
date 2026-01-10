# CrunchyDB Value Files

These are the values files for CrunchyDB. Ideally the GitHub Action would take
multiple values files and we could include the base file and the per-environment
diffs, but this isn't the case.

1. The `values.yml` is the standard values from the repo template. This file
   is unused by the pipelines and should not be altered, unless merging in
   changes from the upstream repo.
2. The per-environment files alter `values.yml` as needed. We can do a diff
   against `values.yml` if we need to check what has been changed.
