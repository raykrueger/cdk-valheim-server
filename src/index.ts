import * as ec2 from '@aws-cdk/aws-ec2';
import * as ecs from '@aws-cdk/aws-ecs';
import * as efs from '@aws-cdk/aws-efs';
import * as elb from '@aws-cdk/aws-elasticloadbalancingv2';
import * as secretsmanager from '@aws-cdk/aws-secretsmanager';
import { Construct } from '@aws-cdk/core';

const VALHEIM_PORT = 2456;
const VALHEIM_SAVE_DIR = '/root/.config/unity3d/IronGate/Valheim';

const DEFAULT_VCPU = 1024;
const DEFAULT_MEMORY = 8192;
const DEFAULT_IMAGE = 'raykrueger/valheim';
const DEFAULT_SERVER_PASSWORD_SECRET_NAME = 'ValheimServerPassword';

export interface ValheimServerProps {
  /**
   * Where is the server password secret stored?
   *
   * Optional. If not defined a random password will be generated in SecretsManager at `generatedServerPasswordSecretName`.
   */
  readonly serverPasswordSecret?: secretsmanager.ISecret;

  /**
   * If we are generating a random password, what name will it be stored under in Secrets Manager?
   * Note that this value is not used if `serverPasswordSecret` is given.
   *
   * @default DEFAULT_SERVER_PASSWORD_SECRET_NAME
   */
  readonly generatedServerPasswordSecretName?: string;

  /**
   * Do we want to enable Cloudwatch Container Insights, and incur additional cost?
   *
   * @default false
   */
  readonly containerInsights?: boolean;

  /**
   * Provide an existing VPC to deploy into. If none is given a default `ec2.VPC` will be created.
   */
  readonly vpc?: ec2.IVpc;

  /**
   * vCpu amout to be granted to ECS Fargate task.
   *
   * @see https://aws.amazon.com/fargate/pricing/
   * @default DEFAULT_VCPU
   */
  readonly cpu?: number;

  /**
   * Memory limit in 1024 incrmements.
   * @see https://aws.amazon.com/fargate/prici/
   * @default DEFAULT_VCPU
   */
  readonly memoryLimitMiB?: number;

  /**
   * Logging driver to use. The Cloudwatch logging driver will incur addtional costs.
   *
   * @example logging: new ecs.AwsLogDriver({ streamPrefix: 'EventDemo' })
   *
   * @default undefined
   */
  readonly logging?: ecs.LogDriver;

  /**
   * The container image to run.
   * @see https://hub.docker.com/r/raykrueger/valheim
   * @default DEFAULT_IMAGE
   */
  readonly image?: string;
}

export class ValheimServer extends Construct {

  //Offer properties for things we may have created
  readonly vpc: ec2.IVpc;
  readonly serverPasswordSecret: secretsmanager.ISecret;
  readonly cpu: number;
  readonly memoryLimitMiB: number;
  readonly image: string;
  readonly generatedServerPasswordSecretName: string;
  readonly containerInsights: boolean;
  readonly logging: ecs.LogDriver | undefined;

