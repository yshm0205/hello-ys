(function(root){'use strict';let cached=null;
function isSupported(text,qualities){if(typeof text!=='string'||text.length>32)return false;const m=text.match(/^([A-G][#b]?)(.*?)(?:\/([A-G][#b]?))?$/);return !!m&&qualities.includes(m[2]);}
async function load(){if(!cached)cached=fetch('/kimatchum-engine/chord-support.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('지원 코드 목록을 불러오지 못했습니다.');return r.json();}).catch(e=>{cached=null;throw e;});return cached;}
const api={isSupported,load};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.ChordSupport=api;
})(typeof window!=='undefined'?window:globalThis);
