const tg=window.Telegram?.WebApp;
if(tg){tg.ready();tg.expand()}
const params=new URLSearchParams(location.search);
const user=tg?.initDataUnsafe?.user;
let chats=[];
let targetId=params.get("chat_id")||"";
let targetTitle="";
let state={};
let search="";
try{
 const raw=params.get("chats");
 if(raw)chats=JSON.parse(raw);
}catch(e){chats=[]}
const $=s=>document.querySelector(s);

function getChat(id){return chats.find(c=>String(c.id)===String(id))||null}

function selectChat(id){
 const chat=getChat(id);
 if(!chat)return;
 targetId=String(chat.id);
 targetTitle=chat.title||("Чат "+targetId);
 state={
  antispam:!!chat.antispam,
  antilink:!!chat.antilink,
  antiflood:!!chat.antiflood,
  welcome:!!chat.welcome
 };
 renderChats();
 renderSettings();
 renderPosting();
 renderReports();
}

function send(data){
 if(tg?.sendData){tg.sendData(JSON.stringify(data));return true}
 tg?.showAlert?.("Откройте Mini App через кнопку ChatKeeperBot.");
 return false;
}

function go(page){
 document.querySelectorAll(".page").forEach(x=>x.classList.remove("active"));
 const p=$("#page-"+page);
 if(p)p.classList.add("active");
 document.querySelectorAll(".nav button").forEach(x=>x.classList.toggle("active",x.dataset.page===page));
 if(page==="settings")renderSettings();
 if(page==="posting")renderPosting();
 if(page==="reports")renderReports();
}

function renderChats(){
 const list=$("#chatList");
 const empty=$("#emptyChats");
 const count=$("#chatCount");
 list.innerHTML="";
 const visible=chats.filter(c=>(c.title||"").toLowerCase().includes(search.toLowerCase()));
 if(count)count.textContent=String(chats.length);
 empty.style.display=visible.length?"none":"block";
 visible.forEach(chat=>{
  const el=document.createElement("div");
  el.className="chat-card"+(String(chat.id)===String(targetId)?" selected":"");
  el.innerHTML='<div class="chat-info"><div class="chat-avatar">▣</div><div><h3></h3><p></p></div></div><span class="arrow">›</span>';
  el.querySelector("h3").textContent=chat.title||("Чат "+chat.id);
  el.querySelector("p").textContent=(chat.type||"group")+" · ID "+chat.id;
  el.onclick=()=>{selectChat(chat.id);go("settings")};
  list.appendChild(el);
 });
}

function renderSettings(){
 const box=$("#settingsContent");
 if(!targetId){
  $("#settingsTitle").textContent="Настройки";
  $("#settingsSub").textContent="Сначала выберите чат";
  $("#settingsChatName").textContent="Чат не выбран";
  $("#settingsChatId").textContent="";
  box.innerHTML='<div class="empty-card"><h2>Выберите чат</h2><p>Откройте раздел «Мои чаты» и выберите нужный чат.</p></div>';
  return;
 }
 $("#settingsTitle").textContent=targetTitle;
 $("#settingsSub").textContent="Защита и модерация";
 $("#settingsChatName").textContent=targetTitle;
 $("#settingsChatId").textContent="ID "+targetId;
 box.innerHTML="";
 [
  ["antispam","Антиспам","Защита от повторяющегося спама"],
  ["antilink","Антиссылки","Контроль ссылок в сообщениях"],
  ["antiflood","Антифлуд","Ограничение слишком частых сообщений"],
  ["welcome","Приветствие","Автоматическое приветствие новых участников"]
 ].forEach(([key,title,desc])=>{
  const row=document.createElement("div");
  row.className="setting-row";
  row.innerHTML='<div><b></b><small></small></div><label class="switch"><input type="checkbox"><span class="slider"></span></label>';
  row.querySelector("b").textContent=title;
  row.querySelector("small").textContent=desc;
  const input=row.querySelector("input");
  input.checked=!!state[key];
  input.onchange=()=>{
   const old=input.checked;
   state[key]=old;
   const chat=getChat(targetId);
   if(chat)chat[key]=old?1:0;
   const ok=send({type:"setting",chat_id:targetId,name:key,value:old});
   if(!ok){input.checked=!old;state[key]=!old}
  };
  box.appendChild(row);
 });
}

function renderPosting(){
 const select=$("#postChat");
 select.innerHTML="";
 chats.forEach(c=>{
  const o=document.createElement("option");
  o.value=c.id;
  o.textContent=c.title||("Чат "+c.id);
  if(String(c.id)===String(targetId))o.selected=true;
  select.appendChild(o);
 });
 if(!chats.length)select.innerHTML='<option value="">Нет доступных чатов</option>';
}

function renderReports(){
 const chat=getChat(targetId);
 const count=chat?Number(chat.reports||0):0;
 $("#reportBadge").textContent=String(count);
 $("#reportBadgeLarge").textContent=String(count);
}

document.querySelectorAll(".nav button,.back").forEach(b=>b.onclick=()=>{
 const page=b.dataset.page;
 if(page==="settings"&&!targetId&&chats.length)selectChat(chats[0].id);
 go(page);
});

$("#chatSearch").oninput=e=>{search=e.target.value.trim();renderChats()};

$("#refreshBtn").onclick=()=>{
 const fresh=new URLSearchParams(location.search);
 try{chats=JSON.parse(fresh.get("chats")||"[]")}catch(e){}
 renderChats();renderSettings();renderPosting();renderReports();
 tg?.HapticFeedback?.impactOccurred?.("light");
};

$("#openSettings").onclick=()=>{
 if(tg?.openTelegramLink)tg.openTelegramLink("https://t.me/ChatKeeperBot");
 else tg?.showAlert?.("Откройте @ChatKeeperBot и запустите Mini App снова.");
};

$("#publishBtn").onclick=()=>{
 const chat=$("#postChat").value;
 const text=$("#postText").value.trim();
 if(!chat||!text){tg?.showAlert?.("Выберите чат и введите текст.");return}
 if(send({type:"post",chat_id:chat,text}))$("#postText").value="";
};

if(user)document.title="ChatKeeper · "+(user.first_name||"");
if(targetId&&getChat(targetId))selectChat(targetId);
else if(chats.length)selectChat(chats[0].id);
else{renderChats();renderSettings();renderPosting();renderReports()}
