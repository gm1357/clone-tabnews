import { Client } from "pg";
import { ServiceError } from "./errors";

async function query(queryObj) {
  const client = await getNewClient();

  try {
    const result = await client.query(queryObj);
    return result;
  } catch (err) {
    const serviceErrorObject = new ServiceError({
      cause: err,
      message: "Error with database query",
    });
    throw serviceErrorObject;
  } finally {
    await client.end();
  }
}

function getSSLValue() {
  if (process.env.POSTGRES_CA) {
    return { ca: process.env.POSTGRES_CA };
  }
  return process.env.NODE_ENV === "production" ? true : false;
}

async function getNewClient() {
  const client = new Client({
    host: process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT,
    user: process.env.POSTGRES_USER,
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
    ssl: getSSLValue(),
  });

  try {
    await client.connect();
    return client;
  } catch (err) {
    const serviceErrorObject = new ServiceError({
      cause: err,
      message: "Error with database connection",
    });
    throw serviceErrorObject;
  }
}

const database = {
  query,
  getNewClient,
};

export default database;
