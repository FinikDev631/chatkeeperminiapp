const tg=window.Telegram?.WebApp;
if(tg){tg.ready();tg.expand()}
const params=new URLSearchParams(location.search);
const user=tg?.initDataUnsafe?.user;

let chats=[];
try{
 const raw=params.get("chats");
 if(raw)chats=JSON.parse(raw);
}catch(e){chats=[]}

const selectedId=params.get("chat_id")||"";
let targetId=selectedId||"";
let targetTitle="";
let state={};
const pages={chats:"Мои чаты",settings:"Настройки чата",posting:"Постинг",reports:"Жалобы"};
const $=s=>document.querySelector(s);

function getChat(id){
 return chats.find(c=>String(c.id)===String(id))||null;
}

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
 if(tg?.showAlert)tg.showAlert("Это действие требует открытия Mini App через кнопку ChatKeeperBot.");
 return false;
}

function go(page){
 document.querySelectorAll(".page").forEach(x=>x.classList.remove("active"));
 const p=$("#page-"+page);if(p)p.classList.add("active");
 document.querySelectorAll(".nav").forEach(x=>x.classList.toggle("active",x.dataset.page===page));
 if(page==="settings")renderSettings();
 if(page==="posting")renderPosting();
 if(page==="reports")renderReports();
}

function renderChats(){
 const list=$("#chatList");
 list.innerHTML="";
 $("#emptyChats").style.display=chats.length?"none":"block";

 chats.forEach(chat=>{
  const el=document.createElement("div");
  el.className="chat-card"+(String(chat.id)===String(targetId)?" selected":"");
  el.innerHTML='<div class="chat-info"><div class="chat-avatar">▣</div><div><h3></h3><p></p></div></div><span class="open-arrow">›</span>';
  el.querySelector("h3").textContent=chat.title||("Чат "+chat.id);
  el.querySelector("p").textContent=(chat.type||"group")+" · ID "+chat.id;
  el.onclick=()=>{selectChat(chat.id);go("settings")};
  list.appendChild(el);
 });
}

function renderSettings(){
 if(!targetId){
  $("#settingsTitle").textContent="Настройки";
  $("#settingsSub").textContent="Сначала выберите чат";
  $("#settingsContent").innerHTML='<div class="panel empty-small"><div class="empty-icon">⚙</div><h3>Чат не выбран</h3><p>Выберите чат в разделе «Мои чаты».</p></div>';
  return;
 }

 $("#settingsTitle").textContent=targetTitle;
 $("#settingsSub").textContent="Защита и модерация";

 const fields=[
  ["antispam","Антиспам","Защита от повторяющегося спама"],
  ["antilink","Антиссылки","Удаление нежелательных ссылок"],
  ["antiflood","Антифлуд","Контроль частых сообщений"],
  ["welcome","Приветствие","Сообщения для новых участников"]
 ];

 const box=$("#settingsContent");
 box.innerHTML="";

 fields.forEach(([key,title,desc])=>{
  const row=document.createElement("div");
  row.className="setting-row";
  row.innerHTML='<div><b></b><small></small></div><label class="switch"><input type="checkbox"><span class="slider"></span></label>';
  row.querySelector("b").textContent=title;
  row.querySelector("small").textContent=desc;

  const input=row.querySelector("input");
  input.checked=!!state[key];

  input.onchange=()=>{
   state[key]=input.checked;
   const chat=getChat(targetId);
   if(chat)chat[key]=input.checked?1:0;
   const ok=send({
    type:"setting",
    chat_id:targetId,
    name:key,
    value:input.checked
   });
   if(!ok)input.checked=!input.checked;
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
 const badge=$("#reportBadge");
 const large=$("#reportBadgeLarge");
 const text=$("#reportText");

 if(badge)badge.textContent=String(count);
 if(large)large.textContent=String(count);
 if(text)text.textContent="Сейчас: "+count;
}

document.querySelectorAll("[data-page]").forEach(b=>b.onclick=()=>{
 if(b.dataset.page==="settings"&&!targetId&&chats.length)selectChat(chats[0].id);
 go(b.dataset.page);
});

$("#refreshBtn").onclick=()=>{
 renderChats();
 renderSettings();
 renderPosting();
 renderReports();
 tg?.HapticFeedback?.impactOccurred?.("light");
};

$("#openSettings").onclick=()=>{
 if(chats.length){
  selectChat(chats[0].id);
  go("settings");
  return;
 }
 if(tg?.openTelegramLink)tg.openTelegramLink("https://t.me/ChatKeeperBot?start=settings");
 else if(tg?.showAlert)tg.showAlert("Откройте @ChatKeeperBot и используйте /settings");
};

$("#publishBtn").onclick=()=>{
 const chat=$("#postChat").value;
 const text=$("#postText").value.trim();

 if(!chat||!text){
  tg?.showAlert?.("Выберите чат и введите текст.");
  return;
 }

 if(send({type:"post",chat_id:chat,text}))$("#postText").value="";
};

const theme=localStorage.getItem("chatkeeper_theme");
if(theme==="light")document.body.classList.add("light");

if(user)document.title="ChatKeeper · "+(user.first_name||"");

if(selectedId&&getChat(selectedId))selectChat(selectedId);
else if(chats.length)selectChat(chats[0].id);
else{
 renderChats();
 renderSettings();
 renderPosting();
 renderReports();
}
