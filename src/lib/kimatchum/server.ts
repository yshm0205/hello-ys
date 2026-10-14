import 'server-only';
import { createHash, randomBytes } from 'node:crypto';
import sharp from 'sharp';
import { z } from 'zod';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import policy from './chord-support.json';
import { dispatchOne } from './dispatch-core.mjs';
import { getFullAdminEmails } from '@/lib/admin/access';
import { recognizeScore, RecognitionError } from './recognition';

export const EMAIL = 'hmys0205hmys@gmail.com';
const BUCKET = 'kimatchum-trial-private';
const sha = (value: string | Buffer) => createHash('sha256').update(value).digest('hex');
const idSchema = z.string().regex(/^[a-f0-9]{32}$/);
const boxSchema = z.object({ id:z.string().regex(/^[A-Za-z0-9_-]{1,80}$/), text:z.string().max(80),
  x0:z.number().min(0).max(1), x1:z.number().min(0).max(1), y0:z.number().min(0).max(1), y1:z.number().min(0).max(1),
  sys:z.number().int().min(0).max(100) }).strict().refine(b=>b.x0<b.x1 && b.y0<b.y1);
const draftSchema=z.array(boxSchema).min(1).max(256).refine(rows=>new Set(rows.map(r=>r.id)).size===rows.length);
const submitSchema=z.object({email:z.literal(EMAIL),consent:z.literal(true),title:z.string().max(120),
  idempotency_key:z.string().regex(/^[A-Za-z0-9_-]{32,100}$/),image:z.string().max(8_388_708),draft:draftSchema}).strict();
const key=z.number().int().min(0).max(11);
const completeSchema=z.object({version:z.number().int(),review_confirmed:z.literal(true),source_key:key,note_key:key,target_key:key,
  bpm:z.number().int().min(30).max(220),beats:z.union([z.literal(3),z.literal(4)]),notes:z.string().max(2000).default(''),
  chords:z.array(z.object({id:z.string(),text:z.string().max(32)}).strict()).min(1).max(256)}).strict();
export class TrialError extends Error { constructor(public status:number, message:string){super(message);} }

export function configuration() {
  const required=['NEXT_PUBLIC_SUPABASE_URL','NEXT_PUBLIC_SUPABASE_ANON_KEY','SUPABASE_SERVICE_ROLE_KEY',
    'RESEND_API_KEY','RESEND_FROM_EMAIL','ADMIN_EMAILS','KIMATCHUM_TRIAL_PROJECT_REF','KIMATCHUM_TRIAL_ORIGIN'];
  const missing=required.filter(name=>!process.env[name]);
  if(process.env.KIMATCHUM_TRIAL_ENABLED!=='true')missing.push('KIMATCHUM_TRIAL_ENABLED');
  if(missing.length)return {ready:false,missing};
  try {
    const project=new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!);
    const origin=new URL(process.env.KIMATCHUM_TRIAL_ORIGIN!);
    if(project.hostname!==`${process.env.KIMATCHUM_TRIAL_PROJECT_REF}.supabase.co` || project.protocol!=='https:'
      || !getFullAdminEmails().includes(EMAIL)
      || (process.env.KIMATCHUM_TRIAL_REVIEWER_ID && !z.string().uuid().safeParse(process.env.KIMATCHUM_TRIAL_REVIEWER_ID).success)
      || (origin.protocol!=='https:' && !(origin.protocol==='http:' && origin.hostname==='127.0.0.1'))
      || origin.origin!==process.env.KIMATCHUM_TRIAL_ORIGIN) return {ready:false,missing:['trial_configuration_mismatch']};
  }catch{return {ready:false,missing:['trial_configuration_invalid']};}
  return {ready:true,missing:[]};
}

export async function context(request:Request) {
  if(!configuration().ready)throw new TrialError(503,'시험 접수 설정이 아직 준비되지 않았습니다.');
  if(request.method!=='GET' && (request.headers.get('origin')!==process.env.KIMATCHUM_TRIAL_ORIGIN
    || request.headers.get('sec-fetch-site')==='cross-site'))throw new TrialError(403,'같은 사이트에서 요청해 주세요.');
  const session=await createClient();
  const {data,error}=await session.auth.getUser();
  const user=data.user;
  if(error || !user)throw new TrialError(401,'FlowSpot 로그인이 필요합니다.');
  if((process.env.KIMATCHUM_TRIAL_REVIEWER_ID && user.id!==process.env.KIMATCHUM_TRIAL_REVIEWER_ID)
    || user.email!==EMAIL || !user.email_confirmed_at || !getFullAdminEmails().includes(user.email))
    throw new TrialError(403,'이번 시험은 지정된 본인 계정만 이용할 수 있습니다.');
  const admin=createAdminClient();
  const rpc=async(action:string,job='',payload:Record<string,unknown>={})=>{
    const {data:result,error:failure}=await admin.rpc('km_trial_command',{p_action:action,p_owner:user.id,p_job:job,p_data:payload});
    if(failure || !result || typeof result!=='object')throw new TrialError(503,'저장 상태를 확인하지 못했습니다. 새 요청을 만들기 전에 상태를 확인해 주세요.');
    if(result.error)throw new TrialError(({forbidden:403,not_found:404,conflict:409,expired:400,invalid:400,limit:429} as Record<string,number>)[result.error]||503,
      '요청 상태 또는 권한을 다시 확인해 주세요.');
    return result as Record<string,unknown>;
  };
  await rpc('enroll');
  const ready=await rpc('preflight');
  if(ready.schema_version!==1)throw new TrialError(503,'영구 저장소 연결을 먼저 확인해야 합니다.');
  return {user,admin,rpc};
}

