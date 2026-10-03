const tg=window.Telegram?.WebApp;
if(tg){tg.ready();tg.expand();tg.setHeaderColor?.("#090c11");tg.setBackgroundColor?.("#090c11")}
const $=s=>document.querySelector(s);
let chats=[],selectedId="",search="",settings={};

const commandGroups=[
 {title:"Основные",items:[
  ["/start","Запуск бота"],
  ["/help","Список команд и помощь"],
  ["/app","Открыть Mini App"],
  ["/settings","Настройки чата"],
  ["/rules","Правила чата"],
  ["/chatinfo","Информация о чате"]
 ]},
 {title:"Защита",items:[
  ["/antilink","Антиссылки"],
  ["/antiflood","Антифлуд"],
  ["/antispam","Антиспам"],
  ["/warnlimit число","Лимит предупреждений"],
  ["/mutetime число","Время мута"]
 ]},
 {title:"Приветствие",items:[
  ["/setwelcome текст","Установить приветствие"],
  ["/welcome","Показать настройки"],
  ["/welcome on","Включить приветствие"],
  ["/welcome off","Выключить приветствие"],
  ["/welcome delete","Удалить приветствие"]
 ]},
 {title:"Модерация",items:[
  ["/report","Пожаловаться на сообщение"],
  ["/ban ID или @username","Заблокировать"],
  ["/unban ID или @username","Разблокировать"],
  ["/kick ID или @username","Удалить участника"],
  ["/mute ID или @username","Замутить"],
  ["/unmute ID или @username","Снять мут"],
  ["/warn ID или @username","Выдать предупреждение"],
  ["/unwarn ID или @username","Снять предупреждение"],
  ["/warnings ID или @username","Посмотреть предупреждения"],
  ["/del","Удалить сообщение"]
 ]},
 {title:"Модераторы",items:[
  ["/moderators","Список модераторов"],
  ["/promote ID или @username","Назначить модератором"],
  ["/demote ID или @username","Снять с модераторов"],
  ["/unmuteall","Снять все муты"],
  ["/unbanall","Снять все блокировки"]
 ]},
 {title:"Администратор",items:[
  ["/broadcast текст","Рассылка пользователям бота"],
  ["/stars","Статистика Stars"]
 ]}
];

