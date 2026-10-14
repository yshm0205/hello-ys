if(new URLSearchParams(location.search).get('workspace')==='1'){
  document.documentElement.dataset.workspace='true';
  document.documentElement.dataset.theme='light';
  const notice=document.createElement('p');
  notice.className='workspace-limit';
  const label=document.createElement('strong');label.textContent='직접 비교하는 악보 작업실';
  notice.append(label,document.createTextNode('코드 편집·키 비교·반주·PNG 저장을 직접 사용할 수 있습니다. 자동 코드 인식은 원본 대조가 필요하며, 멜로디 판독·리듬·싱어 적합성은 미검증입니다. 키 후보는 입력한 공통 음역의 계산값이며 실제로 불러 확인해야 합니다. 오선 음표·조표는 전조되지 않습니다.'));
  const wrap=document.querySelector('.wrap');wrap.prepend(notice);
  let last=0;
  const observer=new ResizeObserver(()=>{
    const height=Math.ceil(wrap.getBoundingClientRect().height);
    if(height!==last){last=height;parent.postMessage({type:'km-workspace-height',height},location.origin);}
  });observer.observe(wrap);
}
