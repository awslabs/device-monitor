# Device Defender Profile Deployment Guide

This guide explains how to automatically create and configure AWS IoT Device Defender security profiles during FleetWatch deployment.

## Overview

AWS IoT Device Defender provides security monitoring for IoT devices by tracking device behavior and generating metrics. FleetWatch automatically creates a security profile during deployment to enable Device Defender metrics collection.

## Implementation

### 1. CDK Construct Structure

The Device Defender profile is implemented as a CDK construct located at:
```
backend/fw-constructs/device-defender-profile.ts
```

### 2. Key Components

#### A. Custom Resource Provider
- Uses AWS CDK's `cr.Provider` to create a custom CloudFormation resource
- Handles Create, Update, and Delete operations for the security profile
- Includes proper error handling and rollback support

#### B. Lambda Function
- Python 3.12 runtime with inline code
- Manages security profile lifecycle operations
- Automatically attaches the profile to all IoT things

#### C. IAM Permissions
The Lambda function requires the following IoT permissions:
```typescript
'iot:CreateSecurityProfile',
'iot:UpdateSecurityProfile', 
'iot:DeleteSecurityProfile',
'iot:DescribeSecurityProfile',
'iot:AttachSecurityProfile',
'iot:DetachSecurityProfile',
'iot:ListTargetsForSecurityProfile',
'iot:ListSecurityProfiles',
'iot:TagResource',
'iot:UntagResource'
```

### 3. Security Profile Configuration

The deployed security profile monitors three key behaviors:

#### Connection Attempts
- **Metric**: `aws:num-connection-attempts`
- **Threshold**: >50 attempts in 5 minutes
- **Purpose**: Detect potential brute force attacks

#### Authorization Failures  
- **Metric**: `aws:num-authorization-failures`
- **Threshold**: >5 failures in 5 minutes
- **Purpose**: Identify authentication issues

#### Disconnects
- **Metric**: `aws:num-disconnects`
- **Threshold**: >10 disconnects in 5 minutes
- **Purpose**: Monitor connection stability

### 4. Integration with Main Stack

The construct is integrated into the main AppSync backend:

```typescript
// In backend/constructs/appsync-main-construct.ts
const defenderProfile: DeviceDefenderProfileConstruct = new DeviceDefenderProfileConstruct(
  this,
  'DeviceDefenderProfile',
  {
    region: props.region,
    accountId: props.accountId
  }
);
```

## Deployment Process

### 1. Automatic Creation
When you run `npm run deploy`, the security profile is automatically:
- Created with the specified behaviors
- Attached to all IoT things in the account
- Configured to start collecting metrics immediately

### 2. Verification
After deployment, verify the profile exists:
```bash
aws iot describe-security-profile --security-profile-name FleetWatchSecurityProfile --region us-west-2
```

### 3. Metrics Collection
Device Defender metrics will begin appearing in the FleetWatch UI within 5-15 minutes after:
- The security profile is attached
- Devices are active and generating events
- AWS processes and aggregates the metrics

## Customization

### Modifying Thresholds
To adjust the security thresholds, edit the `behaviors` array in the Lambda function:

```python
behaviors = [
    {
        'name': 'ConnectionAttempts',
        'metric': 'aws:num-connection-attempts',
        'criteria': {
            'comparisonOperator': 'greater-than',
            'value': {'count': 100},  # Increase threshold
            'durationSeconds': 600    # Increase time window
        }
    }
    # ... other behaviors
]
```

### Adding New Behaviors
You can add additional security behaviors by extending the `behaviors` array:

```python
{
    'name': 'MessageSize',
    'metric': 'aws:message-byte-size',
    'criteria': {
        'comparisonOperator': 'greater-than',
        'value': {'number': 1024},
        'durationSeconds': 300
    }
}
```

### Available Metrics
AWS IoT Device Defender supports these metrics:
- `aws:num-connection-attempts`
- `aws:num-authorization-failures`
- `aws:num-disconnects`
- `aws:disconnect-duration`
- `aws:message-byte-size`
- `aws:num-messages-sent`
- `aws:num-messages-received`

## Troubleshooting

### Common Issues

#### 1. Permission Errors
If deployment fails with permission errors, ensure your AWS credentials have:
- `iot:CreateSecurityProfile`
- `iot:AttachSecurityProfile`
- All other permissions listed above

#### 2. Profile Already Exists
The construct handles existing profiles gracefully by:
- Checking if the profile exists
- Attaching it to all things if not already attached
- Continuing with deployment

#### 3. No Metrics Appearing
If Device Defender metrics don't appear:
- Wait 15-30 minutes for initial data collection
- Ensure devices are actively connecting/disconnecting
- Verify the security profile is attached to your devices
- Check that device activity exceeds the configured thresholds

### Debugging

#### Check Security Profile Status
```bash
aws iot describe-security-profile --security-profile-name FleetWatchSecurityProfile --region us-west-2
```

#### List Attached Targets
```bash
aws iot list-targets-for-security-profile --security-profile-name FleetWatchSecurityProfile --region us-west-2
```

#### View CloudWatch Logs
Check the Lambda function logs in CloudWatch for any errors during profile creation.

## Benefits of Deployment-Time Creation

### 1. Consistency
- Every FleetWatch deployment includes Device Defender monitoring
- No manual configuration required
- Consistent security posture across environments

### 2. Automation
- Security profile is created automatically
- Attached to all devices immediately
- No post-deployment setup needed

### 3. Infrastructure as Code
- Security configuration is version controlled
- Changes can be reviewed and tested
- Easy to replicate across environments

### 4. Immediate Monitoring
- Devices are monitored from the moment they connect
- No gap in security coverage
- Metrics available as soon as devices are active

## Migration from Manual Setup

If you previously created Device Defender profiles manually:

1. **Backup Existing Configuration**
   ```bash
   aws iot describe-security-profile --security-profile-name YourExistingProfile --region us-west-2 > backup.json
   ```

2. **Update CDK Construct**
   Modify the construct to match your existing configuration

3. **Deploy**
   The construct will detect and use existing profiles where possible

4. **Verify**
   Ensure all devices are properly monitored after deployment

## Security Considerations

### 1. Least Privilege
The Lambda function uses minimal required permissions for Device Defender operations.

### 2. Monitoring Scope
The security profile is attached to all IoT things, providing comprehensive coverage.

### 3. Threshold Tuning
Default thresholds are conservative. Adjust based on your device behavior patterns.

### 4. Alert Integration
Consider integrating Device Defender violations with your alerting system for proactive monitoring.

## Conclusion

Deploying Device Defender profiles as part of your infrastructure ensures consistent, automated security monitoring for your IoT fleet. The FleetWatch implementation provides a robust foundation that can be customized for your specific security requirements.

For questions or issues, refer to the AWS IoT Device Defender documentation or check the CloudWatch logs for the custom resource Lambda function.
