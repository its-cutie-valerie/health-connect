# Health Connect Synchronization Framework

An enterprise-ready mobile application ecosystem designed to bridge Android's native Health Connect API with remote data ingestion systems. This project serves as a robust foundation for health data aggregation, providing a secure and scalable pipeline from device-level sensors to centralized server infrastructure.

## Project Overview

The **Health Connect Synchronization Framework** simplifies the complex process of interacting with Android's secure health data silos. It implements a full-stack solution—comprising a cross-platform mobile client and a Node.js-based reconciliation server—to demonstrate seamless, permission-guarded health data extraction and synchronization.

## Key Features

- **Native Health Connect Integration**: Implements deep integration with the Android Health Connect SDK for secure, local-first data retrieval.
- **Granular Permission Management**: Features a robust permission negotiation layer, allowing users to explicitly authorize access to specific data types (Steps, Heart Rate, etc.).
- **Real-Time Data Aggregation**: Processes and summarizes granular sensor records into actionable daily metrics directly on the device.
- **Dynamic API Ingestion**: Offers a configurable network layer allow-listing remote endpoints for data synchronization via RESTful APIs.
- **Cross-Platform Readiness**: Built on Expo, providing an optimized development experience while maintaining accessibility for potential iOS health integrations.
- **Real-Time Dashboards**: Includes a specialized administrative dashboard for monitoring and validating incoming data payloads in real-time.

## Technology Stack

### Mobile Client

- **Core Framework**: React Native (via Expo SDK 52)
- **Programming Language**: TypeScript (Strongly Typed architecture)
- **Native Modules**: `react-native-health-connect` for direct hardware-level API access.
- **Navigation**: Expo Router (File-based routing system)
- **Styling**: Themed UI components with support for adaptive light/dark modes.

### Backend Infrastructure

- **Server Environment**: Node.js
- **API Framework**: Express.js
- **Data Serialization**: JSON-standardized packets with ISO-8601 timestamps.
- **Development Tools**: CORS-enabled for cross-origin local testing.

## Technical Architecture

The architecture follows a decoupled client-server pattern:

1. **Ingestion Layer**: A mobile frontend triggers native Android permission dialogs to unlock access to the Health Connect datastore.
2. **Transformation Layer**: Local data is filtered, reduced, and formatted into structured JSON payloads.
3. **Transport Layer**: Data is securely transmitted over HTTP/HTTPS to a configurable remote receiver.
4. **Reconciliation Layer**: The backend server validates, logs, and visualizes the data for administrative oversight.

## Installation & Deployment

### Mobile Setup

1. **Environment Preparation**: Ensure the Android device has the Health Connect application installed.
2. **Dependency Installation**:

   ```bash
   npm install
   ```

3. **Local Development Build**:

   ```bash
   npx expo run:android
   ```

### Backend Deployment

1. **Navigate to Directory**:

   ```bash
   cd backend/
   ```

2. **Launch Server**:

   ```bash
   node server.js
   ```

## Permissions & Compliance

This framework is built with privacy-by-design, strictly adhering to Android's health data privacy requirements. All data access is explicit, user-initiated, and restricted to the permissions declared in `app.json`.

---
*Developed as a showcase for native mobile API integration and full-stack synchronization patterns.*
