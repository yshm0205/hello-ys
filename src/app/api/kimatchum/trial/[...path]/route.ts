import { handle } from '@/lib/kimatchum/server';

type Context = { params: Promise<{path:string[]}> };
export async function GET(request:Request,context:Context){return handle(request,(await context.params).path);}
export async function POST(request:Request,context:Context){return handle(request,(await context.params).path);}
export const runtime='nodejs';
export const dynamic='force-dynamic';
export const maxDuration=60;
