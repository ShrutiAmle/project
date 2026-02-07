let editor, pyodideReady = false, pyodide;
const output = document.getElementById('output');
const languageSelector = document.getElementById('language');
const runBtn = document.getElementById('runBtn');

// Multi-file system
const fileTabs = document.getElementById('fileTabs');
const newFileBtn = document.getElementById('newFileBtn');
const deleteFileBtn = document.getElementById('deleteFileBtn');
const renameFileBtn = document.getElementById('renameFileBtn');
const downloadCodeBtn = document.getElementById('downloadCodeBtn');
const copyOutputBtn = document.getElementById('copyOutputBtn');
const clearOutputBtn = document.getElementById('clearOutputBtn');
const themeSwitchBtn = document.getElementById('themeSwitchBtn');
const outputResize = document.getElementById('outputResize');
const downloadOutputBtn = document.getElementById('downloadOutputBtn');
const printOutputBtn = document.getElementById('printOutputBtn');

let files = [
    { name: 'main.js', lang: 'javascript', code: '// Write your code here!\nconsole.log("Hello, Hackathon!");' },
    { name: 'index.html', lang: 'html', code: '<!DOCTYPE html>\n<html>\n<head>\n<title>Hello Hackathon</title>\n</head>\n<body>\nHello, Hackathon!\n</body>\n</html>' },
    { name: 'style.css', lang: 'css', code: 'body {\n  color: #00e676;\n  background: #23272f;\n}\n' },
    { name: 'main.py', lang: 'python', code: '# Write your code here!\nprint("Hello, Hackathon!")' }
];
let activeFile = 0;
let theme = 'material-darker';

function renderTabs() {
    fileTabs.innerHTML = '';
    files.forEach((file, idx) => {
        const tab = document.createElement('button');
        tab.className = 'file-tab' + (idx === activeFile ? ' active' : '');
        tab.textContent = file.name;
        tab.onclick = () => {
            saveCurrentFile();
            activeFile = idx;
            loadFile();
        };
        fileTabs.appendChild(tab);
    });
    // Animate all tabs on render
    const tabs = document.querySelectorAll('.file-tab');
    tabs.forEach(tab => animateTab(tab));
}
function saveCurrentFile() {
    files[activeFile].code = editor.getValue();
    files[activeFile].lang = languageSelector.value;
}
function loadFile() {
    const file = files[activeFile];
    editor.setValue(file.code);
    languageSelector.value = file.lang;
    languageSelector.dispatchEvent(new Event('change'));
}
newFileBtn.onclick = () => {
    const name = prompt('Enter file name:', 'untitled.js');
    if (name) {
        files.push({ name, lang: 'javascript', code: '' });
        saveCurrentFile();
        activeFile = files.length - 1;
        renderTabs();
        loadFile();
    }
};
deleteFileBtn.onclick = () => {
    if (files.length > 1) {
        files.splice(activeFile, 1);
        activeFile = Math.max(0, activeFile - 1);
        renderTabs();
        loadFile();
    } else {
        alert('At least one file required!');
    }
};
renameFileBtn.onclick = () => {
    const name = prompt('Rename file:', files[activeFile].name);
    if (name) {
        files[activeFile].name = name;
        renderTabs();
    }
};
renderTabs();
loadFile();

// Output resize
let resizing = false;
let startY = 0;
let startHeight = 0;
outputResize.onmousedown = (e) => {
    resizing = true;
    startY = e.clientY;
    startHeight = output.offsetHeight;
    document.body.style.userSelect = 'none';
};
document.onmousemove = (e) => {
    if (resizing) {
        let newHeight = Math.max(80, Math.min(600, startHeight + (e.clientY - startY)));
        output.style.height = newHeight + 'px';
    }
};
document.onmouseup = () => {
    if (resizing) {
        resizing = false;
        document.body.style.userSelect = '';
    }
};

