# raykrueger/cdk-valheim-server

This is an AWS Cloud Development Kit (CDK) construct library to run a
[Valheim](https://www.valheimgame.com/) dedicated server in AWS Fargate on
Amazon Elastic Container Service (ECS).

**AWS Costs will apply!** This thing won't run for free. See [Costs](#costs) for
more information.

## Summary

The game world is persisted to an Amazon Elastic File System (EFS) file
system. So in the case of a server container shutdown the game world
files will be attached to the container when it starts elsewhere. The game
server runs using Fargate Spot Pricing to keep costs down, but this also
means it might be interrupted depending on availability.

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