const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../public/kimatchum-engine/index.html'),'utf8');
function section(start,end){return html.slice(html.indexOf(start),html.indexOf(end,html.indexOf(start)));}
function context(values,source){const ctx=vm.createContext(values);vm.runInContext(source,ctx);return ctx;}
test('automatic key populates both controls, prefers signature, preserves manual edits',()=>{
 const c=context({SH:{chords:[{text:'A'},{text:'D'},{text:'E'}],ksig:null},S:{song:{}},CC:{parseChord:text=>({root:text}),guessKey:()=>9},KEYN:Array.from({length:12},(_,i)=>String(i)),renderSongInputs(){},refresh(){}},section('function keyFromChords(){','async function aiReadChords'));
 c.keyFromChords();assert.equal(c.S.song.key,9);assert.equal(c.S.song.noteKey,9);assert.equal(c.S.song.keyConfirmed,false);
 c.SH.ksig={pc:2};c.keyFromChords();assert.equal(c.S.song.key,2);assert.equal(c.S.song.noteKey,2);
 Object.assign(c.S.song,{keyManual:true,noteKeyManual:true,key:5,noteKey:7});c.keyFromChords();assert.equal(c.S.song.key,5);assert.equal(c.S.song.noteKey,7);
});
test('preview accepts unreviewed chords without key/range checks and reports skipped codes',()=>{
 const elements={};const c=context({SH:{chords:[{text:'A'},{text:'?'}],mel:null},S:{song:{keyConfirmed:false,rangeVerified:false},play:{mel:false}},SET:{songs:[]},$:id=>elements[id]??(elements[id]={}),parsed:c=>c.text==='A'?{}:null},section('function readyForPlayback(isSet){','function readyForExport'));
 assert.equal(c.readyForPlayback(false),true);assert.match(elements['#preview-note'].textContent,/1개는 건너/);
 c.SH.chords=[{text:'?'}];assert.equal(c.readyForPlayback(false),false);assert.match(elements['#now'].textContent,/재생할 코드가 없어요/);
});
test('one unreadable chord does not erase playable events and original melody stays unshifted',()=>{
 const c=context({SH:{chords:[{text:'A'},{text:'?'}],mel:{}},S:{song:{key:9},play:{bpm:60,mel:true,acc:true}},mod:(a,b)=>(a%b+b)%b,timeline:()=>[{kind:'chord',beat:0,dur:1,c:{text:'A'}},{kind:'chord',beat:1,dur:1,c:{text:'?'}},{kind:'note',beat:2,dur:1,n:{midi:60}}],evaluateFor:()=>({res:Array.from({length:12},()=>({s:2}))}),PC:{chordVoicing:(_cc,text,shift)=>text==='?'?null:{notes:[57+shift],label:text}},CC:{}},section('function playbackEvents(','function playVoice('));
 const moved=c.playbackEvents(11,0);assert.equal(moved.length,2);assert.equal(moved[0].notes[0],59);assert.equal(moved[1].notes[0],62);
 const original=c.playbackEvents(9,0,true);assert.equal(original[0].notes[0],57);assert.equal(original[1].notes[0],60);
});
test('original-preserving export is separate from overlay review protection',()=>{
 let safe=false;const c=context({S:{overlay:false},canOverlay:()=>safe,setMsg(){}},section('function readyForExport(){',"$('#note-key').addEventListener"));
 assert.equal(c.readyForExport(),true);c.S.overlay=true;assert.equal(c.readyForExport(),false);safe=true;assert.equal(c.readyForExport(),true);
});
