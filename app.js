const tg=window.Telegram?.WebApp;
if(tg){tg.ready();tg.expand()}
const params=new URLSearchParams(location.search);
const targetId=params.get("chat_id")||"";
const targetTitle=params.get("chat_title")||("Чат "+(targetId||"не выбран"));
const user=tg?.initDataUnsafe?.user;
const state=JSON.parse(localStorage.getItem("chatkeeper_settings")||"{}");
["antispam","antilink","antiflood","welcome"].forEach(k=>{if(params.has(k))state[k]=params.get(k)==="1"});
const reportCount=Number(params.get("reports")||0);
const chats=targetId?[{id:targetId,title:targetTitle,type:"group"}]:[];
const badge=document.getElementById("reportBadge");if(badge)badge.textContent=String(reportCount);
const pages={chats:"Мои чаты",settings:"Настройки чата",posting:"Постинг",reports:"Жалобы"};
const $=s=>document.querySelector(s);
function send(data){
 if(tg?.sendData){tg.sendData(JSON.stringify(data));return true}
 if(tg?.showAlert)tg.showAlert("Это действие требует открытия Mini App через кнопку ChatKeeperBot.");
 return false
}
function go(page){
 document.querySelectorAll(".page").forEach(x=>x.classList.remove("active"));
 const p=$("#page-"+page);if(p)p.classList.add("active");
 document.querySelectorAll(".nav").forEach(x=>x.classList.toggle("active",x.dataset.page===page));
 $("#pageTitle").textContent=pages[page]||page;
 if(page==="settings")renderSettings();
 if(page==="posting")renderPosting();
}
function renderChats(){
 const list=$("#chatList");list.innerHTML="";
 $("#emptyChats").style.display=chats.length?"none":"block";
 chats.forEach(chat=>{
  const el=document.createElement("div");el.className="chat-card";
  el.innerHTML='<div class="chat-info"><div class="chat-avatar">▣</div><div><h3></h3><p></p></div></div><span class="open-arrow">›</span>';
  el.querySelector("h3").textContent=chat.title;
  el.querySelector("p").textContent=chat.type+" · ID "+chat.id;
  el.onclick=()=>go("settings");
  list.appendChild(el);
 });
}
function renderSettings(){
 if(!targetId){$("#settingsTitle").textContent="Настройки";$("#settingsSub").textContent="Сначала выберите чат";$("#settingsContent").innerHTML='<div class="panel empty-small"><div class="empty-icon">⚙</div><h3>Чат не выбран</h3><p>Откройте Mini App из настроек конкретного чата.</p></div>';return}
 $("#settingsTitle").textContent=targetTitle;
 $("#settingsSub").textContent="Защита и модерация";
 const fields=[
  ["antispam","Антиспам","Защита от повторяющегося спама"],
  ["antilink","Антиссылки","Удаление нежелательных ссылок"],
  ["antiflood","Антифлуд","Контроль частых сообщений"],
  ["welcome","Приветствие","Сообщения для новых участников"]
 ];
 const box=$("#settingsContent");box.innerHTML="";
 fields.forEach(([key,title,desc])=>{
  const row=document.createElement("div");row.className="setting-row";
  row.innerHTML='<div><b></b><small></small></div><label class="switch"><input type="checkbox"><span class="slider"></span></label>';
  row.querySelector("b").textContent=title;row.querySelector("small").textContent=desc;
  const input=row.querySelector("input");input.checked=!!state[key];
  input.onchange=()=>{state[key]=input.checked;localStorage.setItem("chatkeeper_settings",JSON.stringify(state));send({type:"setting",chat_id:targetId,name:key,value:input.checked})};
  box.appendChild(row);
 });
}
function renderPosting(){
 const select=$("#postChat");select.innerHTML="";
 chats.forEach(c=>{const o=document.createElement("option");o.value=c.id;o.textContent=c.title;select.appendChild(o)});
 if(!chats.length)select.innerHTML='<option value="">Нет выбранного чата</option>';
}
document.querySelectorAll("[data-page]").forEach(b=>b.onclick=()=>go(b.dataset.page));
$("#refreshBtn").onclick=()=>{renderChats();renderSettings();tg?.HapticFeedback?.impactOccurred?.("light")};
$("#openSettings").onclick=()=>{if(tg?.openTelegramLink)tg.openTelegramLink("https://t.me/ChatKeeperBot?start=settings");else if(tg?.showAlert)tg.showAlert("Откройте @ChatKeeperBot и используйте /settings")};
$("#publishBtn").onclick=()=>{
 const chat=$("#postChat").value,text=$("#postText").value.trim();
 if(!chat||!text){tg?.showAlert?.("Выберите чат и введите текст.");return}
 if(send({type:"post",chat_id:chat,text}))$("#postText").value="";
};
$("#themeBtn").onclick=()=>{document.body.classList.toggle("light");localStorage.setItem("chatkeeper_theme",document.body.classList.contains("light")?"light":"dark")};
if(localStorage.getItem("chatkeeper_theme")==="light")document.body.classList.add("light");
if(user)document.title="ChatKeeper · "+(user.first_name||"");
renderChats();renderSettings();renderPosting();