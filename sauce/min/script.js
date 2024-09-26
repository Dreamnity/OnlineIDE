function main(){var e=1,n="",t="js";const o={js:"javascript",py:"python","g++":"c_cpp",c:"c_cpp",cpp:"c_cpp",gcc:"c_cpp",bash:"sh",shell:"sh"},a=ace.edit("editor");ace.require("ace/ext/language_tools"),a.setOptions({mode:"ace/mode/javascript",theme:"ace/theme/vibrant_ink",autoScrollEditorIntoView:1,enableBasicAutocompletion:1,enableSnippets:1,enableLiveAutocompletion:1});const i=new Terminal({convertEol:1}),s=new FitAddon.FitAddon;function c(){const i=a.getValue();fetch("/api/classify",{method:"POST",body:i}).then((async i=>{const s=await i.text();"null"!==s&&404!==i.status&&(n=s,document.getElementById("lang-auto").innerText="Auto ("+s+")",e&&(document.getElementById("lang").innerText="Auto ("+s+")",a.session.setMode("ace/mode/"+(o[name]||name)),t=s))})),localStorage.setItem("code",i)}function l(i){e=0,"auto"==i&&(e=1,i=n||t),a.session.setMode("ace/mode/"+(o[i]||i)),t=i,document.getElementById("lang").innerHTML=this?.innerHTML||i}var r;i.loadAddon(s),i.open(document.getElementById("terminal")),s.fit(),i.write("[1;3;34mOnlineIDE[0m\n\nUniversal online code editor & compiler\nMade for Canandaigua Academy\n\nMore to come:\n- Multi file support\n- More languages support\n- Dependencies/Libraries manager\n\nOnlineIDE@0.1.2-BETA\n 2024 @ Dreamnity inc."),a.session.on("change",(()=>{clearTimeout(window?.saveInterval),window.saveInterval=setTimeout(c,e?2e3:1e4)})),window.set=l,fetch("/api/list").then((e=>e.json())).then((e=>{const n=document.querySelector("ul.dropdown-menu"),t=/[^a-zA-Z0-9\-_]/g;for(const{language:o,aliases:a,version:i}of e){const e=(t.test(o)&&a.find((e=>!t.test(o)))||o).replace(/\+/g,"c"),s=document.createElement("li"),c=document.createElement("a");c.className="dropdown-item",c.id="lang-"+e,c.innerHTML=`${o} <sup>${i}</sup>`,c.onclick=()=>l(e),s.appendChild(c),n.appendChild(s)}})).finally((()=>document.getElementById("splash").hidden=1)),i.onKey((({key:e})=>{r&&1===r?.readyState&&r.send(e)}));const d=document.getElementById("stop");d.onclick=()=>{r&&r.close(),d.disabled=1};const m=document.getElementById("run");if(m.onclick=()=>{r&&r?.readyState<=1||(r=new WebSocket("/api/execute?lang="+t),m.innerText="...",r.onopen=()=>{m.classList.add("btn-warning"),m.innerText="30%",i.write("c"),r.send(a.getValue()),d.disabled=0},r.onmessage=e=>{const n=e.data.toString();if("!!ready"!==n)if("!!starting"!==n){if("!!running"==n)return m.innerText="Running",m.classList.remove("btn-warning"),void m.classList.add("btn-success");if(n.startsWith("!!exit ")){if(n.endsWith(" 0"))return;console.error("Code failed with exit code "+n.substring(7))}else i.write(n)}else m.innerText="80%";else m.innerText="50%"},r.onerror=()=>i.write("[31m[client websocket error][0m"),r.onclose=()=>{m.innerText="Run",m.classList.remove("btn-success","btn-warning","btn-info"),d.disabled=1,r=null})},localStorage.getItem("code")){const e=localStorage.getItem("code");for(a.setValue(e);a.getValue()!==e;)a.setValue(e)}}main();