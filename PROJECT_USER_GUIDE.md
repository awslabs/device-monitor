# FleetWatch - Project User Guide

## Overview

FleetWatch is a comprehensive IoT device fleet management system built on AWS cloud services that serves as a complete replacement for AWS IoT FleetHub services (discontinued October 2025). This guide provides detailed instructions for understanding, deploying, and using the FleetWatch system.

## Table of Contents

1. [Project Description](#project-description)
2. [Architecture](#architecture)
3. [Prerequisites](#prerequisites)
4. [Installation & Setup](#installation--setup)
5. [Deployment](#deployment)
6. [Usage](#usage)
7. [Development](#development)
8. [Testing](#testing)
9. [Device Simulation](#device-simulation)
10. [API Documentation](#api-documentation)
11. [Troubleshooting](#troubleshooting)
12. [Contributing](#contributing)
13. [License](#license)

## Project Description

### What is FleetWatch?

FleetWatch is a modern, serverless IoT fleet management platform that provides:

- **Near Real-time Device Monitoring**: Track connection status, metrics, and health of IoT devices at scale
- **Advanced Device Management**: Manage device state through AWS IoT Device Shadows
- **Intelligent Filtering**: Search and filter devices with advanced criteria including date-time ranges
- **User Personalization**: Store user preferences, favorite devices, and custom filters
- **Customizable Dashboards**: Create personalized monitoring dashboards
- **Firmware Management**: Track and manage device firmware updates
- **Analytics & Insights**: Comprehensive fleet statistics and visualization
- **Device Simulation**: Built-in tools for testing and development

### Why FleetWatch?

As AWS IoT FleetHub reaches end-of-life in October 2025, FleetWatch provides a superior replacement with enhanced capabilities:

- **Enhanced Filtering**: Advanced filtering with date-time ranges (missing in FleetHub)
- **User Preferences**: Save and retrieve personalized view settings
- **Custom Dashboards**: Tailored monitoring interfaces
- **Better Analytics**: More comprehensive device statistics
- **Seamless Migration**: Built on AWS IoT Core for easy transition
- **Extensible Design**: Modular architecture for future enhancements

## Architecture

FleetWatch uses a modern serverless architecture leveraging AWS managed services:

### Core Components

- **Frontend**: React-based web application with TypeScript
- **API Layer**: AWS AppSync GraphQL API
- **Compute**: AWS Lambda functions for business logic
- **IoT Platform**: AWS IoT Core for device connectivity
- **State Management**: AWS IoT Device Shadow service
- **Monitoring**: AWS CloudWatch and IoT Device Defender
- **Infrastructure**: AWS CDK for Infrastructure as Code

### Project Structure

```
fleetWatch/
├── backend/                 # AWS CDK infrastructure and backend services
│   ├── appsync/            # GraphQL API definitions and resolvers
│   ├── constructs/         # Reusable CDK constructs
│   ├── fw-constructs/      # FleetWatch-specific constructs
│   └── config/             # Configuration files
├── web-app/                # React web application
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── graphql/        # GraphQL queries and mutations
│   │   ├── context/        # React context providers
│   │   └── hooks/          # Custom React hooks
├── device-simulator/       # IoT device simulation tools
├── shared/                 # Shared code and types
├── scripts/                # Utility scripts
└── tests/                  # Test files
```

## Prerequisites

Before getting started, ensure you have:

### Required Software
- **Node.js**: Version 22 or higher
- **npm**: Latest version (comes with Node.js)
- **AWS CLI**: Version 2.x configured with appropriate credentials
- **AWS CDK**: Version 2.x (`npm install -g aws-cdk`)
- **Python**: Version 3.8+ (for device simulator)
- **Git**: For version control

### AWS Requirements
- AWS account with appropriate permissions
- AWS CLI configured with credentials that have:
  - IoT Core permissions
  - Lambda permissions
  - AppSync permissions
  - CloudFormation permissions
  - IAM permissions for role creation

### Recommended Tools
- **VS Code**: With AWS Toolkit extension
- **Postman**: For API testing
- **AWS Console**: For resource monitoring

## Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd fleetWatch
```

### 2. Install Dependencies

```bash
# Install all workspace dependencies
npm install
```

This command installs dependencies for all workspaces (backend, web-app, shared) using npm workspaces.

### 3. Configure AWS Credentials

```bash
# Configure AWS CLI
aws configure

# Verify configuration
aws sts get-caller-identity
```

### 4. Environment Setup

The project uses environment-specific configurations. Default settings work for most deployments, but you can customize by setting environment variables:

```bash
# Optional: Set custom stack name
export STACK_NAME="my-fleetwatch-stack"
```

## Deployment

### Quick Deployment

Deploy the entire FleetWatch system with a single command:

```bash
npm run deploy
```

This command will:
1. Generate GraphQL code from schema
2. Type-check all workspaces
3. Run linting
4. Deploy AWS infrastructure using CDK
5. Generate environment files for the web application
6. Output API endpoints and resource information

### Step-by-Step Deployment

For more control over the deployment process:

```bash
# 1. Generate GraphQL types
npm run codegen

# 2. Type check
npm run type-check

# 3. Deploy infrastructure
npm run deploy
```

### Deployment Outputs

After successful deployment, you'll see outputs including:
- AppSync GraphQL API endpoint
- Web application URL
- IoT Core endpoint
- CloudWatch dashboard URLs

### Custom Stack Deployment

Deploy with a custom stack name:

```bash
STACK_NAME="production-fleetwatch" npm run deploy
```

## Usage

### Starting the Web Application

#### Development Mode

```bash
npm run start
```

This starts the React development server with hot reloading at `http://localhost:3000`.

#### Production Build

```bash
npm run build
```

### Core Features

#### 1. Device Monitoring

- **Near Real-time Status**: View connected/disconnected devices
- **Device Details**: Access comprehensive device information
- **Connection History**: Track device connectivity patterns
- **Health Metrics**: Monitor device performance indicators

#### 2. Device Management

- **Shadow Management**: Update and sync device state
- **Firmware Updates**: Manage device firmware versions
- **Device Grouping**: Organize devices into logical groups
- **Bulk Operations**: Perform actions on multiple devices

#### 3. Advanced Filtering

- **Multi-criteria Search**: Filter by device type, status, location, etc.
- **Date-time Ranges**: Filter by connection times and events
- **Saved Filters**: Store frequently used filter combinations
- **Favorite Devices**: Quick access to important devices

#### 4. Analytics Dashboard

- **Fleet Statistics**: Overview of device distribution and status
- **Trend Analysis**: Historical data visualization
- **Custom Metrics**: Create personalized monitoring views
- **Export Capabilities**: Download data for external analysis


## Development

### Development Workflow

1. **Start Development Server**:
   ```bash
   npm run start
   ```

2. **Make Changes**: Edit code in your preferred editor

3. **Type Checking**:
   ```bash
   npm run type-check
   ```

5. **Code Formatting**:
   ```bash
   npm run format
   ```

### GraphQL Development

The project uses GraphQL Code Generator for type-safe GraphQL operations:

```bash
# Generate types from GraphQL schema
npm run codegen
```

### Adding New Features

1. **Backend Changes**: Modify CDK constructs in `backend/`
2. **API Changes**: Update GraphQL schema in `backend/appsync/`
3. **Frontend Changes**: Add components in `web-app/src/`
4. **Shared Types**: Update shared interfaces in `shared/`

### Code Quality

The project enforces code quality through:
- **TypeScript**: Static type checking
- **ESLint**: Code linting with React-specific rules
- **Prettier**: Code formatting

## Device Simulation

FleetWatch includes a comprehensive device simulator for testing and development.

### Setting Up the Simulator

1. **Navigate to simulator directory**:
   ```bash
   cd device-simulator
   ```

2. **Install Python dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure simulator**:
   Edit `dev-config.yaml` to customize simulation parameters

4. **Run simulator**:
   ```bash
   python main.py
   ```

### Simulator Features

- **Multi-device Simulation**: Create hundreds of virtual devices
- **Realistic Behavior**: Simulate connection/disconnection patterns
- **Device Types**: Support for sensors, actuators, and gateways
- **Shadow Updates**: Automatic device shadow synchronization
- **Retained Messages**: Publish device state to MQTT topics
- **Firmware Simulation**: Simulate firmware updates and versions

### Simulator Configuration

Key configuration options in `dev-config.yaml`:

```yaml
simulation:
  device_count: 100
  update_interval: 30
  disconnect_probability: 0.1

device_types:
  - sensors
  - actuators
  - gateways

locations:
  - US
  - EU
  - APAC
```

### Cleanup

Remove simulated devices and resources:

```bash
python cleanup.py
```

## API Documentation

### GraphQL API

FleetWatch uses GraphQL for all API interactions. The API provides:

#### Queries

- `getDevice(thingName: String!)`: Get device details
- `listThings(filter: FilterInput)`: List devices with filtering
- `getThingShadow(thingName: String!, shadowName: String)`: Get device shadow
- `getLatestDeviceStats`: Get fleet statistics
- `getCloudwatchMetricData`: Get monitoring metrics

#### Mutations

- `updateThingShadow`: Update device shadow
- `createSchedule`: Create device schedule
- `updateUserPreferences`: Save user preferences

#### Subscriptions

- `onNewDeviceStats`: Real-time statistics updates
- `onDeviceStatusChange`: Device connection status changes

### REST API Endpoints

Some functionality is exposed through REST endpoints:

- `GET /health`: Health check endpoint
- `GET /metrics`: Prometheus-compatible metrics

### Authentication

API access is secured through:
- **AWS IAM**: For service-to-service communication and AWS console access (for Appsync debugging)
- **Amazon Cognito**: For user authentication (if configured)

## Troubleshooting

### Common Issues

#### 1. Deployment Failures

**Problem**: CDK deployment fails with permission errors
**Solution**: 
```bash
# Verify AWS credentials
aws sts get-caller-identity

# Check CDK bootstrap
cdk bootstrap aws://ACCOUNT-ID/REGION
```

#### 2. GraphQL Code Generation Issues

**Problem**: `npm run codegen` fails
**Solution**:
```bash
# Clean and reinstall dependencies
rm -rf node_modules package-lock.json
npm install
npm run codegen
```

#### 3. Device Simulator Connection Issues

**Problem**: Simulated devices can't connect to IoT Core
**Solution**:
```bash
# Verify IoT endpoint
aws iot describe-endpoint --endpoint-type iot:Data-ATS

# Check device certificates
aws iot list-certificates
```

#### 4. Web Application Build Errors

**Problem**: React build fails with type errors
**Solution**:
```bash
# Run type checking
npm run type-check

# Generate GraphQL types
npm run codegen
```

### Debug Mode

Enable debug logging:

```bash
# Backend debugging
export DEBUG=fleetwatch:*

# Frontend debugging
export REACT_APP_DEBUG=true
```

### Log Analysis

Check CloudWatch logs for:
- Lambda function errors
- AppSync resolver issues
- IoT Core connection problems

## Contributing

### Development Setup

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

### Code Standards

- **TypeScript**: Use strict type checking
- **React**: Follow React best practices and hooks patterns
- **GraphQL**: Use typed operations with code generation
- **AWS CDK**: Follow CDK best practices for infrastructure

### Pull Request Process

1. Ensure all tests pass
2. Update documentation as needed
3. Add appropriate labels
4. Request review from maintainers

### Issue Reporting

When reporting issues, include:
- Environment details (Node.js version, AWS region, etc.)
- Steps to reproduce
- Expected vs actual behavior
- Relevant logs or error messages

## License

Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.   

---

## Additional Resources

- [AWS IoT Core Documentation](https://docs.aws.amazon.com/iot/)
- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/)
- [React Documentation](https://reactjs.org/docs/)
- [GraphQL Documentation](https://graphql.org/learn/)
- [AWS AppSync Documentation](https://docs.aws.amazon.com/appsync/)

## Support

For questions and support:
- Create an issue in the repository
- Check existing documentation
- Review AWS service documentation
- Contact the development team

---

*This guide is maintained by the FleetWatch development team. Last updated: July 2025*
