import mongoose from 'mongoose';

export interface DbStatus {
  connected: boolean;
  dbName: string;
  host?: string;
  mode: 'atlas' | 'local' | 'memory-test' | 'disconnected';
  error?: string;
}

let connectionPromise: Promise<typeof mongoose> | null = null;

export const getDbName = (): string => {
  if (process.env.NODE_ENV === 'test' && !process.env.MONGODB_DB_NAME) {
    return 'solaris_test';
  }
  return process.env.MONGODB_DB_NAME || 'solaris_dev';
};

export const connectDb = async (): Promise<typeof mongoose | null> => {
  const isProduction = process.env.NODE_ENV === 'production';
  const isTest = process.env.NODE_ENV === 'test' || process.env.SOLARIS_TEST_MODE === 'true';
  const uri = isTest ? (process.env.MONGODB_URI_TEST || process.env.MONGODB_URI) : process.env.MONGODB_URI;
  const dbName = getDbName();

  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  if (!uri) {
    if (isProduction) {
      const errMessage = 'FATAL: MONGODB_URI is required in production. Never silently falling back to in-memory storage.';
      console.error(errMessage);
      throw new Error(errMessage);
    }
    if (isTest) {
      // In isolated test mode without MongoDB URI, test suite operates with isolated store
      return null;
    }
    console.warn(`[Solaris DB] MONGODB_URI not set. Running in local fallback mode. Target DB: ${dbName}`);
    return null;
  }

  try {
    connectionPromise = mongoose.connect(uri, {
      dbName,
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 10,
    });
    await connectionPromise;
    console.log(`[Solaris DB] Successfully connected to MongoDB Atlas (database: ${dbName})`);
    return mongoose;
  } catch (error) {
    connectionPromise = null;
    if (isProduction) {
      const errMessage = `FATAL: Failed to connect to MongoDB Atlas in production: ${(error as Error).message}. Never silently falling back.`;
      console.error(errMessage);
      throw new Error(errMessage);
    }
    console.warn(`[Solaris DB] MongoDB Atlas connection error: ${(error as Error).message}. Target DB: ${dbName}`);
    if (isTest) {
      return null;
    }
    throw error;
  }
};

export const disconnectDb = async (): Promise<void> => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    connectionPromise = null;
  }
};

export const getDbStatus = (): DbStatus => {
  const state = mongoose.connection.readyState;
  const dbName = getDbName();
  if (state === 1) {
    const isAtlas = mongoose.connection.host.includes('mongodb.net');
    return {
      connected: true,
      dbName,
      host: mongoose.connection.host,
      mode: isAtlas ? 'atlas' : 'local',
    };
  }
  return {
    connected: false,
    dbName,
    mode: process.env.NODE_ENV === 'test' ? 'memory-test' : 'disconnected',
  };
};
