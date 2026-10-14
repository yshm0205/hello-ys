const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),Module=require('node:module');
const ts=require('typescript'),sharp=require('sharp');
const root=path.resolve(__dirname,'..');
const owner='10000000-0000-4000-8000-000000000001',email='hmys0205hmys@gmail.com';
let state;
function fresh(){state={user:{id:owner,email,email_confirmed_at:'2026-01-01T00:00:00Z'},jobs:new Map(),objects:new Map(),mails:new Map(),sends:0,storageFail:false,finishFail:false,authCalls:0};
  Object.assign(process.env,{NEXT_PUBLIC_SUPABASE_URL:'https://trial-fixture.supabase.co',NEXT_PUBLIC_SUPABASE_ANON_KEY:'fake-anon',
    SUPABASE_SERVICE_ROLE_KEY:'fake-service',RESEND_API_KEY:'fake-resend',RESEND_FROM_EMAIL:'FlowSpot <test@example.test>',
    ADMIN_EMAILS:email,KIMATCHUM_TRIAL_REVIEWER_ID:owner,KIMATCHUM_TRIAL_PROJECT_REF:'trial-fixture',KIMATCHUM_TRIAL_ORIGIN:'http://127.0.0.1:8795',
    KIMATCHUM_TRIAL_ENABLED:'true',KIMATCHUM_TRIAL_SEND_ENABLED:'false'});}
function queue(id,kind,envelope){assert.equal(envelope.recipient,email);const key=id+':'+kind;if(!state.mails.has(key))state.mails.set(key,{id:key,kind,job:id,envelope,recipient:email,state:'pending',attempts:0});}
const admin={storage:{from:()=>({
  upload:async(name,raw)=>{if(state.storageFail)return {error:{}};if(state.objects.has(name))return {error:{}};state.objects.set(name,raw);return {data:{path:name}};},
  download:async(name)=>state.objects.has(name)?{data:new Blob([state.objects.get(name)])}:{error:{}},
})},rpc:async(_name,{p_action:a,p_owner:u,p_job:id,p_data:d})=>{
  assert.equal(u,owner);
  const j=state.jobs.get(id);let data={};
  if(a==='enroll')data={enrolled:true};
  else if(a==='ai_claim')data={allowed:true};
  else if(a==='preflight')data={schema_version:1};
  else if(a==='list')data={jobs:[...state.jobs.values()]};
  else if(a==='lookup')data=j?(j.fingerprint===d.fingerprint?{id,state:j.state,duplicate:true}:{error:'conflict'}):{};
  else if(a==='submit'){
    if(j){data=j.fingerprint===d.fingerprint?{id,state:j.state,duplicate:true}:{error:'conflict'};}
    else{assert.ok(state.objects.has(d.image_path));const row={...d,id,owner_id:u,state:'awaiting_email',version:0,result:null};state.jobs.set(id,row);queue(id,'verify',d.mail);data={id,state:row.state};}
  }else if(a==='read')data=j?structuredClone({...j,delivery:state.mails.get(id+':result')?.state}):{error:'not_found'};
  else if(a==='verify'){
    if(!j||j.state!=='awaiting_email'||j.verification_hash!==d.verification_hash)data={error:'expired'};
    else{j.state='queued';j.version++;queue(id,'access',d.access_mail);queue(id,'review_ready',d.review_mail);data={state:j.state};}
  }else if(a==='review_claim'){
    if(!j||j.state!=='queued')data={error:'conflict'};else{j.state='reviewing';j.version++;data={...j};}
  }else if(a==='complete'){
    if(j?.state==='completed'&&JSON.stringify(j.result)===JSON.stringify(d.result))data={state:'completed',duplicate:true};
    else if(!j||j.state!=='reviewing'||j.version!==d.version)data={error:'conflict'};
    else{Object.assign(j,{state:'completed',version:j.version+1,result:d.result,reviewer_id:u,approved_at:'2026-10-14T00:00:00Z',result_version:j.version+1});for(const pending of state.mails.values()){if(pending.job===id&&pending.state==='pending'&&['verify','access','review_ready'].includes(pending.kind))Object.assign(pending,{state:'blocked',code:'superseded_by_completion'});}queue(id,'result',d.mail);data={state:'completed'};}
  }else if(a==='mail_claim'){
    const m=[...state.mails.values()].find(m=>m.state==='pending');if(m){m.state='sending';m.attempts++;data={...m};}
  }else if(a==='mail_finish'){
    if(state.finishFail)return {error:{message:'mock'}};
    Object.assign(state.mails.get(id),d);data={state:d.state};
  }else throw new Error('Unexpected RPC '+a);
  return {data,error:null};
}};
function compile(relative,overrides){const filename=path.join(root,relative),compiled=ts.transpileModule(fs.readFileSync(filename,'utf8'),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true,resolveJsonModule:true}}).outputText;
  const instance=new Module(filename,module);instance.filename=filename;instance.paths=Module._nodeModulePaths(path.dirname(filename));
  const native=instance.require.bind(instance);instance.require=name=>name in overrides?overrides[name]:native(name);instance._compile(compiled,filename);return instance.exports;}
