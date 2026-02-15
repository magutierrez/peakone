import { auth } from "@/auth"
import { NextResponse } from "next/server"

export async function GET() {
  const session = await auth()

  if (!session || session.provider !== 'strava' || !session.accessToken) {
    return NextResponse.json({ error: "Unauthorized or not a Strava session" }, { status: 401 })
  }

  try {
    const response = await fetch(
      `https://www.strava.com/api/v3/athlete/activities?per_page=15`,
      {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error("Failed to fetch activities from Strava")
    }

    const activities = await response.json()
    return NextResponse.json(activities)
  } catch (error) {
    console.error("Strava API error:", error)
    return NextResponse.json({ error: "Failed to fetch activities" }, { status: 500 })
  }
}
