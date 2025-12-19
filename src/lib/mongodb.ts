import { MongoClient, Db } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/carrental';

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClientPromise) {
    client = new MongoClient(MONGODB_URI);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(MONGODB_URI);
  clientPromise = client.connect();
}

export async function getDatabase(): Promise<Db> {
  const client = await clientPromise;
  return client.db();
}

export async function initDatabase(): Promise<void> {
  const db = await getDatabase();
  
  const collections = await db.listCollections().toArray();
  const collectionNames = collections.map(c => c.name);
  
  if (!collectionNames.includes('users')) {
    await db.createCollection('users');
  }
  if (!collectionNames.includes('cars')) {
    await db.createCollection('cars');
  }
  if (!collectionNames.includes('clients')) {
    await db.createCollection('clients');
  }
  if (!collectionNames.includes('rentals')) {
    await db.createCollection('rentals');
  }
  if (!collectionNames.includes('expenses')) {
    await db.createCollection('expenses');
  }
  
  const usersCollection = db.collection('users');
  const userCount = await usersCollection.countDocuments();
  
  if (userCount === 0) {
    const bcrypt = await import('bcryptjs');
    await usersCollection.insertMany([
      {
        username: 'admin',
        password_hash: await bcrypt.hash('admin1234', 10),
        created_at: new Date()
      },
      {
        username: 'manager',
        password_hash: await bcrypt.hash('manager1234', 10),
        created_at: new Date()
      }
    ]);
  }
  
  await db.collection('users').createIndex({ username: 1 }, { unique: true });
  await db.collection('cars').createIndex({ plate_number: 1 }, { unique: true });
}

export default clientPromise;
