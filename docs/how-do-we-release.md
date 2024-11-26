# How do we release updates?

This document will describe how the various components of Satisfactory Factories are released to users.

## Frontend (web)
Frontend is automatically deployed whenever main is merged. This is called [Trunk based development](https://trunkbaseddevelopment.com/#trunk-based-development-for-smaller-teams).

We have a tool called Vercel which manages two things:
1. Builds and releases the frontend application when `main` is merged.
2. Builds and releases previews of the frontend application when a pull request is opened.

E.g. when someone creates a new feature, it follows this flow:

1. A draft PR is opened (to communicate to other collaborators a particular issue / feature is being worked upon actively)
2. The PR work is completed, and the PR is marked as ready for review.
3. Review cycle begins.
4. Once everyone is happy, it is approved and merged into `main`.
5. Upon merging into `main`, Vercel will automatically build and release the frontend application.

## Backend
As of writing, backend is seldom updated. As a consequence, the deployment of it is done manually.

The backend system is hosted on Mael's private NAS server in his home. It is protected by Cloudflare Tunnels so that it is not directly exposed to the internet.

However, this does mean that only he will have the ability to deploy the backend system. This is not ideal, but it is the current state of the project.

It is done so by running `/backend/publish.sh`, which has an SSH connection to run a simple `docker compose pull && docker compose down/up` commands to deploy the docker container.

It is intended that this will be automated in the future where as of building a docker container, it will be detected and pulled by the server, and the server will automatically restart the container.

## Parser
There are no deployments for the parser. It is run alongside a website deployment so that users browsers download the new game data.

Please consult the root README for more information on how to run the parser and how it provides data to the web application.