  constructor(scope: Construct, id: string, props: ValheimServerProps = {}) {
    super(scope, id);

    //Setup some defaults
    this.vpc = props.vpc || new ec2.Vpc(this, 'VPC');
    this.cpu = props.cpu || DEFAULT_VCPU;
    this.memoryLimitMiB = props.memoryLimitMiB || DEFAULT_MEMORY;
    this.image = props.image || DEFAULT_IMAGE;
    this.generatedServerPasswordSecretName = props.generatedServerPasswordSecretName || DEFAULT_SERVER_PASSWORD_SECRET_NAME;
    this.containerInsights = !!props.containerInsights;
    this.logging = props.logging;

    this.serverPasswordSecret = props.serverPasswordSecret || new secretsmanager.Secret(this, 'GeneratedServerPasswordSecret', {
      secretName: props.generatedServerPasswordSecretName,
      generateSecretString: {
        passwordLength: 8,
      },
    });

    //Define our EFS file system
    const fs = new efs.FileSystem(this, 'MyEfsFileSystem', {
      vpc: this.vpc,
      encrypted: true,
      lifecyclePolicy: efs.LifecyclePolicy.AFTER_14_DAYS,
      performanceMode: efs.PerformanceMode.GENERAL_PURPOSE,
    });
    fs.addAccessPoint('AccessPoint');

    //Create our ECS Cluster
    const cluster = new ecs.Cluster(this, 'Cluster', {
      vpc: this.vpc,
      containerInsights: this.containerInsights,
      capacityProviders: ['FARGATE', 'FARGATE_SPOT'],
    });

    //Create our ECS TaskDefinition using our cpu and memory limits
    const taskDef = new ecs.FargateTaskDefinition(this, 'TaskDef', {
      cpu: this.cpu,
      memoryLimitMiB: this.memoryLimitMiB,
    });

    //Add our EFS volume to the task definition so it can be used as a mount point later
    taskDef.addVolume({
      name: 'efsVolume',
      efsVolumeConfiguration: {
        fileSystemId: fs.fileSystemId,
      },
    });

    /**
         * Add our container definition, map the VALHEIM_PORT, and setup our
         * mount point so that Valheim saves our world to EFS
         */
    const containerDef = taskDef.addContainer('server', {
      image: ecs.ContainerImage.fromRegistry(this.image),
      logging: this.logging,
      secrets: {
        SERVER_PASSWORD: ecs.Secret.fromSecretsManager(this.serverPasswordSecret),
      },
    });
    containerDef.addMountPoints({ sourceVolume: 'efsVolume', containerPath: VALHEIM_SAVE_DIR, readOnly: false });
    containerDef.addPortMappings({ containerPort: VALHEIM_PORT, hostPort: VALHEIM_PORT, protocol: ecs.Protocol.UDP });
    containerDef.addPortMappings({ containerPort: VALHEIM_PORT+1, hostPort: VALHEIM_PORT+1, protocol: ecs.Protocol.UDP });

    const securityGroup = new ec2.SecurityGroup(this, 'SecurityGroup', {
      vpc: this.vpc,
    });
    securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.udp(VALHEIM_PORT));
    securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.udp(VALHEIM_PORT+1));

    //Super important! Tell EFS to allow this SecurityGroup in to access the filesystem
    //Note that fs.connections.allowDefaultPortFrom(cluster) did not work here, I'll look into that later.
    fs.connections.allowDefaultPortFrom(securityGroup);

    /**
         * Now we create our Fargate based service to run the game server
         * FargatePlatformVerssion VERSION1_4 is required here!
         * LATEST is not yet 1.4 at the time of thi writing
         */
    const service = new ecs.FargateService(this, 'Service', {
      cluster: cluster,
      taskDefinition: taskDef,
      desiredCount: 1,
      securityGroups: [securityGroup],
      platformVersion: ecs.FargatePlatformVersion.VERSION1_4,
      assignPublicIp: false,
      capacityProviderStrategies: [
        {
          capacityProvider: 'FARGATE_SPOT',
          weight: 2,
        },
        {
          capacityProvider: 'FARGATE',
          weight: 1,
        },
      ],
    });

    /**
         * Here we add nginx as a simple sidecar conatiner for healtchecking.
         * The NLB cannot health check a UDP based service. Adding nginx,
         * running as part of the same task, gives us something to healthcheck.
         */
    const nginx = taskDef.addContainer('nginx', {
      image: ecs.ContainerImage.fromRegistry('nginx:alpine'),
    });
    nginx.addPortMappings({ containerPort: 80, hostPort: 80, protocol: ecs.Protocol.TCP });
    securityGroup.addIngressRule(ec2.Peer.ipv4(this.vpc.vpcCidrBlock), ec2.Port.tcp(80));

    //Setup our NLB, listners, and targets, all set for UDP and the Valheim port
    const lb = new elb.NetworkLoadBalancer(this, 'LoadBalancer', {
      vpc: this.vpc,
      internetFacing: true,
    });

    const listener = lb.addListener('Listener', { port: VALHEIM_PORT, protocol: elb.Protocol.UDP });
    listener.addTargets('Targets', {
      port: VALHEIM_PORT,
      protocol: elb.Protocol.UDP,
      targets: [service.loadBalancerTarget({ containerName: 'server', protocol: ecs.Protocol.UDP, containerPort: VALHEIM_PORT })],
      healthCheck: { //NOTE we are healthchecking our nginx sidecar here, not the Valheim game itself
        enabled: true,
        port: '80',
        protocol: elb.Protocol.TCP,
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 2,
      },
    });

    //The NLB cannot do port ranges, so here we are.
    const otherListener = lb.addListener('OtherListener', { port: VALHEIM_PORT+1, protocol: elb.Protocol.UDP });
    otherListener.addTargets('Targets', {
      port: VALHEIM_PORT+1,
      protocol: elb.Protocol.UDP,
      targets: [service.loadBalancerTarget({ containerName: 'server', protocol: ecs.Protocol.UDP, containerPort: VALHEIM_PORT+1 })],
      healthCheck: { //NOTE we are healthchecking our nginx sidecar here, not the Valheim game itself
        enabled: true,
        port: '80',
        protocol: elb.Protocol.TCP,
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 2,
      },
    });
  }
}