// Output controls
copyOutputBtn.onclick = () => {
    navigator.clipboard.writeText(output.textContent || output.innerText);
};
clearOutputBtn.onclick = () => {
    output.textContent = '';
    output.innerHTML = '';
};
downloadCodeBtn.onclick = () => {
    saveCurrentFile();
    const file = files[activeFile];
    const blob = new Blob([file.code], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = file.name;
    a.click();
};
themeSwitchBtn.onclick = () => {
    theme = theme === 'material-darker' ? 'default' : 'material-darker';
    editor.setOption('theme', theme);
    animateThemeSwitch(themeSwitchBtn);
};
if (downloadOutputBtn) downloadOutputBtn.onclick = () => {
    const text = output.textContent || output.innerText;
    const blob = new Blob([text], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'output.txt';
    a.click();
};
if (printOutputBtn) printOutputBtn.onclick = () => {
    const win = window.open('', '', 'width=600,height=400');
    win.document.write('<pre>' + (output.textContent || output.innerText) + '</pre>');
    win.print();
    win.close();
};

// Initialize CodeMirror
editor = CodeMirror(document.getElementById('editor'), {
    value: '// Write your code here!\nconsole.log("Hello, Hackathon!");',
    mode: 'javascript',
    theme: 'material-darker',
    lineNumbers: true,
    tabSize: 4,
    autofocus: true
});

// Pyodide loader
async function loadPyodideIfNeeded() {
    if (!pyodideReady) {
        output.textContent = 'Loading Python engine...';
        pyodide = await loadPyodide();
        pyodideReady = true;
        output.textContent = '';
    }
}

// Language change
languageSelector.addEventListener('change', async (e) => {
    const lang = e.target.value;
    let mode = 'javascript';
    if (lang === 'python') mode = 'python';
    else if (lang === 'cpp' || lang === 'c') mode = 'text/x-c++src';
    editor.setOption('mode', mode);
    // Default code for each language
    if (lang === 'javascript') editor.setValue('// Write your code here!\nconsole.log("Hello, Hackathon!");');
    else if (lang === 'python') editor.setValue('# Write your code here!\nprint("Hello, Hackathon!")');
    else if (lang === 'cpp') editor.setValue('// C++ code\n#include <iostream>\nint main() {\n    std::cout << "Hello, Hackathon!" << std::endl;\n    return 0;\n}');
    else if (lang === 'c') editor.setValue('// C code\n#include <stdio.h>\nint main() {\n    printf("Hello, Hackathon!\\n");\n    return 0;\n}');
    output.textContent = '';
});

// --- Animation Utility Functions ---
function animateRunBtn(state) {
    runBtn.classList.remove('run-animating', 'run-success', 'run-error');
    if (state === 'animating') runBtn.classList.add('run-animating');
    if (state === 'success') runBtn.classList.add('run-success');
    if (state === 'error') runBtn.classList.add('run-error');
    if (!state) runBtn.classList.remove('run-animating', 'run-success', 'run-error');
}
function animateOutput() {
    output.classList.remove('output-anim');
    void output.offsetWidth;
    output.classList.add('output-anim');
}
function animateTab(tab) {
    tab.classList.add('file-tab-anim');
    setTimeout(() => tab.classList.remove('file-tab-anim'), 500);
}
function animateChatbotBounce() {
    const container = document.getElementById('aiChatbotContainer');
    container.classList.add('ai-chatbot-bounce');
    setTimeout(() => container.classList.remove('ai-chatbot-bounce'), 700);
}
function animateThemeSwitch(btn) {
    btn.classList.add('theme-switch-anim');
    setTimeout(() => btn.classList.remove('theme-switch-anim'), 500);
}
function showSelfHealProgress() {
    const bar = document.getElementById('selfHealProgress');
    bar.style.display = 'block';
    document.getElementById('selfHealProgressBar').style.width = '0%';
}
function updateSelfHealProgress(pct) {
    document.getElementById('selfHealProgressBar').style.width = pct + '%';
}
function hideSelfHealProgress() {
    document.getElementById('selfHealProgress').style.display = 'none';
}
function animateHealing() {
    output.classList.add('healing-anim');
    setTimeout(() => output.classList.remove('healing-anim'), 2400);
}

// --- Patch addAIMessage for animation ---
const origAddAIMessage = window.addAIMessage;
window.addAIMessage = function(msg, from='ai') {
    origAddAIMessage(msg, from);
    const msgs = document.querySelectorAll('.ai-msg');
    if (msgs.length) {
        const last = msgs[msgs.length-1];
        last.classList.add('ai-msg-anim');
        setTimeout(() => last.classList.remove('ai-msg-anim'), 600);
        if (from === 'ai') animateChatbotBounce();
    }
};

// --- Animated Output on Change ---
const origSetOutput = function(txt) {
    output.textContent = txt;
    animateOutput();
};

// --- Self-Healing Code System ---
async function selfHealAndRun(lang, code, maxAttempts=2) {
    let attempt = 0;
    let lastError = null;
    showSelfHealProgress();
    while (attempt < maxAttempts) {
        updateSelfHealProgress((attempt / maxAttempts) * 100);
        animateHealing();
        try {
            if (lang === 'javascript') {
                const result = eval(code);
                origSetOutput(result !== undefined ? result : '');
                updateSelfHealProgress(100);
                hideSelfHealProgress();
                animateRunBtn('success');
                return;
            } else if (lang === 'python') {
                await loadPyodideIfNeeded();
                let result = await pyodide.runPythonAsync(code);
                origSetOutput(result !== undefined ? result : 'Code ran successfully!');
                updateSelfHealProgress(100);
                hideSelfHealProgress();
                animateRunBtn('success');
                return;
            }
        } catch (e) {
            lastError = e;
            origSetOutput(e.toString());
            animateRunBtn('error');
            // Call AI to fix code
            updateSelfHealProgress(((attempt+1)/maxAttempts)*100);
            let fixedCode = await autoFixCodeWithAI(lang, code, e.toString());
            if (!fixedCode || fixedCode.trim() === code.trim()) break;
            code = fixedCode;
            editor.setValue(code); // Update editor with fixed code
        }
        attempt++;
    }
    hideSelfHealProgress();
    animateRunBtn('error');
    origSetOutput('Self-healing failed. Last error: ' + (lastError ? lastError.toString() : 'Unknown error'));
}

async function autoFixCodeWithAI(lang, code, errorMsg) {
    // Use the same AI endpoint as chatbot, but with a bug fix prompt
    try {
        const resp = await fetch('https://api.mistral.chatz.one/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer demo'
            },
            body: JSON.stringify({
                model: 'mistral-tiny',
                messages: [{role:'user', content: `Fix this ${lang} code so it runs without error. Error: ${errorMsg}\nCode:\n${code}\nReturn only the fixed code, no explanation.`}],
                max_tokens: 300
            })
        });
        const data = await resp.json();
        let fixed = data.choices?.[0]?.message?.content;
        // Remove code block markers if present
        if (fixed && fixed.startsWith('```')) {
            fixed = fixed.replace(/^```[a-zA-Z]*\n?/, '').replace(/```$/, '').trim();
        }
        return fixed;
    } catch {
        return null;
    }
}

