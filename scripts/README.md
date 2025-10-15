# Device Monitor Deployment Scripts

This directory contains scripts used during the deployment process of Device Monitor.

## Scripts

### generate-env.js

This script generates environment files for the web application based on the CloudFormation outputs. It is automatically executed during the post-deployment phase.

## Usage

These scripts are automatically executed when you run:

```bash
npm run deploy
```

The deployment process includes:

1. Code generation for GraphQL types
2. CDK deployment of all AWS resources
3. Generation of environment files for the web application

## IoT Device Defender Setup

IoT Device Defender security profiles are now managed through a Python Lambda function that is deployed as part of the CDK stack. This ensures that the security profile is properly created and configured during deployment.

The security profile collects the following metrics:
- Disconnects
- Connection Attempts
- Disconnect Duration
- Authorization Failures

## Troubleshooting

If you're not seeing data in the Defender Metrics tabs after deployment:

1. Verify the security profile was created:
   ```bash
   aws iot list-security-profiles
   ```

2. Check if the security profile is attached to all things:
   ```bash
   aws iot list-targets-for-security-profile --security-profile-name Device MonitorDefenderProfile
   ```

3. Wait for data collection - it may take several hours for metrics to appear in CloudWatch and the Device Monitor UI.

4. Simulate events to generate metrics:
   - Connection attempts: Restart your device simulator multiple times
   - Authorization failures: Use incorrect credentials in your device simulator
   - Disconnect duration: Disconnect devices for extended periods
