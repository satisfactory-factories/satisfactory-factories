# Satisfactory Factories
This [web tool](https://satisfactory-factories.app/) is designed to help players of the video game Satisfactory&trade; to plan a comprehensive production chain.

The tool highlights bottlenecks in the production chain, and visually tells the player that they have a problem within their designs.

The player can scale up end product factories as they see fit, and check if their production chain can handle the increased load.

## Contributing
Since this is an open source project, all PR requests will be welcomed, as long as proper intent and communication with the project maintainers is maintained.

___
## Local Development
This project has the following requirements:
- Node.js version 20.17.0+
- pnpm version 9.3.0
- Docker (for the backend)

### Frontend
1. `cd web`
2. `pnpm install`
3. `pnpm dev`

Visit http://localhost:3000 to view the project.

### Parsing
1. `cd parsing`
2. `pnpm install`
3. `pnpm dev`

#### Testing
There are tests for the frontend project, run them with `pnpm test`. Tests must pass for PRs to be accepted. Note as of writing the coverage isn't 100%.

### Backend
Required for the login and syncing of data features, not required for local development.
1. Start Docker service on your local machine.
2. `cd backend`
3. `./start.sh`

API will be available on http://localhost:3001.

There are no tests currently available for the backend project.

### Deployment
New versions are trunked to `main` branch, once `main` has been pushed, GitHub Actions will create a release then deploy the frontend to Vercel, and create a docker image of the backend to deploy to my personal server.
___

## License
This project is licensed under the GNU License - see the [LICENSE](LICENSE) file for details.

Please kindly consider opening PRs to improve the project, and make it better for everyone rather than making a clone.

## Acknowledgements
- Many thanks to [Greeny (creator of satisfactory-tools)](https://github.com/greeny/SatisfactoryTools) for collating all the game assets required to display the various icons for items and buildings.
- Thanks to the author of [Satisfactory Logistics](https://satisfactory-logistics.xyz), who gave me the inspiration to extend what they did but even further.
