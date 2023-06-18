/* eslint-disable no-new */

// From markilott. No npm package, just reference code.
// blog: https://aws.plainenglish.io/configure-aws-ses-to-send-email-for-your-domain-26d022897b21
// code: https://github.com/markilott/aws-cdk-configure-ses

import { AwsCustomResource, AwsCustomResourcePolicy } from 'aws-cdk-lib/custom-resources';
import {
    HostedZone, CnameRecord, HostedZoneAttributes, IHostedZone,
} from 'aws-cdk-lib/aws-route53';
import { PolicyStatement, Effect } from 'aws-cdk-lib/aws-iam';
import { Topic } from 'aws-cdk-lib/aws-sns';
import { EmailSubscription } from 'aws-cdk-lib/aws-sns-subscriptions';
import { Stack, CfnOutput, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';


const reqEventTypes = ['REJECT', 'BOUNCE', 'COMPLAINT'];
const deliveryEventTypes = ['SEND', 'DELIVERY', 'OPEN'];


interface SesConfigStackProps extends StackProps {
    sesAttr: {
        emailList: string[],
        notifList: string[],
        sendDeliveryNotifications: boolean,
    },
    domainAttr: HostedZoneAttributes,
}

/**
 * Configures SES domain and verified email addresses.
 * A Route53 Domain in the same Account is required.
 *
 * @param {Construct} scope
 * @param {string} id
 * @param {StackProps=} props
 */
export class SesConfigStack extends Stack {
    zone: IHostedZone;

    constructor(scope: Construct, id: string, props: SesConfigStackProps) {
        super(scope, id, props);

        console.log('Stack Name: ', this.stackName);

        const { sesAttr, domainAttr } = props;
        const {
            emailList, notifList, sendDeliveryNotifications,
        } = sesAttr;
        const { zoneName, hostedZoneId } = domainAttr;
        if (!zoneName) { throw new Error('A domain zoneName is required'); }

        // Import the Route53 Domain
        if (hostedZoneId) {
            this.zone = HostedZone.fromHostedZoneAttributes(this, 'zone', {
                hostedZoneId,
                zoneName,
            });
        }

        // Creating custom policy for CustomResource due to CDK bug (uses email: instead of ses: when creating actions)
        const sesPolicy = new PolicyStatement({
            actions: [
                'ses:CreateConfigurationSet',
                'ses:DeleteConfigurationSet',
                'ses:CreateConfigurationSetEventDestination',
                'ses:DeleteConfigurationSetEventDestination',
                'ses:CreateEmailIdentity',
                'ses:DeleteEmailIdentity',
            ],
            resources: ['*'], // Global is required to Create. Delete could be restricted if required.
            effect: Effect.ALLOW,
        });

        // Create a default Configuration Set for the domain
        const ConfigurationSetName = 'defaultConfigSet';
        const configSet = new AwsCustomResource(this, ConfigurationSetName, {
            onUpdate: {
                service: 'SESV2',
                action: 'createConfigurationSet',
                parameters: {
                    ConfigurationSetName,
                    SendingOptions: { SendingEnabled: true },
                },
                physicalResourceId: {},
            },
            onDelete: {
                service: 'SESV2',
                action: 'deleteConfigurationSet',
                parameters: {
                    ConfigurationSetName,
                },
            },
            policy: AwsCustomResourcePolicy.fromStatements([sesPolicy]),
            logRetention: 7,
        });

        // Add an SNS Destination for SES notifications
        const sesNotificationsTopic = new Topic(this, 'sesNotificationsTopic', {
            topicName: 'sesNotifications',
            displayName: 'SES Email Notifications',
        });
        const EventDestinationName = 'defaultNotifications';
        const MatchingEventTypes = (sendDeliveryNotifications) ? [...reqEventTypes, ...deliveryEventTypes] : [...reqEventTypes];
        const snsDest = new AwsCustomResource(this, EventDestinationName, {
            onUpdate: {
                service: 'SESV2',
                action: 'createConfigurationSetEventDestination',
                parameters: {
                    ConfigurationSetName,
                    EventDestinationName,
                    EventDestination: {
                        SnsDestination: {
                            TopicArn: sesNotificationsTopic.topicArn,
                        },
                        MatchingEventTypes,
                        Enabled: true,
                    },
                },
                physicalResourceId: {},
            },
            onDelete: {
                service: 'SESV2',
                action: 'deleteConfigurationSetEventDestination',
                parameters: {
                    ConfigurationSetName,
                    EventDestinationName,
                },
            },
            policy: AwsCustomResourcePolicy.fromStatements([sesPolicy]),
            logRetention: 7,
        });
        snsDest.node.addDependency(configSet);

        // Add email addresses to the SNS notification topic
        notifList.forEach((email: string) => sesNotificationsTopic.addSubscription(new EmailSubscription(email)));

        // Add and verify Domain using DKIM
        const domainIdentity = new AwsCustomResource(this, 'domainIdentity', {
            onUpdate: {
                service: 'SESV2',
                action: 'createEmailIdentity',
                parameters: {
                    EmailIdentity: zoneName,
                    ConfigurationSetName, // Will set the default Configuration Set for the domain
                },
                physicalResourceId: {},
            },
            onDelete: {
                service: 'SESV2',
                action: 'deleteEmailIdentity',
                parameters: {
                    EmailIdentity: zoneName,
                },
            },
            policy: AwsCustomResourcePolicy.fromStatements([sesPolicy]),
            logRetention: 7,
        });
        domainIdentity.node.addDependency(configSet);
        // Assuming there are always 3 tokens returned as that is what all the docs indicate
        const dkimTokens = [
            domainIdentity.getResponseField('DkimAttributes.Tokens.0'),
            domainIdentity.getResponseField('DkimAttributes.Tokens.1'),
            domainIdentity.getResponseField('DkimAttributes.Tokens.2'),
        ];

        // Add DKIM tokens to domain (or just output for manual entry)
        dkimTokens.forEach((token, i) => {
            const recordName = `${token}._domainkey.${zoneName}`;
            if (hostedZoneId) {
                new CnameRecord(this, `token${i + 1}`, {
                    domainName: `${token}.dkim.amazonses.com`,
                    zone: this.zone,
                    recordName,
                    comment: 'SES DKIM Verification',
                });
            }
            new CfnOutput(this, `outputToken${i + 1}`, {
                description: `DKIM CNAME Record ${i + 1}`,
                value: `${recordName} CNAME ${token}.dkim.amazonses.com`,
            });
        });

        // Add email addresses and send verification emails
        emailList.forEach((email, i) => {
            new AwsCustomResource(this, `emailIdentity${i + 1}`, {
                onUpdate: {
                    service: 'SESV2',
                    action: 'createEmailIdentity',
                    parameters: {
                        EmailIdentity: email,
                    },
                    physicalResourceId: {},
                },
                onDelete: {
                    service: 'SESV2',
                    action: 'deleteEmailIdentity',
                    parameters: {
                        EmailIdentity: email,
                    },
                },
                policy: AwsCustomResourcePolicy.fromStatements([sesPolicy]),
                logRetention: 7,
            });
        });
    }
}
