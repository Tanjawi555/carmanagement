import { ObjectId } from 'mongodb';
import { getDatabase } from './mongodb';

export interface Car {
  _id?: ObjectId;
  model: string;
  plate_number: string;
  status: 'available' | 'rented' | 'reserved';
  created_at: Date;
  current_rental?: {
    start_date: string;
    return_date: string;
  };
}

export interface Client {
  _id?: ObjectId;
  full_name: string;
  passport_id?: string;
  driving_license?: string;
  passport_image?: string | null;
  license_image?: string | null;
  created_at: Date;
}

export interface Rental {
  _id?: ObjectId;
  car_id: ObjectId;
  client_id: ObjectId;
  start_date: string;
  return_date: string;
  rental_price: number;
  status: 'reserved' | 'rented' | 'returned';
  created_at: Date;
}

export interface Expense {
  _id?: ObjectId;
  category: string;
  amount: number;
  expense_date: string;
  car_id?: ObjectId | null;
  description?: string | null;
  created_at: Date;
}

export interface User {
  _id?: ObjectId;
  username: string;
  password_hash: string;
  created_at: Date;
}

export const CarModel = {
  async getAll() {
    const db = await getDatabase();
    return db.collection('cars').aggregate([
      {
        $lookup: {
          from: 'rentals',
          let: { carId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$car_id', '$$carId'] },
                    { $in: ['$status', ['reserved', 'rented']] }
                  ]
                }
              }
            },
            { $sort: { created_at: -1 } },
            { $limit: 1 }
          ],
          as: 'active_rentals'
        }
      },
      {
        $addFields: {
          current_rental: { $arrayElemAt: ['$active_rentals', 0] }
        }
      },
      {
        $project: {
          active_rentals: 0
        }
      },
      { $sort: { created_at: -1 } }
    ]).toArray();
  },

  async getById(id: string) {
    const db = await getDatabase();
    return db.collection<Car>('cars').findOne({ _id: new ObjectId(id) });
  },

  async create(model: string, plate_number: string) {
    const db = await getDatabase();
    const result = await db.collection<Car>('cars').insertOne({
      model,
      plate_number,
      status: 'available',
      created_at: new Date(),
    });
    return result;
  },

  async update(id: string, model: string, plate_number: string) {
    const db = await getDatabase();
    return db.collection<Car>('cars').updateOne(
      { _id: new ObjectId(id) },
      { $set: { model, plate_number } }
    );
  },

  async updateStatus(id: string, status: 'available' | 'rented' | 'reserved') {
    const db = await getDatabase();
    return db.collection<Car>('cars').updateOne(
      { _id: new ObjectId(id) },
      { $set: { status } }
    );
  },

  async delete(id: string) {
    const db = await getDatabase();
    return db.collection<Car>('cars').deleteOne({ _id: new ObjectId(id) });
  },

  async getStats() {
    const db = await getDatabase();
    const cars = db.collection<Car>('cars');
    const total = await cars.countDocuments();
    const available = await cars.countDocuments({ status: 'available' });
    const rented = await cars.countDocuments({ status: 'rented' });
    const reserved = await cars.countDocuments({ status: 'reserved' });
    return { total, available, rented, reserved };
  },
};

export const ClientModel = {
  async getAll() {
    const db = await getDatabase();
    return db.collection<Client>('clients').find().sort({ created_at: -1 }).toArray();
  },

  async getById(id: string) {
    const db = await getDatabase();
    return db.collection<Client>('clients').findOne({ _id: new ObjectId(id) });
  },

  async create(
    full_name: string,
    passport_id?: string,
    driving_license?: string,
    passport_image?: string | null,
    license_image?: string | null
  ) {
    const db = await getDatabase();
    return db.collection<Client>('clients').insertOne({
      full_name,
      passport_id: passport_id || '',
      driving_license: driving_license || '',
      passport_image: passport_image || null,
      license_image: license_image || null,
      created_at: new Date(),
    });
  },

  async update(id: string, full_name: string, passport_id?: string, driving_license?: string) {
    const db = await getDatabase();
    return db.collection<Client>('clients').updateOne(
      { _id: new ObjectId(id) },
      { $set: { full_name, passport_id: passport_id || '', driving_license: driving_license || '' } }
    );
  },

  async delete(id: string) {
    const db = await getDatabase();
    return db.collection<Client>('clients').deleteOne({ _id: new ObjectId(id) });
  },
};

