
async function main() {
  const { configureSingle, fs } = ZenFS;
  const { WebStorage } = ZenFS_DOM;

  await configureSingle({ backend: WebStorage });

  var openedFile = localStorage.getItem('opened') || "//main.code";
  if (!fs.existsSync('/main.code')) {
    fs.writeFileSync('/main.code', '# Put your code here, or create a new file');
  }
  var auto = true;
  var autoLang = '';
  var lang = 'js';
  const motd =
    `\x1B[1;3;34mOnlineIDE\x1B[0m

Universal online code editor & compiler
Made for Canandaigua Academy\n\nMore to come:
- Multi file support
- More languages support
- Dependencies/Libraries manager

OnlineIDE v0.2.0
 2024 @ Dreamnity inc.`
  const langMap = {
    "js": "javascript",
    "py": "python",
    "g++": "c_cpp",
    "c": "c_cpp",
    "cpp": "c_cpp",
    "gcc": "c_cpp",
    "bash": "sh",
    "shell": "sh"
  };
  const editor = ace.edit("editor");
  ace.require("ace/ext/language_tools");
  editor.setOptions({
    mode: "ace/mode/javascript",
    theme: "ace/theme/vibrant_ink",
    autoScrollEditorIntoView: true,
    enableBasicAutocompletion: true,
    enableSnippets: true,
    enableLiveAutocompletion: true
  });

  const term = new Terminal({
    convertEol: true
  });
  const fit = new FitAddon.FitAddon();
  term.loadAddon(fit);
  term.open(document.getElementById('terminal'));
  fit.fit();
  term.write(motd);
  fetch("/api/changelog")
    .then(async e => {
      if (e.status !== 200) term.write("\n\n\x1b[31mCannot request to OnlineIDE server(Are you offline?)");
      else term.write("\n\n  Live changelog\n\x1b[34m" + (await e.text()) + "\x1b[0m");
    })
    .catch(() => {
      term.write("\n\n\x1b[31mCannot request to OnlineIDE server(Are you offline?)");
    });
  editor.session.on("change", () => {
    clearTimeout(window?.detectInterval);
    window.detectInterval = setTimeout(detect, auto ? 500 : 5000);
    clearTimeout(window?.saveInterval);
    window.saveInterval = setTimeout(() => {
      fs.writeFileSync(openedFile, editor.getValue());
    }, 200);
  });
  function detect() {
    const code = editor.getValue();
    fetch("/api/classify", {
      method: "POST",
      body: code
    }).then(async r => {
      const res = await r.text();
      if (res === 'null' || r.status !== 200) return;
      autoLang = res;
      document.getElementById("lang-auto").innerText = "Auto (" + res + ")";
      if (auto) {
        document.getElementById("lang").innerText = "Auto (" + res + ")";
        editor.session.setMode("ace/mode/" + (langMap[res] || res));
        lang = res;
      }
    })
  }
  function setLang(name) {
    auto = false;
    if (name == 'auto') {
      auto = true;
      name = autoLang || lang;
    }
    editor.session.setMode("ace/mode/" + (langMap[name] || name));
    lang = name;
    document.getElementById("lang").innerHTML = this?.innerHTML || name;
  }
  window.set = setLang;
  /**
   * @type {WebSocket}
   */
  var ws;
  term.onKey(({ key }) => {
    if (ws && ws?.readyState === 1) ws.send(key);
  })
  const stopBtn = document.getElementById("stop");
  stopBtn.onclick = () => {
    if (ws) ws.close();
    stopBtn.disabled = true;
  };
  const runBtn = document.getElementById("run");
  runBtn.onclick = () => {
    if (ws && ws?.readyState <= 1) return;
    ws = new WebSocket("/api/execute?lang=" + lang);
    runBtn.innerText = "...";
    ws.onopen = () => {
      runBtn.classList.add("btn-warning");
      runBtn.innerText = "30%";
      term.write("\u001bc");
      ws.send(JSON.stringify(getTree()));
      stopBtn.disabled = false;
    }
    ws.onmessage = msg => {
      const dat = msg.data.toString();
      if (dat === '!!ready') {
        runBtn.innerText = "50%";
        return;
      }
      if (dat === '!!starting') {
        runBtn.innerText = "80%";
        return;
      }
      if (dat == '!!running') {
        runBtn.innerText = "Running";
        runBtn.classList.remove("btn-warning");
        runBtn.classList.add("btn-success");
        return;
      }
      if (dat.startsWith("!!exit ")) {
        if (dat.endsWith(" 0")) return;
        console.error("Code failed with exit code " + dat.substring(7));
        return;
      }
      term.write(dat);
    }
    ws.onerror = () => term.write("\n\x1b[31m[client websocket error]\x1b[0m");
    ws.onclose = () => {
      runBtn.innerText = "Run";
      runBtn.classList.remove("btn-success", "btn-warning", "btn-info");
      stopBtn.disabled = true;
      ws = null;
    }
  }
  fetch("/api/list").then(async r => {
    if (r.status !== 200) {
      runBtn.classList.add("btn-danger");
      runBtn.disabled = true;
      runBtn.innerText = "OFFLINE";
      return;
    }
    const l = await r.json();
    const dropdown = document.querySelector("ul.dropdown-menu");
    const regex = /[^a-zA-Z0-9\-_]/g
    for (const { language, aliases, version } of l) {
      const id = (regex.test(language) ? aliases.find(e => !regex.test(language)) || language : language).replace(/\+/g, "c");
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.className = 'dropdown-item';
      a.id = 'lang-' + id;
      a.innerHTML = `${language} <sup>${version}</sup>`;
      a.onclick = () => setLang(id);
      li.appendChild(a);
      dropdown.appendChild(li);
    }
  }).finally(() => document.getElementById("splash").hidden = true);
  const search = new URLSearchParams(location.search);
  if (search.has("code")) {
    const code = atob(search.get("code"));
    editor.setValue(code, 1);
  }

  function fileAction(path) {
    try { event.stopPropagation(); }catch{}
    const code = fs.readFileSync(path).toString();
    openedFile = path;
    editor.setValue(code, 1);
    // ensure it doesn't bug out by loading half the file
    //while (editor.getValue() !== code) editor.setValue(code);
  }
  window.fileOpen = fileAction;

  function renderFileTree(container, path) {
    const ul = document.createElement('ul');
    ul.classList.add('file-tree');

    const items = fs.readdirSync(path);

    items.forEach(item => {
      const fullPath = `${path}/${item}`;
      const li = document.createElement('li');
      const stats = fs.statSync(fullPath);

      if (stats.isDirectory()) {
        li.classList.add('folder');
        li.textContent = item;
        li.addEventListener('click', function (event) {
          event.stopPropagation();
          this.classList.toggle('open');
        });

        const actions = document.createElement('span');
        actions.classList.add('actions');
        actions.innerHTML = `<button class="btn-icon" onclick="fileDelete(event, '${fullPath}')" title="Delete ${fullPath}">-</button>`;
        li.appendChild(actions);

        const createBtn = document.createElement('span');
        createBtn.classList.add('create-btn');
        createBtn.innerHTML = `<button class="btn-icon" onclick="fileCreate(event, '${fullPath}')" title="Create file on ${fullPath}">+</button>`;
        li.appendChild(createBtn);

        const folderContent = document.createElement('ul');
        folderContent.classList.add('file-tree', 'folder-content');
        renderFileTree(folderContent, fullPath);
        li.appendChild(folderContent);
      } else {
        li.classList.add('file');
        li.textContent = item;
        li.setAttribute('onclick', `fileOpen('${fullPath}')`);
        li.title = fullPath;

        const actions = document.createElement('span');
        actions.classList.add('actions');
        if(fullPath!=="//main.code") actions.innerHTML = `<button class="btn-icon" onclick="fileDelete(event, '${fullPath}')" title="Delete ${fullPath}">-</button>`;
        li.appendChild(actions);
      }
      ul.appendChild(li);
    });

    container.appendChild(ul);
  }

  function deleteItem(event, itemName) {
    event.stopPropagation();
    if (confirm("Are you sure you want to delete " + itemName + "? This action is irreversible!"))
      fs.rmSync(itemName, {
        recursive: true
      });
    else return;
    fileAction("//main.code");
  }
  window.fileDelete = deleteItem;

  function createItem(event, folderName) {
    event.stopPropagation();
    const newFileName = prompt('Enter the name of the new file or folder:');
    if (newFileName) {
      const fullPath = `${folderName}/${newFileName}`;
      if (newFileName.includes('.')) {
        fs.writeFileSync(fullPath, '');
      } else {
        fs.mkdirSync(fullPath);
      }
      refreshFileTree();
    }
  }
  window.fileCreate = createItem;

  function getTree(path = "/", res = []) {
    fs.readdirSync(path, { withFileTypes: true }).forEach(e => {
      let fullPath = path + "/" + e.path;
      if (fullPath.startsWith("//")) fullPath = fullPath.substring(2);
      if (e.isDirectory()) getTree(fullPath, res);
      else res.push({ name: fullPath, content: fs.readFileSync(fullPath).toString() });
    });
    return res;
  }
  //window.tree = getTree; // development only

  function refreshFileTree() {
    const fileTreeContainer = document.getElementById('file-tree');
    fileTreeContainer.innerHTML = '';
    renderFileTree(fileTreeContainer, '/');
  }
  refreshFileTree();
  fileAction(openedFile);
}
main();