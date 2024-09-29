async function main(){const{configureSingle:e,fs:n}=ZenFS,{WebStorage:t}=ZenFS_DOM;await e({backend:t});var i=localStorage.getItem("opened")||"//main.code";n.existsSync("/main.code")||n.writeFileSync("/main.code","# Put your code here, or create a new file");var o=1,a="",c="js";const s={js:"javascript",py:"python","g++":"c_cpp",c:"c_cpp",cpp:"c_cpp",gcc:"c_cpp",bash:"sh",shell:"sh"},r=ace.edit("editor");ace.require("ace/ext/language_tools"),r.setOptions({mode:"ace/mode/javascript",theme:"ace/theme/vibrant_ink",autoScrollEditorIntoView:1,enableBasicAutocompletion:1,enableSnippets:1,enableLiveAutocompletion:1});const l=new Terminal({convertEol:1}),d=new FitAddon.FitAddon;function u(){const e=r.getValue();fetch("/api/classify",{method:"POST",body:e}).then((async e=>{const n=await e.text();"null"!==n&&200===e.status&&(a=n,document.getElementById("lang-auto").innerText="Auto ("+n+")",o&&(document.getElementById("lang").innerText="Auto ("+n+")",r.session.setMode("ace/mode/"+(s[n]||n)),c=n))}))}function m(e){o=0,"auto"==e&&(o=1,e=a||c),r.session.setMode("ace/mode/"+(s[e]||e)),c=e,document.getElementById("lang").innerHTML=this?.innerHTML||e}var p;l.loadAddon(d),l.open(document.getElementById("terminal")),d.fit(),l.write("[1;3;34mOnlineIDE[0m\n\nUniversal online code editor & compiler\nMade for Canandaigua Academy\n\nMore to come:\n- Multi file support\n- More languages support\n- Dependencies/Libraries manager\n\nOnlineIDE v0.2.0\n 2024 @ Dreamnity inc."),fetch("/api/changelog").then((async e=>{200!==e.status?l.write("\n\n[31mCannot request to OnlineIDE server(Are you offline?)"):l.write("\n\n  Live changelog\n[34m"+await e.text()+"[0m")})).catch((()=>{l.write("\n\n[31mCannot request to OnlineIDE server(Are you offline?)")})),r.session.on("change",(()=>{clearTimeout(window?.detectInterval),window.detectInterval=setTimeout(u,o?500:5e3),clearTimeout(window?.saveInterval),window.saveInterval=setTimeout((()=>{n.writeFileSync(i,r.getValue())}),200)})),window.set=m,l.onKey((({key:e})=>{p&&1===p?.readyState&&p.send(e)}));const f=document.getElementById("stop");f.onclick=()=>{p&&p.close(),f.disabled=1};const g=document.getElementById("run");g.onclick=()=>{p&&p?.readyState<=1||(p=new WebSocket("/api/execute?lang="+c),g.innerText="...",p.onopen=()=>{g.classList.add("btn-warning"),g.innerText="30%",l.write("c"),p.send(JSON.stringify(b())),f.disabled=0},p.onmessage=e=>{const n=e.data.toString();if("!!ready"!==n)if("!!starting"!==n){if("!!running"==n)return g.innerText="Running",g.classList.remove("btn-warning"),void g.classList.add("btn-success");if(n.startsWith("!!exit ")){if(n.endsWith(" 0"))return;console.error("Code failed with exit code "+n.substring(7))}else l.write(n)}else g.innerText="80%";else g.innerText="50%"},p.onerror=()=>l.write("\n[31m[client websocket error][0m"),p.onclose=()=>{g.innerText="Run",g.classList.remove("btn-success","btn-warning","btn-info"),f.disabled=1,p=null})},fetch("/api/list").then((async e=>{if(200!==e.status)return g.classList.add("btn-danger"),g.disabled=1,void(g.innerText="OFFLINE");const n=await e.json(),t=document.querySelector("ul.dropdown-menu"),i=/[^a-zA-Z0-9\-_]/g;for(const{language:e,aliases:o,version:a}of n){const n=(i.test(e)&&o.find((n=>!i.test(e)))||e).replace(/\+/g,"c"),c=document.createElement("li"),s=document.createElement("a");s.className="dropdown-item",s.id="lang-"+n,s.innerHTML=`${e} <sup>${a}</sup>`,s.onclick=()=>m(n),c.appendChild(s),t.appendChild(c)}})).finally((()=>document.getElementById("splash").hidden=1));const h=new URLSearchParams(location.search);if(h.has("code")){const e=atob(h.get("code"));r.setValue(e,1)}function w(e){try{event.stopPropagation()}catch{}const t=n.readFileSync(e).toString();i=e,r.setValue(t,1)}function y(e,t){const i=document.createElement("ul");i.classList.add("file-tree");n.readdirSync(t).forEach((e=>{const o=`${t}/${e}`,a=document.createElement("li");if(n.statSync(o).isDirectory()){a.classList.add("folder"),a.textContent=e,a.addEventListener("click",(function(e){e.stopPropagation(),this.classList.toggle("open")}));const n=document.createElement("span");n.classList.add("actions"),n.innerHTML=`<button class="btn-icon" onclick="fileDelete(event, '${o}')" title="Delete ${o}">-</button>`,a.appendChild(n);const t=document.createElement("span");t.classList.add("create-btn"),t.innerHTML=`<button class="btn-icon" onclick="fileCreate(event, '${o}')" title="Create file on ${o}">+</button>`,a.appendChild(t);const i=document.createElement("ul");i.classList.add("file-tree","folder-content"),y(i,o),a.appendChild(i)}else{a.classList.add("file"),a.textContent=e,a.setAttribute("onclick",`fileOpen('${o}')`),a.title=o;const n=document.createElement("span");n.classList.add("actions"),"//main.code"!==o&&(n.innerHTML=`<button class="btn-icon" onclick="fileDelete(event, '${o}')" title="Delete ${o}">-</button>`),a.appendChild(n)}i.appendChild(a)})),e.appendChild(i)}function b(e="/",t=[]){return n.readdirSync(e,{withFileTypes:1}).forEach((i=>{let o=e+"/"+i.path;o.startsWith("//")&&(o=o.substring(2)),i.isDirectory()?b(o,t):t.push({name:o,content:n.readFileSync(o).toString()})})),t}function v(){const e=document.getElementById("file-tree");e.innerHTML="",y(e,"/")}window.fileOpen=w,window.fileDelete=function(e,t){e.stopPropagation(),confirm("Are you sure you want to delete "+t+"? This action is irreversible!")&&(n.rmSync(t,{recursive:1}),w("//main.code"))},window.fileCreate=function(e,t){e.stopPropagation();const i=prompt("Enter the name of the new file or folder:");if(i){const e=`${t}/${i}`;i.includes(".")?n.writeFileSync(e,""):n.mkdirSync(e),v()}},v(),w(i)}main();