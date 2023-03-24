#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { GameServer } from '@raykrueger/cdk-game-server';
import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';

const SECRET_NAME = "ValheimServer"

class GameStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props)

    const serverPasswordSecret = new Secret(this, 'GeneratedServerPasswordSecret', {
      secretName: SECRET_NAME,
      generateSecretString: {
        passwordLength: 8,
      },
    });
  
    new GameServer(this, "Valheim", {
      gamePorts: [
        {portNumber: 2456, protocol: ecs.Protocol.UDP},
      ],
      mountTarget: "/root/.config/unity3d/IronGate/Valheim",
      image: ecs.ContainerImage.fromRegistry("raykrueger/valheim"),
      containerSecrets: {
        SERVER_PASSWORD: ecs.Secret.fromSecretsManager(serverPasswordSecret),
      }
    })
  }
}

const app = new cdk.App();
new GameStack(app, "Valheim", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  }
})