import { auth } from '@/auth';
import { NextResponse } from 'next/server';

export async function GET() {
  const session = await auth();

  if (!session || session.provider !== 'strava' || !session.accessToken) {
    return NextResponse.json({ error: 'Unauthorized or not a Strava session' }, { status: 401 });
  }

  try {
    const response = await fetch('https://www.strava.com/api/v3/athlete/routes', {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Strava API returned ${response.status}`);
    }

    const routes = await response.json();
    return NextResponse.json(routes);
  } catch (error) {
    console.error('Strava API error:', error);
    return NextResponse.json({ error: 'Failed to fetch routes' }, { status: 500 });
  }
}
