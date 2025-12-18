import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ClientModel } from '@/lib/models';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const clients = await ClientModel.getAll();
  return NextResponse.json(clients);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { full_name, passport_id, driving_license, passport_image, license_image } = body;

  if (!full_name || !passport_id || !driving_license) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  try {
    await ClientModel.create(full_name, passport_id, driving_license, passport_image, license_image);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create client' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { id, full_name, passport_id, driving_license } = body;

  if (!id || !full_name || !passport_id || !driving_license) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  try {
    await ClientModel.update(id, full_name, passport_id, driving_license);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update client' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }

  try {
    await ClientModel.delete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 });
  }
}
