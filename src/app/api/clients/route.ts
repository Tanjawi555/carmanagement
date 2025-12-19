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

  if (!full_name) {
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

  if (!id || !full_name) {
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
    const client = await ClientModel.getById(id);
    
    if (client) {
      const { unlink } = await import('fs/promises');
      const path = await import('path');
      const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'documents');

      if (client.passport_image) {
        try {
          await unlink(path.join(UPLOAD_DIR, client.passport_image));
        } catch (error) {
          console.error(`Failed to delete passport image: ${client.passport_image}`, error);
        }
      }

      if (client.license_image) {
        try {
          await unlink(path.join(UPLOAD_DIR, client.license_image));
        } catch (error) {
          console.error(`Failed to delete license image: ${client.license_image}`, error);
        }
      }
    }

    await ClientModel.delete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete client error:', error);
    return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 });
  }
}
