# raykrueger/cdk-valheim-server

This is an AWS Cloud Development Kit (CDK) construct library to run a
[Valheim](https://www.valheimgame.com/) dedicated server in AWS Fargate on
Amazon Elastic Container Service (ECS).

**AWS Costs will apply!** This thing won't run for free. See [Costs](#costs) for
more information.

## Summary

This CDK Construct will deploy Valheim using the
[raykrueger/valheim](https://hub.docker.com/r/raykrueger/valheim) Docker
container. The container is deployed to an Amazon ECS Cluster, running on AWS
Fargate. The game world is persisted to Amazon Elastic File System. The game
server is exposed to the internet via a Network Load Balancer.

The server should run with pretty high resilliency. Given that the world is
saved to an EFS file system, and the ECS Cluster is running across multipe
availability zones, the server can die in one Availability Zone and come up
in another with a low risk of loss. This is a beta game, and stuff happens,
so you may want to consider enabling AWS Backup for your EFS filesystem.

## Sample Application

This is the basic CDK Application needed to run the cdk-valheim-server
construct. The easiest way to get started would be to use projen, `npx projen
new awscdk-app-ts`. You'll need NodeJS installed the [AWS
CLI](https://aws.amazon.com/cli/) more than likely.

The default properties for the ValheimServer construct mean it will create a
VPC to run everything, and it will generate a random password to access the
server. The server password will be stored in [AWS Secrets
Manager](https://aws.amazon.com/secrets-manager/) under the name
`ValheimServerPassword`. This can be retrived from the AWS Console, or from
the cli using `aws secretsmanager get-secret-value --secret-id
ValheimServerPassword`.

```typescript
import { App, Construct, Stack, StackProps } from '@aws-cdk/core';
import {ValheimServer} from '@raykrueger/cdk-valheim-server';

export class MyStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps = {}) {
    super(scope, id, props);

    new ValheimServer(this, 'Valheim');
  }
}

const devEnv = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

const app = new App();

new MyStack(app, 'Valheim', { env: devEnv });

app.synth();
```

## Costs

See [AWS Fargate Pricing](https://aws.amazon.com/fargate/pricing/) for cost
details in your region. The default confugration deploys 1vcpu and 8gb of
memory. In addtion, you will incur costs for EFS and some amount of network
transfer.