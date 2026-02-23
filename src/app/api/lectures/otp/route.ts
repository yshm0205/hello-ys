import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const videoId = body.videoId;
        if (!videoId || typeof videoId !== "string") {
            return NextResponse.json({ error: "videoId required" }, { status: 400 });
        }

        const res = await fetch(`https://dev.vdocipher.com/api/videos/${videoId}/otp`, {
            method: "POST",
            headers: {
                "Authorization": `Apisecret ${process.env.VDOCIPHER_API_SECRET}`,
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
            body: JSON.stringify({ ttl: 600 }),
        });

        if (!res.ok) {
            console.error("[OTP API] VdoCipher error:", res.status, await res.text());
            return NextResponse.json({ error: "Failed to generate OTP" }, { status: 502 });
        }

        const data = await res.json();
        return NextResponse.json({ otp: data.otp, playbackInfo: data.playbackInfo });
    } catch (err) {
        console.error("[OTP API] Error:", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
