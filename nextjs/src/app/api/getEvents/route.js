import { NextResponse } from "next/server";
import getOnPremEvents from "@/services/getOnPremEvents";

export async function GET(request) {
    const argsNames = "room";
    const room = request.nextUrl.searchParams.get(argsNames);
    const isRoom = request.nextUrl.searchParams.has(argsNames);
    if (!isRoom) {
        return NextResponse.json({"Error" : "missing room argument"});
    }
    const items = await getOnPremEvents(room)
    return NextResponse.json({"items" : items});
}