async function sendQueued(ctx:Awaited<ReturnType<typeof context>>){
  if(process.env.KIMATCHUM_TRIAL_SEND_ENABLED!=='true')return {state:'disabled'};
  const outcomes=[];
  for(let i=0;i<2;i++){
    const outcome=await dispatchOne({getUser:async()=>ctx.user,apiKey:process.env.RESEND_API_KEY,fromEmail:process.env.RESEND_FROM_EMAIL,
      rpc:async(name,_owner,id,data)=>ctx.rpc(name,id,data),sendHttp:(url,init)=>fetch(url,{...init,signal:AbortSignal.timeout(8000)})});
    outcomes.push(outcome);
    if(outcome.state!=='accepted')break;
  }
  return {state:outcomes.at(-1)?.state||'idle',outcomes};
}

function envelope(job:string,kind:string,text:string){return {recipient:EMAIL,subject:`[키맞춤] ${kind}`,body:text,
  message_id:`<km-${sha(job+':'+kind)}@kimatchum.invalid>`};}
const url=(job:string)=>`${process.env.KIMATCHUM_TRIAL_ORIGIN}/ko/kimatchum?request=${job}`;

async function readJson(request:Request):Promise<unknown>{
  const reader=request.body?.getReader();if(!reader)throw new TrialError(400,'요청 내용이 없습니다.');
  let size=0;const chunks:Uint8Array[]=[];
  while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;
    if(size>9*1024*1024){await reader.cancel();throw new TrialError(413,'이미지는 6MiB 이하로 올려 주세요.');}chunks.push(value);}
  try{return JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{throw new TrialError(400,'요청 형식을 확인해 주세요.');}
}

