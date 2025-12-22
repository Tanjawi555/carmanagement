import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { CarModel, RentalModel, ExpenseModel } from '@/lib/models';

export async function GET(request: NextRequest) {
  await RentalModel.checkExpiredRentals();
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const month = searchParams.get('month') || undefined;
  const year = searchParams.get('year') || undefined;

  const carStats = await CarModel.getStats();
  const totalExpenses = await ExpenseModel.getTotal(month, year);
  const totalRevenue = await RentalModel.getTotalRevenue(month, year);
  const totalProfit = totalRevenue - totalExpenses;
  const notifications = await RentalModel.getNotifications();

  return NextResponse.json({
    carStats,
    totalExpenses,
    totalRevenue,
    totalProfit,
    notifications,
    username: session.user?.name,
  });
}
