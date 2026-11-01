const DB_NAME="reality-card-db", STORE="cards";
let db, selectedType="monster", sourceData="", artworkData="", draft=null, activeCardId=null, currentFilter="all";
const $=id=>document.getElementById(id);
const typeInfo={
 monster:{label:"怪獸卡",icon:"🐉",hint:"生物、動物、昆蟲、人物等。可依照片內容自行選擇。",attrs:["光","暗","火","水","風","地"],races:["龍族","獸族","鳥獸族","昆蟲族","植物族","戰士族","魔法師族","不死族"],names:["終焉之翼","混沌霸主","煌炎聖獸","深淵吞噬者","星界守護者","幻影魔皇","永劫巨獸","天穹裁決者"],effects:["此卡召喚成功時，釋放沉睡於體內的遠古力量。","當此卡現身於戰場，周圍的時空將受到其力量扭曲。","此卡承受致命傷害時，可覺醒真正姿態一次。","每當夜幕降臨，此卡的力量便會持續增幅。"]},
 spell:{label:"魔法卡",icon:"✨",names:["蒼穹禁咒","森羅萬象之息","永恆星火","天災輪迴","世界樹的低語","終焉天象","元素起源","月蝕聖域"],effects:["選擇一個目標，使其獲得來自自然元素的祝福。","喚醒沉睡的大地力量，改變整個場域的氣息。","當此卡發動時，釋放足以改寫命運的元素洪流。","以自然法則為代價，換取一次奇蹟般的力量。"]},
 trap:{label:"陷阱卡",icon:"🕸",names:["命運逆轉機關","深淵封鎖陣","終焉齒輪","禁忌反制裝置","虛空牢籠","機巧審判","破滅連鎖","幻惑機關"],effects:["當對方採取行動時發動，使其計畫陷入停滯。","在危機降臨的一瞬間啟動，將攻勢反轉。","此卡設下的禁制一旦觸發，便難以逃脫。","將入侵者封鎖於無法逃離的異次元機關之中。"]}
};
const rarities=[["N","普通",55],["R","稀有",25],["SR","超稀有",12],["UR","極稀有",6],["SSR","幻想稀有",1.8],["LR","傳說稀有",0.2]];
function rand(a){return a[Math.floor(Math.random()*a.length)]}
function rarityRoll(){let n=Math.random()*100,s=0;for(const r of rarities){s+=r[2];if(n<s)return r[0]}return "N"}
function openDB(){return new Promise((resolve,reject)=>{const req=indexedDB.open(DB_NAME,1);req.onupgradeneeded=()=>req.result.createObjectStore(STORE,{keyPath:"id"});req.onsuccess=()=>{db=req.result;resolve(db)};req.onerror=()=>reject(req.error)})}
function tx(mode="readonly"){return db.transaction(STORE,mode).objectStore(STORE)}
function allCards(){return new Promise((res,rej)=>{const r=tx().getAll();r.onsuccess=()=>res(r.result.sort((a,b)=>b.createdAt-a.createdAt));r.onerror=()=>rej(r.error)})}
function putCard(card){return new Promise((res,rej)=>{const r=tx("readwrite").put(card);r.onsuccess=()=>res();r.onerror=()=>rej(r.error)})}
function deleteById(id){return new Promise((res,rej)=>{const r=tx("readwrite").delete(id);r.onsuccess=()=>res();r.onerror=()=>rej(r.error)})}
function toast(msg){$("toast").textContent=msg;$("toast").style.display="block";setTimeout(()=>$("toast").style.display="none",2300)}
function nav(view){document.querySelectorAll(".view").forEach(v=>v.classList.toggle("active",v.id===view));document.querySelectorAll(".navbtn").forEach(b=>b.classList.toggle("active",b.dataset.view===view));if(view==="collectionView")renderCollection();if(view==="encyclopediaView")renderEncyclopedia();window.scrollTo(0,0)}
document.querySelectorAll(".navbtn").forEach(b=>b.onclick=()=>nav(b.dataset.view));
$("startCreate").onclick=()=>nav("createView");
document.querySelectorAll(".typechoice").forEach(b=>b.onclick=()=>{selectedType=b.dataset.type;document.querySelectorAll(".typechoice").forEach(x=>x.classList.toggle("selected",x===b));$("typeHint").textContent=typeInfo[selectedType].hint});
$("sourcePhoto").onchange=async e=>{const f=e.target.files[0];if(!f)return;sourceData=await fileToData(f);$("sourcePreview").src=sourceData;$("sourcePreview").classList.remove("hidden");if(!$("subjectName").value)$("subjectName").value=f.name.replace(/\.[^.]+$/,"").replace(/[_-]/g," ")};
function fileToData(file){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(file)})}
function makeDraft(){
 const t=typeInfo[selectedType],subject=$("subjectName").value.trim()||"未知之物",style=$("styleHint").value.trim();
 const rarity=rarityRoll(),prefix=rand(t.names),suffix=rand(["・天命覺醒","・永夜裁決","・混沌核心","・星界降臨","・無盡輪迴","・終末形態"]);
 const name=prefix+suffix;
 const level=selectedType==="monster"?Math.floor(Math.random()*8)+5:0;
 const attr=selectedType==="monster"?rand(t.attrs):"",race=selectedType==="monster"?rand(t.races):"";
 const atk=selectedType==="monster"?Math.floor((900+Math.random()*2300)/100)*100:0,def=selectedType==="monster"?Math.floor((800+Math.random()*2200)/100)*100:0;
 const effect=rand(t.effects)+"\n\n此卡的力量源自「"+subject+"」，其真正姿態尚未完全解放。";
 const lore="傳說中，"+subject+"並非凡間尋常之物。當"+(style||"命運的齒輪")+"開始轉動，"+name+"便會從沉眠中甦醒，向世界展現被封印的力量。";
 const stars=selectedType==="monster"?"★".repeat(level):"";
 const prompt=`Create a premium Japanese fantasy trading-card illustration inspired by this real-world subject: ${subject}. ${style?`Visual theme: ${style}.`:""} Reimagine the subject as ${selectedType==="monster"?"an epic fantasy monster or creature":selectedType==="spell"?"a spectacular natural elemental magic phenomenon":"an ominous ancient mechanical trap or cursed artifact"}. Highly detailed anime fantasy concept art, dramatic cinematic lighting, rich atmospheric background, intricate textures, dynamic composition, polished collectible card game artwork. The main subject must be prominent and recognizable from the source photo. Artwork only, portrait composition, NO text, NO letters, NO numbers, NO logos, NO card frame, NO watermark.`;
 return {id:crypto.randomUUID(),createdAt:Date.now(),subject,sourceImage:sourceData,type:selectedType,rarity,rarityName:rarities.find(x=>x[0]===rarity)[1],name,level,attribute:attr,race,atk,def,effect,lore,prompt,artwork:"",favorite:false};
}
$("generateCard").onclick=()=>{if(!sourceData){toast("請先上傳照片");return}draft=makeDraft();artworkData="";$("resultPanel").classList.remove("hidden");$("editName").value=draft.name;$("editEffect").value=draft.effect;$("editLore").value=draft.lore;$("imagePrompt").value=draft.prompt;$("rarityResult").textContent=draft.rarity+" · "+draft.rarityName;renderCard(draft,"resultCardStage");$("resultPanel").scrollIntoView({behavior:"smooth",block:"start"})};
function renderCard(c,target){
 const rarity=c.rarity||"N",type=typeInfo[c.type],monster=c.type==="monster";
 const stage=$(target);stage.innerHTML="";
 const wrap=document.createElement("div");wrap.className="cardstage rarity-"+rarity;
 const card=document.createElement("div");card.className="tradingcard";
 const inner=document.createElement("div");inner.className="cardinner";
 const title=document.createElement("div");title.className="cardname";title.textContent=c.name;
 const meta=document.createElement("div");meta.className="cardmeta";meta.textContent=c.type==="monster"?"✦ "+c.attribute+" / "+c.race:type.label;
 const art=document.createElement("div");art.className="artframe";
 if(c.artwork){const img=document.createElement("img");img.src=c.artwork;img.alt="卡片插畫";art.appendChild(img)}else{const ph=document.createElement("div");ph.className="artplaceholder";ph.textContent=type.icon;art.appendChild(ph)}
 const stars=document.createElement("div");stars.className="stars";stars.textContent=monster?"★".repeat(c.level):"";
 const ctype=document.createElement("div");ctype.className="cardtype";ctype.textContent=monster?`【${c.race}／效果】`:`【${type.label}】`;
 const desc=document.createElement("div");desc.className="carddesc";desc.textContent=c.effect;
 const stats=document.createElement("div");stats.className="cardstats";stats.textContent=monster?`ATK/${c.atk}　DEF/${c.def}`:`REALITY CARD · ${c.rarity}`;
 const tag=document.createElement("div");tag.className="raritytag";tag.textContent=c.rarity+" · "+c.rarityName;
 inner.append(title,meta,art,stars,ctype,desc,stats);card.append(inner,tag);wrap.append(card);stage.append(wrap);
}
$("copyPrompt").onclick=async()=>{try{await navigator.clipboard.writeText($("imagePrompt").value);toast("插畫提示詞已複製")}catch(e){$("imagePrompt").select();toast("請長按複製提示詞")}};
$("importArtBtn").onclick=()=>$("artFile").click();
$("artFile").onchange=async e=>{const f=e.target.files[0];if(!f)return;artworkData=await fileToData(f);draft.artwork=artworkData;renderCard(draft,"resultCardStage");toast("AI 插畫匯入成功")};
$("saveCard").onclick=async()=>{if(!draft)return;draft.name=$("editName").value.trim()||draft.name;draft.effect=$("editEffect").value;draft.lore=$("editLore").value;draft.artwork=artworkData||draft.artwork;await putCard(draft);toast("卡片已收藏！");$("resultPanel").classList.add("hidden");draft=null;sourceData="";$("sourcePhoto").value="";$("sourcePreview").classList.add("hidden");$("subjectName").value="";$("styleHint").value="";await refreshHome();nav("collectionView")};
function tile(c){const el=document.createElement("div");el.className="cardtile";if(c.artwork){const im=document.createElement("img");im.src=c.artwork;el.appendChild(im)}else{const ph=document.createElement("div");ph.className="placeholder";ph.textContent=typeInfo[c.type].icon;el.appendChild(ph)}const b=document.createElement("strong");b.textContent=c.name;const s=document.createElement("small");s.textContent=`${c.rarity} · ${typeInfo[c.type].label}`;el.append(b,s);el.onclick=()=>showDetail(c.id);return el}
async function renderCollection(){const cards=await allCards(),q=$("searchCards").value.toLowerCase(),filtered=cards.filter(c=>(currentFilter==="all"||c.type===currentFilter||(currentFilter==="rare"&&["SR","UR","SSR","LR"].includes(c.rarity)))&&(c.name+" "+c.subject).toLowerCase().includes(q));$("collectionCount").textContent=filtered.length+" 張卡片";const g=$("collectionGrid");g.innerHTML="";if(!filtered.length){g.innerHTML='<div class="empty" style="grid-column:1/-1">✧<b>尚未找到卡片</b>開始創造你的第一張傳說吧。</div>';return}filtered.forEach(c=>g.appendChild(tile(c)))}
$("searchCards").oninput=renderCollection;
document.querySelectorAll("#filters .chip").forEach(b=>b.onclick=()=>{currentFilter=b.dataset.filter;document.querySelectorAll("#filters .chip").forEach(x=>x.classList.toggle("active",x===b));renderCollection()});
async function refreshHome(){const cards=await allCards();$("totalCount").textContent=cards.length;$("monsterCount").textContent=cards.filter(c=>c.type==="monster").length;$("rareCount").textContent=cards.filter(c=>["SR","UR","SSR","LR"].includes(c.rarity)).length;$("recentCount").textContent=cards.length?`共 ${cards.length} 張`:"尚無卡片";const g=$("recentGrid");g.innerHTML="";if(!cards.length){g.innerHTML='<div class="empty" style="grid-column:1/-1">尚無收藏，從第一張卡片開始吧。</div>';return}cards.slice(0,4).forEach(c=>g.appendChild(tile(c)))}
async function renderEncyclopedia(){const cards=await allCards();$("encyclopediaStats").innerHTML=`<div class="stats"><div class="stat"><b>${cards.length}</b><span>總收藏</span></div><div class="stat"><b>${new Set(cards.map(c=>c.subject)).size}</b><span>不同素材</span></div><div class="stat"><b>${cards.filter(c=>c.rarity==="LR").length}</b><span>傳說卡</span></div></div>`;$("rarityStats").innerHTML=rarities.map(r=>{const n=cards.filter(c=>c.rarity===r[0]).length;return `<div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid #303b53;font-size:12px"><span>${r[0]} ${r[1]}</span><b>${n} 張</b></div>`}).join("");$("typeStats").innerHTML=Object.entries(typeInfo).map(([k,v])=>`<div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid #303b53;font-size:12px"><span>${v.icon} ${v.label}</span><b>${cards.filter(c=>c.type===k).length} 張</b></div>`).join("")}
async function showDetail(id){const cards=await allCards(),c=cards.find(x=>x.id===id);if(!c)return;activeCardId=id;$("detailContent").innerHTML="";const stage=document.createElement("div");renderCard(c,"detailContent");const lore=document.createElement("p");lore.className="notice";lore.textContent="背景故事："+c.lore;$("detailContent").appendChild(lore);const source=document.createElement("p");source.className="notice";source.textContent="原始素材："+c.subject+" · "+new Date(c.createdAt).toLocaleString();$("detailContent").appendChild(source);if(c.sourceImage){const im=document.createElement("img");im.src=c.sourceImage;im.style="width:100%;max-height:150px;object-fit:contain;border-radius:10px";$("detailContent").appendChild(im)}$("detailModal").classList.add("open")}
$("closeDetail").onclick=()=>$("detailModal").classList.remove("open");
$("deleteCard").onclick=async()=>{if(!activeCardId||!confirm("確定刪除此卡片？此動作無法復原。"))return;await deleteById(activeCardId);$("detailModal").classList.remove("open");await refreshHome();renderCollection();toast("卡片已刪除")};
$("shareCard").onclick=async()=>{const c=(await allCards()).find(x=>x.id===activeCardId);if(!c)return;const text=`${c.name}\n${c.rarity} ${c.rarityName}\n${c.effect}\nREALITY CARD`;if(navigator.share){try{await navigator.share({title:c.name,text})}catch(e){}}else{await navigator.clipboard.writeText(text);toast("卡片文字已複製")}};
$("settingsBtn").onclick=()=>$("settingsModal").classList.add("open");$("closeSettings").onclick=()=>$("settingsModal").classList.remove("open");
$("exportBackup").onclick=async()=>{const cards=await allCards(),blob=new Blob([JSON.stringify({app:"REALITY CARD",version:"1.0",exportedAt:new Date().toISOString(),cards},null,2)],{type:"application/json"});downloadBlob(blob,"reality-card-backup-"+new Date().toISOString().slice(0,10)+".json");toast("備份檔已匯出")};
$("importBackup").onchange=async e=>{const f=e.target.files[0];if(!f)return;try{const data=JSON.parse(await f.text());if(!Array.isArray(data.cards))throw Error("格式錯誤");if(!confirm(`找到 ${data.cards.length} 張卡片。匯入時相同 ID 將覆蓋現有資料，是否繼續？`))return;for(const c of data.cards)if(c.id)await putCard(c);await refreshHome();toast("備份還原完成")}catch(err){alert("備份檔無法讀取："+err.message)}e.target.value=""};
function downloadBlob(blob,name){const a=document.createElement("a"),u=URL.createObjectURL(blob);a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000)}
(async()=>{try{await openDB();await refreshHome()}catch(e){alert("無法啟動本機資料庫，請使用最新版 Chrome。")};if("serviceWorker"in navigator&&location.protocol.startsWith("http"))navigator.serviceWorker.register("./sw.js").catch(()=>{})})();
