# Versioning

This document will describe our versioning strategy for the Satisfactory Factories project.

It is **highly** recommended you read [How do we release updates?](./how-do-we-release.md) before continuing.

## Frontend Particulars

As stated in the release documentation, the frontend is automatically deployed whenever `main` is merged.

With this in mind, versioning is not strictly necessary for the frontend, as it is continually deployed.

However, what is important to denote versioning for is for public users. They won't understand incremental updates, and communicating said incremental updates to them will result in ping fatigue (via Discord) or "size bias" via social media, e.g. "too small of a change to care".

## So how do we version?
The intention is to use Semver (Semantic Versioning) for the monorepo. This means that we will have a version number that looks like `MAJOR.MINOR.PATCH`.

**This will be applied across all components at the same time**. Since they all have tight integration with each other `web` will be the one most likely in sync with versioning, other components may be updated alongside it. For simplicity sakes, we are using a `universal` versioning system that applies to all components, even if they are not updated as part of that version.

Below describe what justifies as a versioning change:

### MAJOR
It is unlikely that we will release a total redesign / rewrite of the application. This would be for example a complete visual rewrite or a complete re-architecture of the application.

### MINOR
This is for new features or significant changes to the application. Where new features are added, features are re-worked or removed, or significant changes are made to the application.

### PATCH
This is for bug fixes or minor changes to the application. This will be the most common type of release, where bugs are fixed, layout elements are changed, or very minor changes are made to the application.

