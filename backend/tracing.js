// tracing.js - OpenTelemetry initialization for Node.js

"use strict";

const process = require("process");
const opentelemetry = require("@opentelemetry/sdk-node");
const {
  getNodeAutoInstrumentations,
} = require("@opentelemetry/auto-instrumentations-node");
const { ConsoleSpanExporter } = require("@opentelemetry/sdk-trace-base");
const {
  PeriodicExportingMetricReader,
  ConsoleMetricExporter,
} = require("@opentelemetry/sdk-metrics");

// Configure exporters - using recommended console exporters
const traceExporter = new ConsoleSpanExporter();

// Configure metrics
const metricReader = new PeriodicExportingMetricReader({
  exporter: new ConsoleMetricExporter(),
  exportIntervalMillis: 30000, // Export every 30 seconds
});

const sdk = new opentelemetry.NodeSDK({
  serviceName: process.env.OTEL_SERVICE_NAME || "ai-research-backend",
  serviceVersion: process.env.OTEL_SERVICE_VERSION || "1.0.0",
  traceExporter,
  metricReader,
  instrumentations: [
    getNodeAutoInstrumentations({
      // Disable noisy instrumentations for cleaner output
      "@opentelemetry/instrumentation-fs": {
        enabled: false,
      },
      "@opentelemetry/instrumentation-dns": {
        enabled: false,
      },
      "@opentelemetry/instrumentation-net": {
        enabled: false,
      },
      "@opentelemetry/instrumentation-http": {
        enabled: true,
        ignoreIncomingRequestHook: (req) => {
          // Ignore health checks and favicon requests
          return (
            req.url?.includes("/health") ||
            req.url?.includes("/favicon") ||
            req.url?.includes("/_next")
          );
        },
      },
      "@opentelemetry/instrumentation-express": {
        enabled: true,
      },
      "@opentelemetry/instrumentation-pg": {
        enabled: true,
      },
      "@opentelemetry/instrumentation-redis-4": {
        enabled: true,
      },
    }),
  ],
});

// Initialize the SDK and register with the OpenTelemetry API
// This enables the API to record telemetry
sdk.start();

console.log("🔍 OpenTelemetry initialized with console exporters");
console.log(
  `📊 Service: ${process.env.OTEL_SERVICE_NAME || "ai-research-backend"}`
);
console.log(`🏷️  Version: ${process.env.OTEL_SERVICE_VERSION || "1.0.0"}`);

// Gracefully shut down the SDK on process exit
process.on("SIGTERM", () => {
  sdk
    .shutdown()
    .then(() => console.log("OpenTelemetry terminated"))
    .catch((error) => console.log("Error terminating OpenTelemetry", error))
    .finally(() => process.exit(0));
});

process.on("SIGINT", () => {
  sdk
    .shutdown()
    .then(() => console.log("OpenTelemetry terminated"))
    .catch((error) => console.log("Error terminating OpenTelemetry", error))
    .finally(() => process.exit(0));
});

module.exports = sdk;
