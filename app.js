const tg=window.Telegram?.WebApp;
if(tg){tg.ready();tg.expand()}
const user=tg?.initDataUnsafe?.user;
const chat=tg?.initDataUnsafe?.chat;
const params=new URLSearchParams(location.search);
const targetChatId=params.get('chat_id')||chat?.id||'';
document.getElementById('user').textContent=user?([user.first_name,user.last_name].filter(Boolean).join(' ')||('@'+user.username)):'Открыто в браузере';
document.getElementById('chat').textContent=targetChatId||'Не выбран';
if(user)document.getElementById('hello').textContent='Привет, '+user.first_name+'!';
const state=JSON.parse(localStorage.getItem('chatkeeper_settings')||'{}');
['antilink','antiflood','antispam'].forEach(k=>{
 const e=document.getElementById(k);
 e.checked=!!state[k];
 e.addEventListener('change',()=>{
  state[k]=e.checked;
  localStorage.setItem('chatkeeper_settings',JSON.stringify(state));
  send({type:'setting',chat_id:targetChatId,name:k,value:e.checked});
 });
});
function send(data){
 if(!targetChatId){
  tg?.showAlert?.('Сначала открой Mini App из настроек конкретного чата.');
  return;
 }
 if(tg?.sendData)tg.sendData(JSON.stringify(data));
 else tg?.showAlert?.('Открой Mini App внутри Telegram.');
}
document.querySelectorAll('[data-action]').forEach(b=>b.onclick=()=>{
 const action=b.dataset.action;
 send({type:'action',chat_id:targetChatId,action});
});
