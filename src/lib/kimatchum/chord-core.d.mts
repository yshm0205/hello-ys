interface Chord {root:string;qual:string;bass:string;ok:boolean;}
declare const core: {
  parseChord(text:string):Chord|null;
  transpose(chord:Chord,shift:number,key:number,sourceKey?:number):string;
  tones(chord:Chord):{root:number;bass:number;iv:number[]};
};
export default core;