export const RentalModel = {
  async getAll() {
    const db = await getDatabase();
    const rentals = await db.collection('rentals').aggregate([
      {
        $lookup: {
          from: 'cars',
          localField: 'car_id',
          foreignField: '_id',
          as: 'car',
        },
      },
      {
        $lookup: {
          from: 'clients',
          localField: 'client_id',
          foreignField: '_id',
          as: 'client',
        },
      },
      { $unwind: '$car' },
      { $unwind: '$client' },
      {
        $project: {
          _id: 1,
          car_id: 1,
          client_id: 1,
          start_date: 1,
          return_date: 1,
          rental_price: 1,
          status: 1,
          created_at: 1,
          car_model: '$car.model',
          plate_number: '$car.plate_number',
          client_name: '$client.full_name',
        },
      },
      { $sort: { created_at: -1 } },
    ]).toArray();
    return rentals;
  },

  async create(
    car_id: string,
    client_id: string,
    start_date: string,
    return_date: string,
    rental_price: number
  ) {
    const db = await getDatabase();
    const result = await db.collection('rentals').insertOne({
      car_id: new ObjectId(car_id),
      client_id: new ObjectId(client_id),
      start_date,
      return_date,
      rental_price,
      status: 'reserved',
      created_at: new Date(),
    });
    await db.collection('cars').updateOne(
      { _id: new ObjectId(car_id) },
      { $set: { status: 'reserved' } }
    );
    return result;
  },

  async updateStatus(id: string, status: 'reserved' | 'rented' | 'returned') {
    const db = await getDatabase();
    const rental = await db.collection('rentals').findOne({ _id: new ObjectId(id) });
    if (rental) {
      const carStatus = status === 'returned' ? 'available' : status;
      await db.collection('rentals').updateOne(
        { _id: new ObjectId(id) },
        { $set: { status } }
      );
      await db.collection('cars').updateOne(
        { _id: rental.car_id },
        { $set: { status: carStatus } }
      );
    }
  },

  async update(
    id: string,
    car_id: string,
    client_id: string,
    start_date: string,
    return_date: string,
    rental_price: number
  ) {
    const db = await getDatabase();
    return db.collection('rentals').updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          car_id: new ObjectId(car_id),
          client_id: new ObjectId(client_id),
          start_date,
          return_date,
          rental_price,
        },
      }
    );
  },

  async delete(id: string) {
    const db = await getDatabase();
    const rental = await db.collection('rentals').findOne({ _id: new ObjectId(id) });
    if (rental && rental.status !== 'returned') {
      // If we are deleting an active/reserved rental, free up the car
      await db.collection('cars').updateOne(
        { _id: rental.car_id },
        { $set: { status: 'available' } }
      );
    }
    return db.collection('rentals').deleteOne({ _id: new ObjectId(id) });
  },

  async getNotifications() {
    const db = await getDatabase();
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const notifications: any[] = [];

    const startingToday = await db.collection('rentals').aggregate([
      { $match: { start_date: today, status: 'reserved' } },
      {
        $lookup: {
          from: 'cars',
          localField: 'car_id',
          foreignField: '_id',
          as: 'car',
        },
      },
      {
        $lookup: {
          from: 'clients',
          localField: 'client_id',
          foreignField: '_id',
          as: 'client',
        },
      },
      { $unwind: '$car' },
      { $unwind: '$client' },
    ]).toArray();

    for (const r of startingToday) {
      notifications.push({
        type: 'start_today',
        rental: {
          ...r,
          model: r.car.model,
          plate_number: r.car.plate_number,
          full_name: r.client.full_name,
        },
        severity: 'warning',
      });
    }

    const startingTomorrow = await db.collection('rentals').aggregate([
      { $match: { start_date: tomorrow, status: 'reserved' } },
      {
        $lookup: {
          from: 'cars',
          localField: 'car_id',
          foreignField: '_id',
          as: 'car',
        },
      },
      {
        $lookup: {
          from: 'clients',
          localField: 'client_id',
          foreignField: '_id',
          as: 'client',
        },
      },
      { $unwind: '$car' },
      { $unwind: '$client' },
    ]).toArray();

    for (const r of startingTomorrow) {
      notifications.push({
        type: 'start_tomorrow',
        rental: {
          ...r,
          model: r.car.model,
          plate_number: r.car.plate_number,
          full_name: r.client.full_name,
        },
        severity: 'info',
      });
    }

    const returnToday = await db.collection('rentals').aggregate([
      { $match: { return_date: today, status: 'rented' } },
      {
        $lookup: {
          from: 'cars',
          localField: 'car_id',
          foreignField: '_id',
          as: 'car',
        },
      },
      {
        $lookup: {
          from: 'clients',
          localField: 'client_id',
          foreignField: '_id',
          as: 'client',
        },
      },
      { $unwind: '$car' },
      { $unwind: '$client' },
    ]).toArray();

    for (const r of returnToday) {
      notifications.push({
        type: 'return_today',
        rental: {
          ...r,
          model: r.car.model,
          plate_number: r.car.plate_number,
          full_name: r.client.full_name,
        },
        severity: 'warning',
      });
    }

    const overdue = await db.collection('rentals').aggregate([
      { $match: { return_date: { $lt: today }, status: 'rented' } },
      {
        $lookup: {
          from: 'cars',
          localField: 'car_id',
          foreignField: '_id',
          as: 'car',
        },
      },
      {
        $lookup: {
          from: 'clients',
          localField: 'client_id',
          foreignField: '_id',
          as: 'client',
        },
      },
      { $unwind: '$car' },
      { $unwind: '$client' },
    ]).toArray();

    for (const r of overdue) {
      notifications.push({
        type: 'overdue',
        rental: {
          ...r,
          model: r.car.model,
          plate_number: r.car.plate_number,
          full_name: r.client.full_name,
        },
        severity: 'danger',
      });
    }

    return notifications;
  },

  async getTotalRevenue() {
    const db = await getDatabase();
    const result = await db.collection('rentals').aggregate([
      { $group: { _id: null, total: { $sum: '$rental_price' } } },
    ]).toArray();
    return result[0]?.total || 0;
  },
};