// --- Patch Run Button Logic ---
runBtn.addEventListener('click', async () => {
    animateRunBtn('animating');
    const lang = languageSelector.value;
    const code = editor.getValue();
    output.textContent = '';
    animateOutput();
    if (lang === 'javascript' || lang === 'python') {
        await selfHealAndRun(lang, code, 2);
    } else if (lang === 'cpp' || lang === 'c') {
        output.innerHTML = 'C/C++ code execution is not supported directly in browser without backend. <br>Try JavaScript or Python!';
        animateRunBtn('error');
    } else {
        // For other languages, just show not supported
        output.textContent = 'Execution for this language is not supported in browser.';
        animateRunBtn('error');
    }
});

// --- Auto-Save Feature ---
const AUTO_SAVE_KEY = 'ide-auto-save-files-v1';

const autoSaveToggle = document.getElementById('autoSaveToggle');
let autoSaveEnabled = true;
if (autoSaveToggle) {
    autoSaveEnabled = autoSaveToggle.checked;
    autoSaveToggle.addEventListener('change', () => {
        autoSaveEnabled = autoSaveToggle.checked;
    });
}

function saveAllFilesToStorage() {
    try {
        localStorage.setItem(AUTO_SAVE_KEY, JSON.stringify(files));
    } catch {}
}
function loadAllFilesFromStorage() {
    try {
        const data = localStorage.getItem(AUTO_SAVE_KEY);
        if (data) {
            const arr = JSON.parse(data);
            if (Array.isArray(arr) && arr.length) {
                files.length = 0;
                arr.forEach(f => files.push(f));
                activeFile = 0;
                renderTabs();
                loadFile();
            }
        }
    } catch {}
}
// Save on every code change if auto-save is enabled
editor.on('change', () => {
    saveCurrentFile();
    if (autoSaveEnabled) saveAllFilesToStorage();
});
// Save on file actions
[newFileBtn, deleteFileBtn, renameFileBtn].forEach(btn => {
    if (btn) btn.addEventListener('click', saveAllFilesToStorage);
});
// Restore on load
window.addEventListener('DOMContentLoaded', loadAllFilesFromStorage);

// Sidebar menu toggle
const sidebarMenuBtn = document.getElementById('sidebarMenuBtn');
const sidebarIdeTools = document.getElementById('sidebarIdeTools');
let menuJustOpened = false;
if (sidebarMenuBtn && sidebarIdeTools) {
    sidebarMenuBtn.onclick = (e) => {
        e.stopPropagation();
        const isOpen = sidebarIdeTools.style.display === 'block';
        if (!isOpen) {
            sidebarIdeTools.style.display = 'block';
            menuJustOpened = true;
            setTimeout(() => { menuJustOpened = false; }, 150);
        } else {
            sidebarIdeTools.style.display = 'none';
        }
    };
    document.addEventListener('click', (e) => {
        if (menuJustOpened) return;
        if (sidebarIdeTools.style.display === 'block' && !sidebarIdeTools.contains(e.target) && e.target !== sidebarMenuBtn) {
            sidebarIdeTools.style.display = 'none';
        }
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && sidebarIdeTools.style.display === 'block') {
            sidebarIdeTools.style.display = 'none';
        }
    });
}
