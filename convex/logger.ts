/**
 * Logger utility for generation workflows
 * Supports swappable destinations (default: console)
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

export type LogEntry = {
	level: LogLevel;
	message: string;
	timestamp: number;
	context?: Record<string, unknown>;
	error?: Error;
};

export type LoggerDestination = {
	log(entry: LogEntry): void | Promise<void>;
};

/**
 * Console destination (default)
 */
class ConsoleDestination implements LoggerDestination {
	log(entry: LogEntry): void {
		const timestamp = new Date(entry.timestamp).toISOString();
		const contextStr = entry.context ? ` ${JSON.stringify(entry.context)}` : "";
		const errorStr = entry.error
			? `\n${entry.error.stack || entry.error.message}`
			: "";

		const logMessage = `[${timestamp}] [${entry.level.toUpperCase()}] ${entry.message}${contextStr}${errorStr}`;

		switch (entry.level) {
			case "debug":
				// biome-ignore lint/suspicious/noConsole: This is a logger utility that needs console
				console.debug(logMessage);
				break;
			case "info":
				// biome-ignore lint/suspicious/noConsole: This is a logger utility that needs console
				console.log(logMessage);
				break;
			case "warn":
				// biome-ignore lint/suspicious/noConsole: This is a logger utility that needs console
				console.warn(logMessage);
				break;
			case "error":
				// biome-ignore lint/suspicious/noConsole: This is a logger utility that needs console
				console.error(logMessage);
				break;
			default:
				// biome-ignore lint/suspicious/noConsole: This is a logger utility that needs console
				console.log(logMessage);
				break;
		}
	}
}

/**
 * No-op destination (for testing or to disable logging)
 */
class NoOpDestination implements LoggerDestination {
	log(_entry: LogEntry): void {
		// Do nothing
	}
}

/**
 * File destination (writes to a file in tmp directory)
 */
class FileDestination implements LoggerDestination {
	private readonly filePath: string;

	constructor(filePath?: string) {
		// Default to tmp directory with timestamp
		this.filePath = filePath ?? `/tmp/convex-logs-${Date.now()}.log`;
	}

	log(entry: LogEntry): void {
		const timestamp = new Date(entry.timestamp).toISOString();
		const contextStr = entry.context ? ` ${JSON.stringify(entry.context)}` : "";
		const errorStr = entry.error
			? `\n${entry.error.stack || entry.error.message}`
			: "";

		const logMessage = `[${timestamp}] [${entry.level.toUpperCase()}] ${entry.message}${contextStr}${errorStr}\n`;

		try {
			// Use Node.js fs to append to file
			// Note: In Convex, we're running in a Node.js environment
			const fs = require("node:fs");
			fs.appendFileSync(this.filePath, logMessage);
		} catch (_error) {
			// Silently fail if file writing doesn't work
			// (e.g., in environments where fs is not available)
		}
	}

	getFilePath(): string {
		return this.filePath;
	}
}

/**
 * Multi-destination (writes to multiple destinations)
 */
class MultiDestination implements LoggerDestination {
	private readonly destinations: LoggerDestination[];

	constructor(destinations: LoggerDestination[]) {
		this.destinations = destinations;
	}

	log(entry: LogEntry): void {
		for (const destination of this.destinations) {
			destination.log(entry);
		}
	}
}

/**
 * Logger class with swappable destinations
 */
class Logger {
	private destination: LoggerDestination;
	private minLevel: LogLevel;

	constructor(destination?: LoggerDestination, minLevel: LogLevel = "info") {
		this.destination = destination ?? new ConsoleDestination();
		this.minLevel = minLevel;
	}

	/**
	 * Set a new destination for logs
	 */
	setDestination(destination: LoggerDestination): void {
		this.destination = destination;
	}

	/**
	 * Set minimum log level
	 */
	setMinLevel(level: LogLevel): void {
		this.minLevel = level;
	}

