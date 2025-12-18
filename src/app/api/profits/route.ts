import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { RentalModel, ExpenseModel } from '@/lib/models';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const totalRevenue = await RentalModel.getTotalRevenue();
  const totalExpenses = await ExpenseModel.getTotal();
  const totalProfit = totalRevenue - totalExpenses;
  const rentals = await RentalModel.getAll();

  return NextResponse.json({
    totalRevenue,
    totalExpenses,
    totalProfit,
    rentals,
  });
}
