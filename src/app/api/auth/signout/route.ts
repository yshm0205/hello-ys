import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
    const supabase = await createClient();
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL("/ko", process.env.NEXT_PUBLIC_APP_URL || "https://flowspot-kr.vercel.app"));
}