export async function handle(request:Request,segments:string[]):Promise<Response> {
  const headers={'Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'};
  try {
    if(segments.join('/')==='capabilities' && request.method==='GET')return Response.json({
      enabled:configuration().ready,authenticated:false,external_mail:process.env.KIMATCHUM_TRIAL_SEND_ENABLED==='true',
      allowed_email:EMAIL,automatic_review:false,missing:configuration().missing},{headers});
    const ctx=await context(request);
    const [area,job,action]=segments;
    if(area==='recognize' && !job && request.method==='POST'){
      if(process.env.KIMATCHUM_TRIAL_AI_ENABLED!=='true'||!process.env.GEMINI_API_KEY)throw new RecognitionError(503,'기존 Gemini 설정이 준비되지 않았습니다.');
      const input=await readJson(request);
      await ctx.rpc('ai_claim');
      return Response.json(await recognizeScore(input),{headers});
    }
    if(area==='session' && request.method==='GET')return Response.json({email:ctx.user.email,ready:true},{headers});
    if(area==='requests' && !job && request.method==='GET')return Response.json(await ctx.rpc('list'),{headers});
    if(area==='dispatch' && request.method==='POST'){
      if(process.env.KIMATCHUM_TRIAL_SEND_ENABLED!=='true')throw new TrialError(503,'실제 이메일 발송은 아직 활성화되지 않았습니다.');
      const outcome=await dispatchOne({getUser:async()=>ctx.user,apiKey:process.env.RESEND_API_KEY,fromEmail:process.env.RESEND_FROM_EMAIL,
        rpc:async(name,_owner,id,data)=>ctx.rpc(name,id,data),sendHttp:fetch});
      return Response.json(outcome,{headers});
    }
    if(area==='requests' && !job && request.method==='POST'){
      const input=submitSchema.parse(await readJson(request));
      const encoded=input.image.replace(/^data:image\/(png|jpeg);base64,/,'');
      if(!/^[A-Za-z0-9+/]+={0,2}$/.test(encoded))throw new TrialError(400,'PNG 또는 JPEG 이미지를 올려 주세요.');
      const raw=Buffer.from(encoded,'base64');
      if(!raw.length || raw.length>6*1024*1024)throw new TrialError(413,'이미지는 6MiB 이하로 올려 주세요.');
      let metadata;try{metadata=await sharp(raw,{limitInputPixels:12_000_000,failOn:'warning'}).metadata();
        await sharp(raw,{limitInputPixels:12_000_000,failOn:'warning'}).stats();}catch{throw new TrialError(400,'이미지를 읽을 수 없습니다.');}
      if(!['png','jpeg'].includes(metadata.format||'') || (metadata.pages||1)>1 || Math.max(metadata.width||0,metadata.height||0)>6000)
        throw new TrialError(400,'PNG/JPEG 한 장, 최대 1200만 화소·한 변 6000px까지 지원합니다.');
      const mime=metadata.format==='png'?'image/png':'image/jpeg';
      const fingerprint=sha(JSON.stringify([input.title,sha(raw),input.draft]));
      const id=sha(ctx.user.id+':'+input.idempotency_key).slice(0,32);
      const old=await ctx.rpc('lookup',id,{fingerprint});if(old.id)return Response.json({...old,mail:await sendQueued(ctx)},{headers});
      const path=ctx.user.id+'/'+id;
      const uploaded=await ctx.admin.storage.from(BUCKET).upload(path,raw,{contentType:mime,upsert:false});
      if(uploaded.error){const prior=await ctx.admin.storage.from(BUCKET).download(path);
        if(prior.error || !prior.data || sha(Buffer.from(await prior.data.arrayBuffer()))!==sha(raw))throw new TrialError(503,'이미지 저장을 확인하지 못해 접수하지 않았습니다.');}
      const verification=randomBytes(32).toString('base64url');
      const response=await ctx.rpc('submit',id,{email:EMAIL,title:input.title,idem_hash:sha(ctx.user.id+':'+input.idempotency_key),
        fingerprint,image_path:path,mime,draft:input.draft,verification_hash:sha(verification),
        mail:envelope(id,'이메일 확인',`${url(id)}#km-verify=${verification}`)});
      return Response.json({...response,mail:await sendQueued(ctx)},{headers});
    }
    if((area!=='requests' && area!=='review') || !idSchema.safeParse(job).success)throw new TrialError(404,'요청을 찾을 수 없습니다.');
    if(area==='requests' && request.method==='GET'){
      const row=await ctx.rpc('read',job);
      if(action==='image'){
        if(row.image_path!==ctx.user.id+'/'+job)throw new TrialError(404,'이미지를 찾을 수 없습니다.');
        const {data,error}=await ctx.admin.storage.from(BUCKET).download(row.image_path as string);
        if(error||!data)throw new TrialError(503,'이미지를 불러오지 못했습니다.');
        return new Response(await data.arrayBuffer(),{headers:{...headers,'Content-Type':row.mime as string}});
      }
      if(action)throw new TrialError(404,'요청을 찾을 수 없습니다.');
      const {image_path,mime,...visible}=row;void image_path;void mime;
      return Response.json(visible,{headers});
    }
    if(request.method!=='POST')throw new TrialError(405,'지원하지 않는 요청입니다.');
    if(area==='requests' && action==='verify'){
      const input=z.object({token:z.string().min(20).max(100)}).strict().parse(await readJson(request));
      const response=await ctx.rpc('verify',job,{verification_hash:sha(input.token),
        access_mail:envelope(job,'접수 확인',url(job)),review_mail:envelope(job,'검수 대기',url(job))});
      return Response.json({...response,mail:await sendQueued(ctx)},{headers});
    }
    if(area==='review' && action==='claim')return Response.json(await ctx.rpc('review_claim',job),{headers});
    if(area==='review' && action==='complete'){
      const input=completeSchema.parse(await readJson(request));const row=await ctx.rpc('read',job);
      const draft=draftSchema.parse(row.draft);const seen=new Set<string>();
      if(input.chords.length!==draft.length)throw new TrialError(400,'접수한 모든 코드 영역을 확인해야 승인할 수 있습니다.');
      const chords=input.chords.map(chord=>{const original=draft.find(b=>b.id===chord.id);const match=/^([A-G][#b]?)(.*?)(?:\/([A-G][#b]?))?$/.exec(chord.text);
        if(!original||seen.has(chord.id)||!match||!policy.qualities.includes(match[2]))throw new TrialError(400,'원본 ID와 지원되는 코드만 승인할 수 있습니다.');
        seen.add(chord.id);return {...original,text:chord.text};});
      const {version,review_confirmed,...result}=input;void review_confirmed;
      const response=await ctx.rpc('complete',job,{version,result:{...result,chords},
        mail:envelope(job,'검수 완료',`검수한 코드 이미지와 반주를 확인하세요. 로그인이 필요합니다.\n${url(job)}`)});
      return Response.json({...response,mail:await sendQueued(ctx)},{headers});
    }
    throw new TrialError(404,'요청을 찾을 수 없습니다.');
  }catch(error){
    const status=error instanceof TrialError||error instanceof RecognitionError?error.status:error instanceof z.ZodError?400:503;
    const message=error instanceof TrialError||error instanceof RecognitionError?error.message:error instanceof z.ZodError?'입력 내용을 확인해 주세요.':'연결을 확인하지 못했습니다. 저장 상태를 먼저 확인해 주세요.';
    return Response.json({error:message},{status,headers});
  }
}
