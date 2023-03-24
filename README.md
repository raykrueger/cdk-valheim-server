# CDK Valheim Server

This repository serves as an example of deploying
[Valheim](https://www.valheimgame.com/) on AWS using
[cdk-game-server](https://github.com/raykrueger/cdk-game-server).

## Deploying

You will need NodeJS 16.x or better installed.

To deploy your own Valheim server on AWS simply clone this repo, make any
changes you'd like, and run <br/>`npx cdk deploy`. This will deploy Vaheim to ECS
Fargate Spot. It will automatically shutdown if idle. It can be scaled up in the
ECS UI, via the AWS CLI, or by enabling the [Discord
bot](https://github.com/raykrueger/cdk-game-server).

## History

This repository used to host a cdk-valheim-server CDK Library. That library was
very expensive when running, and was very hardcoded to Valheim. All of the
functionality has been extracted to cdk-game-server and improved to be as cheap
as possible.