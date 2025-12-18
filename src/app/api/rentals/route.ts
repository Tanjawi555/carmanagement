import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { RentalModel, CarModel, ClientModel } from '@/lib/models';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rentals = await RentalModel.getAll();
  const cars = await CarModel.getAll();
  const clients = await ClientModel.getAll();
  const availableCars = cars.filter(car => car.status === 'available');

  return NextResponse.json({ rentals, availableCars, clients });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { car_id, client_id, start_date, return_date, rental_price } = body;

  if (!car_id || !client_id || !start_date || !return_date) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  try {
    await RentalModel.create(car_id, client_id, start_date, return_date, parseFloat(rental_price) || 0);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create rental' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { id, status } = body;

  if (!id || !status) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  try {
    await RentalModel.updateStatus(id, status);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update rental' }, { status: 500 });
  }
}
