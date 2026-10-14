const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript'),Module=require('node:module'),path=require('node:path');
function load(name){const f=path.resolve(__dirname,'../src/lib/kimatchum',name+'.ts'),m=new Module(f,module);m.filename=f;m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);return m.exports;}
const brand=load('branding'),tokens=load('verification-return');
test('branding is limited to Kimatchum and its exact contextual login destination',()=>{
 for(const p of ['/ko/kimatchum','/en/kimatchum','/kimatchum'])assert.equal(brand.isKimatchumSurface(p),true);
 for(const p of ['/ko/login','/en/login'])assert.equal(brand.isKimatchumSurface(p,'/kimatchum?request=abc'),true);
 for(const v of ['/kimatchum-other','//evil.test/kimatchum','https://evil.test/kimatchum','/checkout/allinone','/dashboard'])assert.equal(brand.isKimatchumSurface('/ko/login',v),false);
 assert.equal(brand.isKimatchumSurface('/ko/pricing','/kimatchum'),false);
});
test('verification token survives same-tab login, stays request-scoped, expires and clears after use',()=>{
 const map=new Map(),storage={getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)},id='a'.repeat(32),token='local-fixture-token-not-secret';
 assert.equal(tokens.keepVerification(storage,id,token,1000),token);
 assert.equal(tokens.keepVerification(storage,id,null,2000),token);
 assert.equal(tokens.keepVerification(storage,'b'.repeat(32),null,2000),'');
 assert.equal(tokens.keepVerification(storage,id,null,1801000),'');
 tokens.keepVerification(storage,id,token,1000);tokens.clearVerification(storage,id);assert.equal(tokens.keepVerification(storage,id,null,2000),'');
 assert.equal(tokens.keepVerification(storage,'bad-id',token),'');assert.equal(map.size,0);
});