export const ExpenseModel = {
  async getAll() {
    const db = await getDatabase();
    const expenses = await db.collection('expenses').aggregate([
      {
        $lookup: {
          from: 'cars',
          localField: 'car_id',
          foreignField: '_id',
          as: 'car',
        },
      },
      {
        $unwind: {
          path: '$car',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 1,
          category: 1,
          amount: 1,
          expense_date: 1,
          car_id: 1,
          description: 1,
          created_at: 1,
          car_model: '$car.model',
          plate_number: '$car.plate_number',
        },
      },
      { $sort: { expense_date: -1 } },
    ]).toArray();
    return expenses;
  },

  async create(
    category: string,
    amount: number,
    expense_date: string,
    car_id?: string | null,
    description?: string | null
  ) {
    const db = await getDatabase();
    return db.collection('expenses').insertOne({
      category,
      amount,
      expense_date,
      car_id: car_id ? new ObjectId(car_id) : null,
      description: description || null,
      created_at: new Date(),
    });
  },

  async delete(id: string) {
    const db = await getDatabase();
    return db.collection('expenses').deleteOne({ _id: new ObjectId(id) });
  },

  async getTotal() {
    const db = await getDatabase();
    const result = await db.collection('expenses').aggregate([
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]).toArray();
    return result[0]?.total || 0;
  },
};