const access=compile('src/lib/admin/access.ts',{});
const recognition=compile('src/lib/kimatchum/recognition.ts',{'server-only':{}});
const server=compile('src/lib/kimatchum/server.ts',{'server-only':{},'./recognition':recognition,'@/lib/admin/access':access,'@/utils/supabase/server':{createClient:async()=>({auth:{getUser:async()=>{state.authCalls++;return {data:{user:state.user},error:null};}}})},'@/utils/supabase/admin':{createAdminClient:()=>admin}});
const route=compile('src/app/api/kimatchum/trial/[...path]/route.ts',{'@/lib/kimatchum/server':server});
async function request(method,segments,body){return route[method](new Request('http://127.0.0.1:8795/api/kimatchum/trial/'+segments,{
  method,headers:{Origin:'http://127.0.0.1:8795','Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)}),{params:Promise.resolve({path:segments.split('/')})});}
async function payload(){return {email,consent:true,title:'실제 경로 시험',idempotency_key:'a'.repeat(32),
  image:(await sharp({create:{width:40,height:40,channels:3,background:'white'}}).png().toBuffer()).toString('base64'),
  draft:[{id:'box1',text:'C',x0:.1,x1:.4,y0:.1,y1:.3,sys:0}]};}
const result={version:2,review_confirmed:true,source_key:0,note_key:0,target_key:2,bpm:90,beats:4,notes:'확인',chords:[{id:'box1',text:'C'}]};
async function submitted(){const response=await request('POST','requests',await payload());assert.equal(response.status,200);return (await response.json()).id;}
async function verified(id){const link=state.mails.get(id+':verify').envelope.body;const token=link.split('#km-verify=')[1];assert.equal((await request('POST',`requests/${id}/verify`,{token})).status,200);}

test('actual Next route exports execute intake, verification, claim, approval, owner image and status',async()=>{
  fresh();const id=await submitted();assert.equal(state.mails.has(id+':result'),false);await verified(id);
  assert.equal((await request('POST',`review/${id}/claim`,{})).status,200);
  assert.equal((await request('POST',`review/${id}/complete`,result)).status,200);
  const body=await (await request('GET',`requests/${id}`)).json();assert.equal(body.state,'completed');assert.equal(body.reviewer_id,owner);
  assert.equal(body.result_version,3);assert.ok(body.approved_at);assert.equal(body.result.chords[0].x0,.1);
  const image=await request('GET',`requests/${id}/image`);assert.equal(image.status,200);assert.equal(image.headers.get('content-type'),'image/png');
  assert.equal((await request('POST',`review/${id}/complete`,result)).status,200);assert.equal([...state.mails.values()].filter(m=>m.kind==='result').length,1);
});
test('missing config and mismatched project block before auth or storage',async()=>{
  fresh();delete process.env.ADMIN_EMAILS;assert.equal((await request('POST','requests',await payload())).status,503);
  assert.equal(state.authCalls,0);assert.equal(state.jobs.size,0);
  fresh();process.env.KIMATCHUM_TRIAL_PROJECT_REF='different';assert.equal((await request('GET','session')).status,503);
});
test('missing session or other UUID cannot submit',async()=>{fresh();state.user=null;assert.equal((await request('POST','requests',await payload())).status,401);
  fresh();state.user.id='20000000-0000-4000-8000-000000000001';assert.equal((await request('POST','requests',await payload())).status,403);assert.equal(state.jobs.size,0);});
test('other recipient, malformed image and storage failure create no outbox',async()=>{
  fresh();const p=await payload();assert.equal((await request('POST','requests',{...p,email:'other@example.test'})).status,400);
  assert.equal((await request('POST','requests',{...p,image:'AAAA'})).status,400);state.storageFail=true;
  assert.equal((await request('POST','requests',p)).status,503);assert.equal(state.jobs.size,0);assert.equal(state.mails.size,0);
});
test('preapproval, stale version, unsupported chord and foreign box rejected',async()=>{
  fresh();const id=await submitted();assert.equal((await request('POST',`review/${id}/complete`,result)).status,409);await verified(id);await request('POST',`review/${id}/claim`,{});
  assert.equal((await request('POST',`review/${id}/complete`,{...result,version:1})).status,409);
  for(const chord of [{id:'box1',text:'C999'},{id:'foreign',text:'C'}])assert.equal((await request('POST',`review/${id}/complete`,{...result,chords:[chord]})).status,400);
  assert.equal(state.mails.has(id+':result'),false);
});
test('concurrent duplicate actual route submits create one immutable request',async()=>{
  fresh();const p=await payload();const responses=await Promise.all(Array.from({length:5},()=>request('POST','requests',p)));
  assert.ok(responses.every(r=>r.status===200));assert.equal(state.jobs.size,1);assert.equal(state.mails.size,1);
  assert.equal((await request('POST','requests',{...p,title:'changed'})).status,409);
});
test('send disabled and same-origin protection hold on actual route',async()=>{
  fresh();assert.equal((await request('POST','dispatch',{})).status,503);
  const response=await route.POST(new Request('http://127.0.0.1:8795/api/kimatchum/trial/dispatch',{method:'POST',headers:{Origin:'https://other.test'}}),{params:Promise.resolve({path:['dispatch']})});
  assert.equal(response.status,403);assert.equal(state.sends,0);
});
test('actual dispatch route uses fixed recipient and records unknown on post-send DB failure',async()=>{
  fresh();await submitted();process.env.KIMATCHUM_TRIAL_SEND_ENABLED='true';state.finishFail=true;
  const oldFetch=global.fetch;global.fetch=async(url,init)=>{state.sends++;assert.equal(url,'https://api.resend.com/emails');const body=JSON.parse(init.body);assert.deepEqual(body.to,[email]);assert.equal(body.cc,undefined);return Response.json({id:'fake-resend-id'});};
  try{assert.equal((await (await request('POST','dispatch',{})).json()).state,'unknown');await request('POST','dispatch',{});assert.equal(state.sends,1);}finally{global.fetch=oldFetch;}
});
test('legacy local mailbox endpoints are not provided by new route',async()=>{fresh();for(const p of ['local/session','local/inbox'])assert.equal((await request('GET',p)).status,404);});

test('verified closed-account admin enrolls with no manually configured UUID',async()=>{
  fresh();delete process.env.KIMATCHUM_TRIAL_REVIEWER_ID;
  assert.equal((await request('GET','session')).status,200);
  process.env.ADMIN_EMAILS='other@example.test';state.user.user_metadata={adminAccessLevel:'full'};
  assert.equal((await request('GET','session')).status,503);
});

test('same request sends each lifecycle mail once after durable queueing',async()=>{
  fresh();process.env.KIMATCHUM_TRIAL_SEND_ENABLED='true';const original=global.fetch;
  global.fetch=async(url,init)=>{assert.equal(url,'https://api.resend.com/emails');assert.ok([...state.mails.values()].some(m=>m.state==='sending'));
    state.sends++;assert.deepEqual(JSON.parse(init.body).to,[email]);return Response.json({id:'mock-'+state.sends});};
  try{
    const id=await submitted();assert.equal(state.sends,1);await verified(id);assert.equal(state.sends,3);
    await request('POST',`review/${id}/claim`,{});await request('POST',`review/${id}/complete`,result);assert.equal(state.sends,4);
    await request('POST',`review/${id}/complete`,result);assert.equal(state.sends,4);
  }finally{global.fetch=original;}
});

test('same-request uncertain send is not retried by duplicate intake',async()=>{
  fresh();process.env.KIMATCHUM_TRIAL_SEND_ENABLED='true';const original=global.fetch;
  global.fetch=async()=>{state.sends++;throw new Error('mock lost response');};
  try{await submitted();await submitted();assert.equal(state.sends,1);assert.equal([...state.mails.values()][0].state,'unknown');}
  finally{global.fetch=original;}
});

test('Gemini actual route is disabled without configuration and rejects anonymous requests',async()=>{
  fresh();delete process.env.KIMATCHUM_TRIAL_AI_ENABLED;delete process.env.GEMINI_API_KEY;
  assert.equal((await request('POST','recognize',{})).status,503);
  state.user=null;assert.equal((await request('POST','recognize',{})).status,401);
});

test('Gemini actual route preserves numbered response contract and never retries timeout',async()=>{
  fresh();process.env.KIMATCHUM_TRIAL_AI_ENABLED='true';process.env.GEMINI_API_KEY='fake-only';
  const p=await payload(),input={images:['data:image/png;base64,'+p.image],key:'',where:'Image 1 holds line 1'};
  const original=global.fetch;let calls=0;
  global.fetch=async(url,init)=>{calls++;assert.ok(url.startsWith('https://generativelanguage.googleapis.com/'));assert.equal(new URL(url).search,'');
    assert.equal(init.headers['x-goog-api-key'],'fake-only');assert.ok(JSON.parse(init.body).contents[0].parts[1].inline_data);
    return Response.json({candidates:[{content:{parts:[{text:JSON.stringify([{line:1,chords:[{n:1,chord:'F#7'}]}])}]}}]});};
  try{
    const response=await request('POST','recognize',input);assert.equal(response.status,200);assert.equal((await response.json()).lines[0].chords[0].chord,'F#7');
    global.fetch=async()=>{calls++;throw new Error('mock timeout');};
    assert.equal((await request('POST','recognize',input)).status,503);assert.equal(calls,2);assert.equal(state.jobs.size,0);
  }finally{global.fetch=original;delete process.env.KIMATCHUM_TRIAL_AI_ENABLED;delete process.env.GEMINI_API_KEY;}
});

test('approval route rejects missing null fractional and string versions before completion',async()=>{
  fresh();const id=await submitted();await verified(id);await request('POST',`review/${id}/claim`,{});
  for(const version of [undefined,null,2.5,'2'])assert.equal((await request('POST',`review/${id}/complete`,{...result,version})).status,400);
  assert.equal(state.jobs.get(id).state,'reviewing');assert.equal(state.mails.has(id+':result'),false);
});

test('access timeout followed by approval suppresses obsolete pending review notice',async()=>{
  fresh();process.env.KIMATCHUM_TRIAL_SEND_ENABLED='true';const original=global.fetch;
  global.fetch=async()=>{state.sends++;if(state.sends===2)throw new Error('access response lost');return Response.json({id:'mock-'+state.sends});};
  try{
    const id=await submitted();await verified(id);assert.equal(state.mails.get(id+':access').state,'unknown');assert.equal(state.mails.get(id+':review_ready').state,'pending');
    await request('POST',`review/${id}/claim`,{});await request('POST',`review/${id}/complete`,result);
    assert.equal(state.mails.get(id+':review_ready').state,'blocked');assert.equal(state.mails.get(id+':access').state,'unknown');
    assert.equal(state.mails.get(id+':result').state,'accepted');assert.equal(state.sends,3);
  }finally{global.fetch=original;}
});

async function splitScore(){
  fresh();const p=await payload();p.draft=[
    {id:'box1',text:'Cb',x0:.1,x1:.2,y0:.1,y1:.2,sys:0},
    {id:'box2',text:'E#',x0:.21,x1:.4,y0:.09,y1:.22,sys:0},
    {id:'noise',text:'C',x0:.45,x1:.5,y0:.1,y1:.2,sys:0},
    {id:'last',text:'F#m',x0:.6,x1:.8,y0:.1,y1:.2,sys:0}];
  const reply=await request('POST','requests',p);assert.equal(reply.status,200);const id=(await reply.json()).id;
  await verified(id);await request('POST',`review/${id}/claim`,{});return id;
}
const mergedResult={...result,removed_ids:['noise'],chords:[{id:'box1',text:'C#/E#',source_ids:['box1','box2']},{id:'last',text:'F#m'}]};
test('review merge and explicit deletion preserve source, union bounds, order and version',async()=>{
  const id=await splitScore();const original=structuredClone(state.jobs.get(id).draft);
  assert.equal((await request('POST',`review/${id}/complete`,{...mergedResult,version:1})).status,409);
  assert.equal((await request('POST',`review/${id}/complete`,mergedResult)).status,200);
  const row=state.jobs.get(id);assert.deepEqual(row.draft,original);assert.equal(row.version,3);
  assert.deepEqual(row.result.chords.map(b=>b.text),['C#/E#','F#m']);
  assert.deepEqual(row.result.chords[0],{...original[0],text:'C#/E#',x1:.4,y0:.09,y1:.22,source_ids:['box1','box2']});
  assert.equal((await request('POST',`review/${id}/complete`,mergedResult)).status,200);
  assert.equal([...state.mails.values()].filter(m=>m.kind==='result').length,1);
});
test('review rejects forged, duplicate, reordered, omitted and cross-line merge sources',async()=>{
  const id=await splitScore();
  const invalid=[
    {...mergedResult,removed_ids:[]},
    {...mergedResult,removed_ids:['noise','noise']},
    {...mergedResult,removed_ids:['foreign']},
    {...mergedResult,chords:[...mergedResult.chords].reverse()},
    {...mergedResult,chords:[{id:'box1',text:'C#/E#',source_ids:['box1','box1']},mergedResult.chords[1]]},
    {...mergedResult,chords:[{id:'box1',text:'C#/E#',source_ids:['box1','foreign']},mergedResult.chords[1]]},
    {...mergedResult,chords:[{...mergedResult.chords[0],x0:0},mergedResult.chords[1]]},
    {...mergedResult,removed_ids:['box1','box2','noise','last'],chords:[]},
  ];
  for(const body of invalid)assert.equal((await request('POST',`review/${id}/complete`,body)).status,400);
  state.jobs.get(id).draft[1].sys=1;
  assert.equal((await request('POST',`review/${id}/complete`,mergedResult)).status,400);
  assert.equal(state.jobs.get(id).state,'reviewing');assert.equal(state.mails.has(id+':result'),false);
});
test('C#/E# and E# retain spelling, transpose and produce correct bass pitch',async()=>{
  const {default:core}=await import('../src/lib/kimatchum/chord-core.mjs');
  const chord=core.parseChord('C#/E#'),bass=core.parseChord('E#');
  assert.equal(chord.ok,true);assert.equal(chord.root,'C#');assert.equal(chord.bass,'E#');assert.equal(bass.ok,true);
  assert.equal(core.transpose(chord,0,9,9),'C#/E#');assert.equal(core.transpose(bass,0,9,9),'E#');
  assert.equal(core.transpose(chord,3,0,9),'E/G#');assert.equal(core.transpose(bass,3,0,9),'G#');
  assert.equal(core.tones(chord).bass,5);assert.equal(core.tones(bass).root,5);
});
