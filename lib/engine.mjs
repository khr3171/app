export const categories = ['한식','중식','일식','양식','동남아','가벼운 식사'];
// Cost bands are recommendation heuristics, never verified restaurant prices.
const rows = [
['김치찌개','한식','🍲','spicy','comfort',2,'soup',1,1],['된장찌개','한식','🍲','mild','comfort',1,'soup',0,1],['순두부찌개','한식','🥘','spicy','comfort',1,'soup',0,1],['제육볶음','한식','🍛','spicy','release',2,'stir',1,1],['불고기','한식','🥩','meat','comfort',2,'stir',1,2],['비빔밥','한식','🥗','fresh','refresh',1,'rice',0,1],['국밥','한식','🍲','savory','comfort',2,'soup',0,1],['갈비탕','한식','🍲','meat','special',2,'soup',1,2],['냉면','한식','🍜','tangy','refresh',1,'cold',1,1],
['짜장면','중식','🍜','savory','comfort',2,'noodle',0,0],['짬뽕','중식','🍜','spicy','release',2,'soup',1,1],['볶음밥','중식','🍛','savory','comfort',2,'stir',0,0],['마라탕','중식','🥘','spicy','release',2,'soup',2,1],['마파두부덮밥','중식','🍛','spicy','release',2,'rice',1,1],
['돈가스','일식','🍱','meat','comfort',2,'crispy',0,1],['초밥','일식','🍣','fresh','special',1,'cold',1,2],['우동','일식','🍜','mild','comfort',1,'soup',0,0],['라멘','일식','🍜','savory','comfort',2,'soup',1,1],['규동','일식','🍚','meat','comfort',2,'rice',0,1],['가츠동','일식','🍱','meat','comfort',2,'rice',1,1],
['파스타','양식','🍝','tangy','special',1,'noodle',1,2],['리조또','양식','🍚','savory','special',2,'rice',1,2],['햄버거','양식','🍔','meat','release',2,'crispy',0,1],['피자','양식','🍕','savory','special',2,'crispy',1,2],['샌드위치','양식','🥪','fresh','refresh',0,'cold',0,0],
['쌀국수','동남아','🍜','mild','comfort',1,'soup',1,1],['팟타이','동남아','🍝','tangy','refresh',1,'stir',2,1],['카레','동남아','🍛','savory','comfort',2,'rice',1,1],['샐러드','가벼운 식사','🥗','fresh','refresh',0,'cold',1,1],['김밥','가벼운 식사','🍙','mild','comfort',0,'rice',0,0],
['닭갈비','한식','🥘','spicy','release',2,'stir',1,1],['보쌈','한식','🥬','meat','special',2,'rice',1,2],['칼국수','한식','🍜','mild','comfort',1,'soup',0,1],['떡볶이','한식','🌶️','spicy','release',1,'stir',0,0],['포케','가벼운 식사','🥗','fresh','refresh',1,'cold',2,1],['메밀소바','일식','🍜','mild','refresh',0,'cold',1,1],['오므라이스','일식','🍳','savory','comfort',1,'rice',0,1],['분짜','동남아','🥬','tangy','refresh',1,'cold',2,1],['수제비','한식','🍲','mild','comfort',1,'soup',0,1],['치킨','양식','🍗','meat','release',2,'crispy',0,2],['회덮밥','한식','🥗','fresh','refresh',1,'rice',1,1],['탄탄면','중식','🍜','spicy','special',2,'soup',2,1]
];
export const menus = rows.map(([name,category,emoji,taste,mood,hunger,form,adventure,cost],id)=>({id,name,category,emoji,taste,mood,hunger,form,adventure,cost}));
const opt = (emoji,title,sub,value)=>({emoji,title,sub,value});
export const questions = [
 {tag:'마음부터 살펴볼까요?',title:'아침부터 달려온 나,\n지금 내 상태는?',hint:'지금 마음에 가장 가까운 하나를 골라주세요.',key:'mood',options:[opt('🫠','배터리 5%, 충전이 필요해','따뜻한 한 끼로 토닥토닥','comfort'),opt('🌶️','스트레스, 한 입에 날려버려!','오늘은 화끈하게 풀고 싶어','release'),opt('🌿','조금 산뜻해지고 싶어','점심으로 리프레시할래','refresh'),opt('✨','평범한 하루에 작은 선물','오늘 점심은 좀 특별했으면','special')]},
 {tag:'같이 먹으면 더 맛있죠',title:'오늘 점심은\n누구랑 먹어?',hint:'오늘의 점심 메이트를 알려주세요.',key:'company',options:[opt('🎧','혼자만의 소중한 시간','내 속도대로 편하게','alone'),opt('💼','함께 일하는 동료','호불호 없이 즐거운 한 끼','coworker'),opt('🤝','상사·내빈과 함께','차분하고 대화하기 좋은 식사','guest'),opt('💛','친구 또는 소중한 사람','맛있는 거 먹으며 수다 한 스푼','friend')]},
 {tag:'꼬르륵, 배 속의 신호',title:'지금 배고픔을\n소리로 표현하면?',hint:'양에 대한 취향을 추천에 반영해요.',key:'hunger',options:[opt('🐦','짹, 가볍게 먹고 싶어','오후까지 산뜻한 정도',0),opt('🐱','야옹, 적당히 배고파','딱 기분 좋은 한 끼',1),opt('🦁','어흥! 든든하게 채워줘','오늘은 제대로 먹어야 해',2),opt('🧸','고민 말고 무난하게','평소 먹는 양이면 좋아',1)]},
 {tag:'오늘 혀끝이 원하는 것',title:'지금 가장 끌리는\n맛의 한 조각은?',hint:'추천에 가장 크게 반영되는 질문이에요.',key:'taste',options:[opt('🌶️','화끈하게 매콤한 맛','맵부심을 깨우는 한 입','spicy'),opt('🍃','편안하고 담백한 맛','자극 없이 포근하게','mild'),opt('🍄','입안 가득 감칠맛','진하고 깊은 맛이 좋아','savory'),opt('🍋','상큼하고 신선한 맛','아삭아삭, 기분까지 싱그럽게','fresh'),opt('🥩','육즙이 팡! 고기 맛','씹는 행복이 필요해','meat')]},
 {tag:'한 숟갈의 온도',title:'오늘 내 식탁에\n놓고 싶은 건?',hint:'떠올리기만 해도 끌리는 걸 골라봐요.',key:'form',options:[opt('♨️','따끈한 국물 한 숟갈','속까지 포근하게','soup'),opt('🍳','불맛 나는 볶음 요리','고소하게 지글지글','stir'),opt('🧊','시원하고 산뜻한 한 그릇','입맛을 깨우는 청량함','cold'),opt('🍚','밥 위에 행복을 듬뿍','한 그릇으로 든든하게','rice'),opt('🍤','바삭함 또는 후루룩 면','먹는 재미가 있었으면','crispy')]},
 {tag:'창밖 날씨도 한 스푼',title:'오늘 창밖은\n어떤 표정이야?',hint:'현재 날씨를 직접 골라주세요.',key:'weather',options:[opt('☀️','햇살 가득, 기분 좋은 날','산뜻한 점심이 어울려','sunny'),opt('🌧️','비가 톡톡, 흐린 날','따뜻한 음식이 생각나','rain'),opt('🥵','덥다 더워, 후끈한 날','시원하게 기분 전환','hot'),opt('🧣','쌀쌀해, 몸이 움츠러드는 날','뜨끈한 온기가 필요해','cold'),opt('☁️','실내라 잘 모르겠어','날씨보다 내 취향대로','neutral')]},
 {tag:'익숙함과 새로운 발견 사이',title:'오늘의 나는\n어떤 점심 여행자?',hint:'새로운 메뉴를 만날 준비가 됐나요?',key:'adventure',options:[opt('🏠','늘 먹던 그 맛이 좋아','익숙한 메뉴로 실패 없이',0),opt('🚶','익숙한 곳에서 한 발짝','부담 없는 변화 정도는 좋아',1),opt('🧭','새로운 맛이라면 환영!','오늘은 작은 미식 모험',2),opt('🎲','뭐든 좋아, 골라줘','취향에 맞으면 새로워도 좋아',1)]},
 {tag:'마지막, 현실도 챙겨볼까요?',title:'오늘 점심에\n얼마나 쓸 수 있어?',hint:'메뉴군의 일반적 예산대를 참고해요. 실제 가격은 매장에서 확인해 주세요.',key:'budget',options:[opt('🪙','가볍게, 1만 원 이하','알뜰하게 챙기는 한 끼',0),opt('💵','적당하게, 1만~1만 5천 원','맛과 가격의 균형',1),opt('💳','여유롭게, 1만 5천~2만 원','조금 더 근사해도 괜찮아',2),opt('🎁','오늘은 가격보다 기분','나를 위해 선물할래',3)]}
];
export function validAnswers(a) { return a && questions.every(q=>q.options.some(o=>o.value===a[q.key])); }
export const weights = {taste:30,mood:20,hunger:20,form:15,situation:15};
export function recommend(a,previous='',environment='any') {
 if(!validAnswers(a)||!['any','quick','delivery','dine'].includes(environment)) throw Error('답변을 모두 선택해 주세요.');
 const candidates=menus.filter(m=>m.name!==previous && (a.budget===3 || m.cost<=a.budget));
 return candidates.map(m=>{
  const taste=m.taste===a.taste?1:((a.taste==='fresh'&&m.taste==='tangy')?.85:.15);
  const mood=m.mood===a.mood?1:.25;
  const hunger=1-Math.abs(m.hunger-a.hunger)/2;
  let form=m.form===a.form?1:((a.form==='crispy'&&m.form==='noodle')?.8:.1);
  if(['rain','cold'].includes(a.weather)&&m.form==='soup') form=Math.min(1,form+.25);
  if(a.weather==='hot'&&m.form==='cold') form=Math.min(1,form+.25);
  const adventure=1-Math.abs(m.adventure-a.adventure)/2;
  const company=a.company==='guest'?(m.taste==='spicy'?.2:1):a.company==='alone'?(m.name==='피자'||m.name==='보쌈'?.3:1):a.company==='coworker'?(m.adventure===2?.4:1):1;
  const setting=environment==='quick'?(m.form==='rice'||m.name==='김밥'||m.name==='샌드위치'?1:.3):environment==='delivery'?(m.form==='cold'||m.name==='라멘'?.4:1):1;
  const score=Math.round(30*taste+20*mood+20*hunger+15*form+15*(adventure*.4+company*.4+setting*.2));
  const reasons=[];
  if(taste>=.8) reasons.push(`${{spicy:'매콤한',mild:'담백한',savory:'감칠맛 가득한',fresh:'산뜻하고 신선한',meat:'고기 풍미 가득한'}[a.taste]} 맛이 오늘의 입맛과 잘 맞아요.`);
  if(mood===1) reasons.push(`${{comfort:'포근한 한 끼로 잠깐 쉬어가고 싶은',release:'맛있는 한 끼로 기분을 풀고 싶은',refresh:'산뜻하게 기분 전환하고 싶은',special:'평범한 하루에 작은 선물을 주고 싶은'}[a.mood]} 마음을 담았어요.`);
  if(hunger===1) reasons.push(`${['가볍게 먹고 싶은','적당히 채우고 싶은','든든히 먹고 싶은'][a.hunger]} 오늘의 배고픔을 고려했어요.`);
  if(form>=.8) reasons.push('원하는 음식 형태와 오늘 날씨를 함께 고려했어요.');
  if(!reasons.length) reasons.push('취향과 식사 상황, 예산대를 종합해 골랐어요.');
  return {...m,score,reasons:reasons.slice(0,2)};
 }).sort((x,y)=>y.score-x.score||x.id-y.id).slice(0,3);
}
export function persona(a) {
 return {comfort:{emoji:'🧸',name:'포근한 충전형',title:'오늘은 나를 토닥여주는 한 끼',text:'쉴 틈 없이 달려온 당신. 점심만큼은 마음까지 따뜻하게 채워봐요. 잘 먹는 것도 나를 돌보는 방법이니까요.',tags:['따뜻한 위로','충전이 필요해','나를 위한 한 끼']},release:{emoji:'🔥',name:'스트레스 타파형',title:'답답한 마음, 맛있게 날려버려!',text:'오늘은 기분 전환이 필요한 날! 맛있는 한 입으로 잠깐 환기하고, 가벼운 마음으로 오후를 시작해요.',tags:['기분 전환','에너지 충전','오늘도 수고했어']},refresh:{emoji:'🌱',name:'산뜻한 리프레시형',title:'한 입 먹고, 새로운 기분으로',text:'늘 비슷한 하루에도 작은 변화는 필요하죠. 싱그러운 한 끼와 함께 당신의 오후를 새로고침해봐요.',tags:['산뜻한 오후','작은 변화','새로고침']},special:{emoji:'✨',name:'소소한 행복 수집형',title:'오늘의 작은 행복은 점심에 있어',text:'평범한 하루를 특별하게 만드는 데 거창한 이유는 필요 없어요. 나를 위한 맛있는 선물, 오늘 받아도 좋아요.',tags:['나에게 주는 선물','작은 사치','행복 수집']}}[a.mood];
}
