// biome-ignore assist/source/organizeImports: <explanation>
// import "./fuckshit.js";
import Floxy from "./classes/Floxy.js";
import config, { ConfigurationError } from "./config.js";
import logger from "./utils/logger.js";
if (!config.JWT_SECRET || config.JWT_SECRET === "supersecretkey") {
  throw new ConfigurationError("Invalid JWT_SECRET: it is required and cannot be 'supersecretkey'.");
}

if (!config.DELETION_SECRET || config.DELETION_SECRET === "STRONGDELETIONSECRET") {
  throw new ConfigurationError("Invalid DELETION_SECRET: it is required and cannot be 'STRONGDELETIONSECRET'.");
}

if (!process.env.EXTERNAL_CACHE_ENDPOINTS) {
  logger.warn("EXTERNAL_CACHE_ENDPOINTS not set.");
}

if (!process.env.CACHE_FOLDER) {
  logger.warn(`CACHE_FOLDER not set. Defaulting to: ${config.CACHE_FOLDER}`);
}
if (!process.env.YTDLP_COOKIES_PATH)
  logger.warn(`YTDLP_COOKIES_PATH not set. Defaulting to: ${config.YTDLP_COOKIES_PATH || "No cookies.txt found"}`);

if (!process.env.DATABASE_FILE) {
  logger.warn(`DATABASE_FILE not set. Defaulting to: ${config.DATABASE_FILE}`);
}

if (!process.env.ADMIN_PASSWORD || config.ADMIN_PASSWORD === "changeme123!") {
  throw new ConfigurationError("ADMIN_PASSWORD is required and must not use the example value.");
}

const floxyInstance = new Floxy({
  webserverHost: config.HOST,
  cacheFolder: config.CACHE_FOLDER,
  ytdlpPath: config.YTDLP_PATH,
  ffmpegPath: config.FFMPEG_PATH,
  ytdlpCookiesPath: config.YTDLP_COOKIES_PATH,
  ytdlpExtraArgs: config.YTDLP_EXTRA_ARGS,
  webserverPort: config.PORT,
  databaseFilePath: config.DATABASE_FILE,
  adminPassword: config.ADMIN_PASSWORD,
});

process.on("uncaughtException", error => {
  logger.error("uncaughtException", error);
});

process.on("unhandledRejection", error => {
  logger.error("unhandledRejection", error);
});

let shuttingDown = false;
const shutdown = async (signal: string) => {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info(`Received ${signal}; stopping Floxy.`);
  try {
    await floxyInstance.stop();
    process.exit(0);
  } catch (error) {
    logger.error("Failed to stop Floxy cleanly:", error);
    process.exit(1);
  }
};

process.once("SIGINT", () => void shutdown("SIGINT"));
process.once("SIGTERM", () => void shutdown("SIGTERM"));

try {
  logger.info("Setting up Floxy");
  await floxyInstance.setup();
  logger.info("Starting Floxy");
  await floxyInstance.start();
} catch (error) {
  logger.error("Error occurred while starting Floxy:", error);
  process.exitCode = 1;
}
