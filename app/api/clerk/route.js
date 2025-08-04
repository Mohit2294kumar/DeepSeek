import { Webhook } from "svix";
import ConnectDB from "@/config/db";
import User from "@/models/User";
import { headers } from "next/headers";
import { NextRequest } from "next/server";

export async function POST(req) {
    const wh = new Webhook(process.env.SIGNING_SECRET);
    Const headerPayload = await headers()
    const svixHeaders = {
        "svix-id": headerPayload.get("svix-id"),
        "svix-signature": headerPayload.get("svix-signature"),
    };

    //Get the payload and verify the signature
    
    const payload = await req.json();
    const body = JSON.stringify(payload);
    const { data, type } = wh.verify(body, svixHeaders);
    
    //Prepare the user data to be saved in the database
    const userData = {
        _id: data.id,
        email: data.emailAddresses[0].emailAddresses,
        name: `${data.firstName} ${data.lastName}`,
        image: data.image_Url,
    };

    //Save the user data to the database
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
    return NextRequest.json({ message: "Event received" });
}