	/**
	 * Check if a level should be logged
	 */
	private shouldLog(level: LogLevel): boolean {
		const levels: LogLevel[] = ["debug", "info", "warn", "error"];
		const currentIndex = levels.indexOf(this.minLevel);
		const messageIndex = levels.indexOf(level);
		return messageIndex >= currentIndex;
	}

	/**
	 * Create a log entry
	 */
	private createEntry(
		level: LogLevel,
		message: string,
		context?: Record<string, unknown>,
		error?: Error
	): LogEntry {
		return {
			level,
			message,
			timestamp: Date.now(),
			context,
			error,
		};
	}

	/**
	 * Log a debug message
	 */
	debug(message: string, context?: Record<string, unknown>): void {
		if (this.shouldLog("debug")) {
			this.destination.log(this.createEntry("debug", message, context));
		}
	}

	/**
	 * Log an info message
	 */
	info(message: string, context?: Record<string, unknown>): void {
		if (this.shouldLog("info")) {
			this.destination.log(this.createEntry("info", message, context));
		}
	}

	/**
	 * Log a warning message
	 */
	warn(
		message: string,
		context?: Record<string, unknown>,
		error?: Error
	): void {
		if (this.shouldLog("warn")) {
			this.destination.log(this.createEntry("warn", message, context, error));
		}
	}

	/**
	 * Log an error message
	 */
	error(
		message: string,
		context?: Record<string, unknown>,
		error?: Error
	): void {
		if (this.shouldLog("error")) {
			this.destination.log(this.createEntry("error", message, context, error));
		}
	}

	/**
	 * Create a child logger with additional context
	 */
	withContext(context: Record<string, unknown>): ChildLogger {
		return new ChildLogger(this, context);
	}
}

/**
 * Child logger that automatically includes context
 */
class ChildLogger {
	private readonly parent: Logger;
	private readonly context: Record<string, unknown>;

	constructor(parent: Logger, context: Record<string, unknown>) {
		this.parent = parent;
		this.context = context;
	}

	private mergeContext(
		additionalContext?: Record<string, unknown>
	): Record<string, unknown> {
		return { ...this.context, ...additionalContext };
	}

	debug(message: string, context?: Record<string, unknown>): void {
		this.parent.debug(message, this.mergeContext(context));
	}

	info(message: string, context?: Record<string, unknown>): void {
		this.parent.info(message, this.mergeContext(context));
	}

	warn(
		message: string,
		context?: Record<string, unknown>,
		error?: Error
	): void {
		this.parent.warn(message, this.mergeContext(context), error);
	}

	error(
		message: string,
		context?: Record<string, unknown>,
		error?: Error
	): void {
		this.parent.error(message, this.mergeContext(context), error);
	}

	withContext(context: Record<string, unknown>): ChildLogger {
		return new ChildLogger(this.parent, this.mergeContext(context));
	}
}

// Determine if we're in development mode
const isDevelopment = process.env.NODE_ENV !== "production";

// Create default logger with file output in development
const defaultDestination = isDevelopment
	? new MultiDestination([new ConsoleDestination(), new FileDestination()])
	: new ConsoleDestination();

// Default logger instance
export const logger = new Logger(defaultDestination);

// Export classes for custom destinations
export {
	Logger,
	ConsoleDestination,
	NoOpDestination,
	FileDestination,
	MultiDestination,
	ChildLogger,
};

// Helper to create a logger with custom destination
export function createLogger(
	destination?: LoggerDestination,
	minLevel?: LogLevel
): Logger {
	return new Logger(destination, minLevel);
}

// Helper to disable logging
export function disableLogging(): void {
	logger.setDestination(new NoOpDestination());
}

// Helper to get file path if using file destination
export function getLogFilePath(): string | undefined {
	if (!isDevelopment) {
		return;
	}
	const fileDestination = new FileDestination();
	return fileDestination.getFilePath();
}
