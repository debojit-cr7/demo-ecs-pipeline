import * as ecs from '@aws-cdk/aws-ecs';
import ecs_patterns = require('@aws-cdk/aws-ecs-patterns');
import ec2 = require("@aws-cdk/aws-ec2");
import cdk = require('@aws-cdk/core');

import { CfnOutput, Construct, Stack, StackProps } from '@aws-cdk/core';
import * as path from 'path';

/**
 * A stack for our simple Application Load Balanced Fargate Service
 */
export class CdkpipelinesDemoStack extends Stack {
  /**
   * The DNS endpoint of the LoadBalancer
   */
  public readonly urlOutput: CfnOutput;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    
    const vpc = new ec2.Vpc(this, 'ecs-cdk-vpc', {
      cidr: '10.0.0.0/16',
      natGateways: 1,
      maxAzs: 3
    });
    
    const cluster = new ecs.Cluster(this, "ecs-cluster", {
      vpc: vpc,
    });


    // Instantiate Fargate Service with just cluster and image
    const service = new ecs_patterns.ApplicationLoadBalancedFargateService(this, "FargateService", {
      memoryLimitMiB: 1024,
      cluster: cluster,
      cpu: 512,
      taskImageOptions: {
        image: ecs.ContainerImage.fromRegistry('amazon/amazon-ecs-sample'),
      },
    });
    
    const scaling = service.service.autoScaleTaskCount({ maxCapacity: 6 });
    scaling.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 10,
      scaleInCooldown: cdk.Duration.seconds(60),
      scaleOutCooldown: cdk.Duration.seconds(60)
    });

    this.urlOutput = new CfnOutput(this, 'Url', {
      value: service.loadBalancer.loadBalancerDnsName,
    });
  }
}
