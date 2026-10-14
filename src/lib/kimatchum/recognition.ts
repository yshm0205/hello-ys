import 'server-only';
import {z} from 'zod';
import sharp from 'sharp';
import {visionPrompt} from './vision-prompt.mjs';

const inputSchema=z.object({images:z.array(z.string().max(8_388_708)).min(1).max(8),key:z.string().max(12),where:z.string().max(500)}).strict();
const lines=z.array(z.object({line:z.number().int().min(1).max(101),chords:z.array(z.object({
  n:z.number().int().min(0).max(1000).optional(),x:z.number().min(0).max(1).optional(),chord:z.string().min(1).max(24)
})).max(256)})).max(101);
const responseSchema=z.object({candidates:z.array(z.object({content:z.object({parts:z.array(z.object({text:z.string().max(100_000)})).min(1)})})).min(1)});
export class RecognitionError extends Error{constructor(readonly status:number,message:string){super(message);}}
export async function recognizeScore(input:unknown){
  const apiKey=process.env.GEMINI_API_KEY;
  if(process.env.KIMATCHUM_TRIAL_AI_ENABLED!=='true'||!apiKey)throw new RecognitionError(503,'기존 Gemini 설정이 준비되지 않아 서버 재인식을 사용할 수 없습니다.');
  const value=inputSchema.parse(input);
  const model=process.env.KIMATCHUM_GEMINI_MODEL||'gemini-2.5-flash';
  if(!/^[A-Za-z0-9.-]{1,80}$/.test(model))throw new RecognitionError(503,'Gemini 모델 설정을 확인해 주세요.');
  const images=[];
  for(const image of value.images){
    const match=/^data:(image\/(?:png|jpeg));base64,([A-Za-z0-9+/]+={0,2})$/.exec(image);
    if(!match)throw new RecognitionError(400,'PNG/JPEG 코드 줄 이미지만 보낼 수 있습니다.');
    const raw=Buffer.from(match[2],'base64');
    if(raw.length>6*1024*1024)throw new RecognitionError(413,'인식 이미지가 너무 큽니다.');
    const metadata=await sharp(raw,{limitInputPixels:12_000_000,failOn:'warning'}).metadata();
    if(!['png','jpeg'].includes(metadata.format||'')||(metadata.pages||1)>1)throw new RecognitionError(400,'이미지 형식을 확인해 주세요.');
    images.push({inline_data:{mime_type:match[1],data:match[2]}});
  }
  // Existing Gemini request contract and prompt, with bounded timeout and no retry.
  const response=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,{
    method:'POST',redirect:'error',signal:AbortSignal.timeout(40_000),headers:{'Content-Type':'application/json','x-goog-api-key':apiKey},
    body:JSON.stringify({contents:[{parts:[{text:visionPrompt(value.key,value.where)},...images]}],generationConfig:{temperature:0,response_mime_type:'application/json'}})
  });
  if(!response.ok)throw new RecognitionError(response.status===429?429:502,'Gemini 응답을 확인하지 못했습니다. 기존 인식 결과는 보존됩니다.');
  const envelope=responseSchema.parse(await response.json());
  const text=envelope.candidates[0].content.parts[0].text;
  const clean=text.replace(/^```(?:json)?\s*/,'').replace(/\s*```$/,'');
  const data:unknown=JSON.parse(clean);
  const wrapped=z.object({lines}).safeParse(data);
  return {lines:wrapped.success?wrapped.data.lines:lines.parse(data)};
}