function params(){
 const q=new URLSearchParams(location.search);
 const h=new URLSearchParams(location.hash.replace(/^#/,""));
 const raw=h.get("chats")||q.get("chats")||"";
 selectedId=String(h.get("chat_id")||q.get("chat_id")||"");
 try{chats=raw?JSON.parse(raw):[]}catch{chats=[]}
 if(!Array.isArray(chats))chats=[];
 chats=chats.map(c=>({...c,id:String(c.id)}));
}
function chat(id){return chats.find(c=>String(c.id)===String(id))}
function icon(type){return type==="channel"?"▰":type==="supergroup"?"◆":"▣"}
function setSync(text){$("#syncState").textContent=text}
function send(data){
 if(!tg?.sendData){tg?.showAlert?.("Откройте Mini App через ChatKeeperBot.");return false}
 tg.sendData(JSON.stringify(data));return true
}
function selectChat(id,open=false){
 const c=chat(id);if(!c)return;
 selectedId=String(c.id);
 settings={antispam:!!c.antispam,antilink:!!c.antilink,antiflood:!!c.antiflood,welcome:!!c.welcome};
 render();
 if(open)go("settings");
}
function go(page){
 document.querySelectorAll(".page").forEach(p=>p.classList.toggle("active",p.id==="page-"+page));
 document.querySelectorAll(".bottom-nav button").forEach(b=>b.classList.toggle("active",b.dataset.page===page));
 if(page==="settings")renderSettings();
 if(page==="posting")renderPosting();
 if(page==="reports")renderReports();
 if(page==="commands")renderCommands();
}
function render(){renderChats();renderSettings();renderPosting();renderReports();renderCommands()}
function renderChats(){
 const list=$("#chatList"),empty=$("#emptyChats"),term=search.toLowerCase();
 const visible=chats.filter(c=>((c.title||"")+" "+(c.username||"")).toLowerCase().includes(term));
 $("#chatCount").textContent=String(chats.length);list.innerHTML="";$("#clearSearch").hidden=!search;
 if(!visible.length){
  empty.hidden=false;
  $("#emptyTitle").textContent=chats.length?"Ничего не найдено":"Чаты не переданы";
  $("#emptyText").textContent=chats.length?"Попробуй другое название.":"Перезапусти Mini App через ChatKeeperBot. Бот передаёт сюда только чаты, где ты являешься администратором.";
  return;
 }
 empty.hidden=true;
 visible.forEach(c=>{
  const el=document.createElement("article");el.className="chat-card"+(String(c.id)===selectedId?" selected":"");
  el.innerHTML='<div class="chat-avatar"></div><div class="chat-main"><strong></strong><small></small></div><span class="arrow">›</span>';
  el.querySelector(".chat-avatar").textContent=icon(c.type);
  el.querySelector("strong").textContent=c.title||("Чат "+c.id);
  el.querySelector("small").textContent=(c.type||"group")+" · ID "+c.id;
  el.onclick=()=>selectChat(c.id,true);list.appendChild(el);
 });
}
function renderSettings(){
 const c=chat(selectedId),box=$("#settingsContent"),head=$("#selectedChat");
 if(!c){head.innerHTML='<div class="chat-avatar">▣</div><div><strong>Чат не выбран</strong><small>Выбери чат в разделе «Чаты»</small></div>';box.innerHTML="";return}
 head.innerHTML='<div class="chat-avatar">'+icon(c.type)+'</div><div><strong></strong><small></small></div>';
 head.querySelector("strong").textContent=c.title||("Чат "+c.id);
 head.querySelector("small").textContent=(c.type||"group")+" · ID "+c.id;
 const items=[["antispam","Антиспам","Защита от спама"],["antilink","Антиссылки","Контроль ссылок"],["antiflood","Антифлуд","Ограничение частых сообщений"],["welcome","Приветствие","Сообщение новым участникам"]];
 box.innerHTML="";
 items.forEach(([key,title,desc])=>{
  const row=document.createElement("div");row.className="setting";
  row.innerHTML='<div><strong></strong><small></small></div><label class="switch"><input type="checkbox"><span class="slider"></span></label>';
  row.querySelector("strong").textContent=title;row.querySelector("small").textContent=desc;
  const input=row.querySelector("input");input.checked=!!settings[key];
  input.onchange=()=>{const value=input.checked;settings[key]=value;c[key]=value?1:0;if(!send({type:"setting",chat_id:c.id,name:key,value})){input.checked=!value;settings[key]=!value;c[key]=value?1:0}};
  box.appendChild(row);
 });
}
function renderPosting(){
 const s=$("#postChat");s.innerHTML="";
 chats.forEach(c=>{const o=document.createElement("option");o.value=c.id;o.textContent=c.title||("Чат "+c.id);if(c.id===selectedId)o.selected=true;s.appendChild(o)});
 if(!chats.length)s.innerHTML='<option value="">Нет доступных чатов</option>';
}
function renderReports(){
 const c=chat(selectedId),n=c?Number(c.reports||0):0;
 $("#reportBadge").textContent=String(n);$("#reportLarge").textContent=String(n);
}
function renderCommands(){
 const box=$("#commandList");if(!box)return;
 box.innerHTML="";
 commandGroups.forEach(group=>{
  const section=document.createElement("div");section.className="command-group";
  const title=document.createElement("h3");title.textContent=group.title;section.appendChild(title);
  group.items.forEach(([cmd,desc])=>{
   const row=document.createElement("div");row.className="command";
   row.innerHTML="<code></code><span></span>";
   row.querySelector("code").textContent=cmd;row.querySelector("span").textContent=desc;
   section.appendChild(row);
  });
  box.appendChild(section);
 });
}
document.querySelectorAll("[data-page]").forEach(b=>b.addEventListener("click",()=>{
 const p=b.dataset.page;
 if(p==="settings"&&!selectedId&&chats.length)selectChat(chats[0].id);
 go(p);
}));
$("#chatSearch").addEventListener("input",e=>{search=e.target.value.trim();renderChats()});
$("#clearSearch").onclick=()=>{$("#chatSearch").value="";search="";renderChats()};
$("#refreshBtn").onclick=()=>{params();if(!selectedId&&chats.length)selectedId=chats[0].id;render();setSync("● Обновлено");tg?.HapticFeedback?.impactOccurred?.("light");setTimeout(()=>setSync("● Онлайн"),1200)};
$("#openBot").onclick=()=>{if(tg?.openTelegramLink)tg.openTelegramLink("https://t.me/ChatKeeperBot");else location.href="https://t.me/ChatKeeperBot")};
$("#publishBtn").onclick=()=>{
 const chatId=$("#postChat").value,text=$("#postText").value.trim();
 if(!chatId||!text){tg?.showAlert?.("Выбери чат и введи текст.");return}
 if(send({type:"post",chat_id:chatId,text}))$("#postText").value="";
};
params();
if(!selectedId&&chats.length)selectedId=chats[0].id;
if(chats.length)selectChat(selectedId);else render();