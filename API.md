# API Reference

**Classes**

Name|Description
----|-----------
[ValheimServer](#raykrueger-cdk-valheim-server-valheimserver)|Builds a ValheimServer, running on ECS Fargate.


**Structs**

Name|Description
----|-----------
[ValheimServerProps](#raykrueger-cdk-valheim-server-valheimserverprops)|*No description*



## class ValheimServer  <a id="raykrueger-cdk-valheim-server-valheimserver"></a>

Builds a ValheimServer, running on ECS Fargate.

This is designed to run as
cheaply as possible, which means some availability and reliability has been
sacrificed.

Default configuration:
    Single AZ with a Single Public Subnet
    Fargate Spot capacity provider
    EFS General performance file system for storage
    NLB for static IP and DNS

__Implements__: [IConstruct](#constructs-iconstruct), [IConstruct](#aws-cdk-core-iconstruct), [IConstruct](#constructs-iconstruct), [IDependable](#aws-cdk-core-idependable)
__Extends__: [Construct](#aws-cdk-core-construct)

### Initializer




```ts
new ValheimServer(scope: Construct, id: string, props?: ValheimServerProps)
```

* **scope** (<code>[Construct](#aws-cdk-core-construct)</code>)  *No description*
* **id** (<code>string</code>)  *No description*
* **props** (<code>[ValheimServerProps](#raykrueger-cdk-valheim-server-valheimserverprops)</code>)  *No description*
  * **assignPublicIp** (<code>boolean</code>)  If we are deployed in a public subnet we need a public IP assigned to access the internet. __*Default*__: true
  * **containerInsights** (<code>boolean</code>)  Do we want to enable Cloudwatch Container Insights, and incur additional cost? __*Default*__: false
  * **cpu** (<code>number</code>)  vCpu amout to be granted to ECS Fargate task. __*Default*__: DEFAULT_VCPU
  * **generatedServerPasswordSecretName** (<code>string</code>)  If we are generating a random password, what name will it be stored under in Secrets Manager? __*Default*__: DEFAULT_SERVER_PASSWORD_SECRET_NAME
  * **image** (<code>string</code>)  The container image to run. __*Default*__: DEFAULT_IMAGE
  * **logging** (<code>[LogDriver](#aws-cdk-aws-ecs-logdriver)</code>)  Logging driver to use. __*Default*__: undefined
  * **memoryLimitMiB** (<code>number</code>)  Memory limit in 1024 incrmements. __*Default*__: DEFAULT_VCPU
  * **serverPasswordSecret** (<code>[ISecret](#aws-cdk-aws-secretsmanager-isecret)</code>)  Where is the server password secret stored? __*Optional*__
  * **vpc** (<code>[IVpc](#aws-cdk-aws-ec2-ivpc)</code>)  Provide an existing VPC to deploy into. __*Optional*__



### Properties


Name | Type | Description 
-----|------|-------------
**assignPublicIp** | <code>boolean</code> | <span></span>
**containerInsights** | <code>boolean</code> | <span></span>
**cpu** | <code>number</code> | <span></span>
**generatedServerPasswordSecretName** | <code>string</code> | <span></span>
**image** | <code>string</code> | <span></span>
**memoryLimitMiB** | <code>number</code> | <span></span>
**serverPasswordSecret** | <code>[ISecret](#aws-cdk-aws-secretsmanager-isecret)</code> | <span></span>
**vpc** | <code>[IVpc](#aws-cdk-aws-ec2-ivpc)</code> | <span></span>
**logging**? | <code>[LogDriver](#aws-cdk-aws-ecs-logdriver)</code> | __*Optional*__



## struct ValheimServerProps  <a id="raykrueger-cdk-valheim-server-valheimserverprops"></a>






Name | Type | Description 
-----|------|-------------
**assignPublicIp**? | <code>boolean</code> | If we are deployed in a public subnet we need a public IP assigned to access the internet.<br/>__*Default*__: true
**containerInsights**? | <code>boolean</code> | Do we want to enable Cloudwatch Container Insights, and incur additional cost?<br/>__*Default*__: false
**cpu**? | <code>number</code> | vCpu amout to be granted to ECS Fargate task.<br/>__*Default*__: DEFAULT_VCPU
**generatedServerPasswordSecretName**? | <code>string</code> | If we are generating a random password, what name will it be stored under in Secrets Manager?<br/>__*Default*__: DEFAULT_SERVER_PASSWORD_SECRET_NAME
**image**? | <code>string</code> | The container image to run.<br/>__*Default*__: DEFAULT_IMAGE
**logging**? | <code>[LogDriver](#aws-cdk-aws-ecs-logdriver)</code> | Logging driver to use.<br/>__*Default*__: undefined
**memoryLimitMiB**? | <code>number</code> | Memory limit in 1024 incrmements.<br/>__*Default*__: DEFAULT_VCPU
**serverPasswordSecret**? | <code>[ISecret](#aws-cdk-aws-secretsmanager-isecret)</code> | Where is the server password secret stored?<br/>__*Optional*__
**vpc**? | <code>[IVpc](#aws-cdk-aws-ec2-ivpc)</code> | Provide an existing VPC to deploy into.<br/>__*Optional*__



