import { SynthUtils } from '@aws-cdk/assert';
import { Stack } from '@aws-cdk/core';
import '@aws-cdk/assert/jest';

import { ValheimServer } from '../src/index';

const stack = new Stack();
new ValheimServer(stack, 'Test');

test('snapshot', () => {
  expect(SynthUtils.toCloudFormation(stack)).toMatchSnapshot();
});

test('default vpc is created', () => {
  expect(stack).toHaveResource('AWS::EC2::VPC');
});

test('ECS cluster is created', () => {
  expect(stack).toHaveResource('AWS::ECS::Cluster');
});

test('SecurityGroup allows UDP 2456-2457 from everywhere, and 80 from the VPC', () => {
  expect(stack).toHaveResourceLike('AWS::EC2::SecurityGroup', {
    SecurityGroupIngress: [
      {
        CidrIp: '0.0.0.0/0',
        Description: 'from 0.0.0.0/0:UDP 2456',
        FromPort: 2456,
        IpProtocol: 'udp',
        ToPort: 2456,
      },
      {
        CidrIp: '0.0.0.0/0',
        Description: 'from 0.0.0.0/0:UDP 2457',
        FromPort: 2457,
        IpProtocol: 'udp',
        ToPort: 2457,
      },
      {
        CidrIp: {
          'Fn::GetAtt': [
            'TestVPCBD247556',
            'CidrBlock',
          ],
        },
        Description: {
          'Fn::Join': [
            '',
            [
              'from ',
              {
                'Fn::GetAtt': [
                  'TestVPCBD247556',
                  'CidrBlock',
                ],
              },
              ':80',
            ],
          ],
        },
        FromPort: 80,
        IpProtocol: 'tcp',
        ToPort: 80,
      },
    ],
  });
});