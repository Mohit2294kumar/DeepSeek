import { Webhook } from "svix";
import ConnectDB from "@/config/db";
import User from "@/models/User";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req) {
    const wh = new Webhook(process.env.SIGNING_SECRET);
    const headerPayload = headers();
    const svixHeaders = {
        "svix-id": headerPayload.get("svix-id"),
        "svix-timestamp": headerPayload.get("svix-timestamp"),
        "svix-signature": headerPayload.get("svix-signature"),
    };

    // Get the payload and verify the signature
    const payload = await req.json();
    const body = JSON.stringify(payload);
    const { data, type } = wh.verify(body, svixHeaders);

    // Prepare the user data to be saved in the database
    const userData = {
        _id: data.id,
        email: data.email_addresses?.[0]?.email_address || "",
        name: `${data.first_name || ""} ${data.last_name || ""}`.trim(),
        image: data.image_url || "",
    };

    // Save the user data to the database
    await ConnectDB();

    switch (type) {
        case "user.created":
            await User.create(userData);
            break;
        case "user.updated":
            await User.findByIdAndUpdate(data.id, userData);
            break;
        case "user.deleted":
            await User.findByIdAndDelete(data.id);
            break;
        default:
            break;
    }
    return NextResponse.json({ message: "Event received" });
}
