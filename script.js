/** 
 * zaifsecurity - Advanced Cryptographic Suite
 * Developed by Huzaifa Mahmood 2026
 */

class CipherManager {
    constructor() {
        this.alphabet = "abcdefghijklmnopqrstuvwxyz";
    }

    // --- Caesar Cipher Strategy (Case Preserving) ---
    caesar(text, shift, mode = 'enc') {
        const s = mode === 'enc'? parseInt(shift) : (26 - parseInt(shift)) % 26;
        let result = "";
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            const isUpper = char === char.toUpperCase();
            const charIdx = this.alphabet.indexOf(char.toLowerCase());
            
            if (charIdx >= 0) {
                const newIdx = (charIdx + s + 26) % 26;
                const resChar = this.alphabet[newIdx];
                result += isUpper? resChar.toUpperCase() : resChar;
            } else {
                result += char;
            }
        }
        return result;
    }

    // --- Vigenère Cipher Strategy (Polyalphabetic) ---
    vigenere(text, key, mode = 'enc') {
        if (!key) return "⚠️ Error: Secret Keyword is Required!";
        let result = "";
        let j = 0;
        const op = mode === 'enc'? 1 : -1;

        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            const charIdx = this.alphabet.indexOf(char.toLowerCase());
            
            if (charIdx >= 0) {
                const keyChar = key[j % key.length].toLowerCase();
                const keyIdx = this.alphabet.indexOf(keyChar);
                if (keyIdx >= 0) {
                    const newIdx = (charIdx + (op * keyIdx) + 26) % 26;
                    const resChar = this.alphabet[newIdx];
                    result += (char === char.toUpperCase())? resChar.toUpperCase() : resChar;
                    j++;
                }
            } else {
                result += char;
            }
        }
        return result;
    }

    // --- Base64 Strategy (Unicode Safe) ---
    base64(text, mode = 'enc') {
        try {
            if (mode === 'enc') {
                const utf8Bytes = new TextEncoder().encode(text);
                const binString = Array.from(utf8Bytes, (byte) => String.fromCharCode(byte)).join("");
                return btoa(binString);
            } else {
                const binString = atob(text);
                const bytes = Uint8Array.from(binString, (m) => m.charCodeAt(0));
                return new TextDecoder().decode(bytes);
            }
        } catch (e) {
            return "❌ Error: Invalid Base64 Sequence!";
        }
    }
}

// --- Global Variables ---
const engine = new CipherManager();
let currentCipher = "caesar";
let currentInputType = "text";
let recognition = null;
let isRecording = false;

// ========== INITIALIZATION ==========
document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();
    initializeVoiceRecognition();
    setupFileUpload();
    setupExportMenu();
});

// ========== CIPHER TABS AND CONFIG ==========
function initializeEventListeners() {
    // Cipher Tab Switching
    document.querySelectorAll('.cipher-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.cipher-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentCipher = tab.dataset.cipher;

            document.getElementById('caesarConfig').classList.toggle('hidden', currentCipher !== 'caesar');
            document.getElementById('vigenereConfig').classList.toggle('hidden', currentCipher !== 'vigenere');
            document.getElementById('outputData').value = '';
        });
    });

    // Input Type Switching
    document.querySelectorAll('.input-type-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.input-type-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentInputType = btn.dataset.type;

            document.getElementById('textInput').classList.toggle('hidden', currentInputType !== 'text');
            document.getElementById('voiceInput').classList.toggle('hidden', currentInputType !== 'voice');
            document.getElementById('fileInput').classList.toggle('hidden', currentInputType !== 'file');
        });
    });

    // Shift Slider
    document.getElementById('caesarShift').addEventListener('input', (e) => {
        document.getElementById('shiftVal').innerText = e.target.value;
    });

    // Encrypt & Decrypt Buttons
    document.getElementById('encryptBtn').addEventListener('click', () => processData('enc'));
    document.getElementById('decryptBtn').addEventListener('click', () => processData('dec'));

    // Contact Form
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => handleContactSubmit(e));
    }
}

// ========== DATA PROCESSING ==========
function processData(mode) {
    let input = document.getElementById('inputData').value;
    
    if (!input || input.trim() === '') {
        document.getElementById('outputData').value = "⚠️ Error: Input data is empty!";
        return;
    }

    let output = "";

    try {
        if (currentCipher === "caesar") {
            output = engine.caesar(input, document.getElementById('caesarShift').value, mode);
        } else if (currentCipher === "vigenere") {
            output = engine.vigenere(input, document.getElementById('vigenereKey').value, mode);
        } else if (currentCipher === "base64") {
            output = engine.base64(input, mode);
        }

        document.getElementById('outputData').value = output;
    } catch (error) {
        document.getElementById('outputData').value = "❌ Processing Error: " + error.message;
    }
}

// ========== VOICE INPUT ==========
function initializeVoiceRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        const voiceBtn = document.getElementById('voiceBtn');
        const voiceStatus = document.getElementById('voiceStatus');

        recognition.onstart = () => {
            isRecording = true;
            voiceBtn.classList.add('recording');
            voiceBtn.innerHTML = '<i class="fa-solid fa-microphone-slash"></i> Recording...';
            voiceStatus.textContent = '🎤 Listening...';
        };

        recognition.onresult = (event) => {
            let interimTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    document.getElementById('inputData').value += transcript + ' ';
                    voiceStatus.textContent = '✅ Transcribed: ' + transcript;
                } else {
                    interimTranscript += transcript;
                }
            }
        };

        recognition.onerror = (event) => {
            voiceStatus.textContent = '❌ Error: ' + event.error;
        };

        recognition.onend = () => {
            isRecording = false;
            voiceBtn.classList.remove('recording');
            voiceBtn.innerHTML = '<i class="fa-solid fa-microphone"></i> Start Recording';
        };

        voiceBtn.addEventListener('click', () => {
            if (isRecording) {
                recognition.stop();
            } else {
                document.getElementById('inputData').value = '';
                recognition.start();
            }
        });
    } else {
        const voiceBtn = document.getElementById('voiceBtn');
        voiceBtn.innerHTML = '<i class="fa-solid fa-exclamation-triangle"></i> Voice Input Not Supported';
        voiceBtn.disabled = true;
    }
}

// ========== FILE UPLOAD & ENCRYPTION ==========
function setupFileUpload() {
    const fileDropZone = document.getElementById('fileDropZone');
    const fileUpload = document.getElementById('fileUpload');
    const fileStatus = document.getElementById('fileStatus');

    fileDropZone.addEventListener('click', () => fileUpload.click());

    fileDropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        fileDropZone.style.borderColor = '#00ff41';
        fileDropZone.style.background = 'rgba(0, 255, 65, 0.15)';
    });

    fileDropZone.addEventListener('dragleave', () => {
        fileDropZone.style.borderColor = 'rgba(0, 255, 65, 0.2)';
        fileDropZone.style.background = 'rgba(0, 255, 65, 0.05)';
    });

    fileDropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        fileDropZone.style.borderColor = 'rgba(0, 255, 65, 0.2)';
        fileDropZone.style.background = 'rgba(0, 255, 65, 0.05)';
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileUpload(files[0], fileStatus);
        }
    });

    fileUpload.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFileUpload(e.target.files[0], fileStatus);
        }
    });
}

function handleFileUpload(file, statusElement) {
    if (file.type !== 'text/plain') {
        statusElement.textContent = '❌ Only .txt files are supported!';
        statusElement.style.color = '#ff3333';
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        document.getElementById('inputData').value = e.target.result;
        statusElement.textContent = `✅ File loaded: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`;
        statusElement.style.color = '#00ff41';
    };

    reader.onerror = () => {
        statusElement.textContent = '❌ Error reading file!';
        statusElement.style.color = '#ff3333';
    };

    reader.readAsText(file);
}

// ========== EXPORT FUNCTIONALITY ==========
function setupExportMenu() {
    const exportBtn = document.getElementById('exportBtn');
    const exportMenu = document.getElementById('exportMenu');

    exportBtn.addEventListener('click', () => {
        exportMenu.style.display = exportMenu.style.display === 'none' ? 'block' : 'none';
    });

    document.querySelectorAll('.export-option').forEach(option => {
        option.addEventListener('click', () => {
            const format = option.dataset.format;
            exportData(format);
            exportMenu.style.display = 'none';
        });
    });

    document.addEventListener('click', (e) => {
        if (!exportBtn.contains(e.target) && !exportMenu.contains(e.target)) {
            exportMenu.style.display = 'none';
        }
    });
}

function exportData(format) {
    const output = document.getElementById('outputData').value;

    if (!output || output.trim() === '') {
        alert('⚠️ No output to export!');
        return;
    }

    let content, filename, mimeType;

    if (format === 'txt') {
        content = output;
        filename = `encrypted_${Date.now()}.txt`;
        mimeType = 'text/plain';
    } else if (format === 'json') {
        content = JSON.stringify({
            cipher: currentCipher,
            data: output,
            timestamp: new Date().toISOString()
        }, null, 2);
        filename = `encrypted_${Date.now()}.json`;
        mimeType = 'application/json';
    } else if (format === 'enc') {
        content = btoa(JSON.stringify({
            cipher: currentCipher,
            data: output,
            timestamp: new Date().toISOString()
        }));
        filename = `encrypted_${Date.now()}.enc`;
        mimeType = 'application/octet-stream';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
}

// ========== CLIPBOARD ==========
function copyResult() {
    const output = document.getElementById('outputData');
    if (!output.value) return;

    output.select();
    document.execCommand('copy');

    const btn = document.querySelector('.copy-btn');
    const originalHTML = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
    btn.style.background = 'rgba(0, 255, 65, 0.3)';

    setTimeout(() => {
        btn.innerHTML = originalHTML;
        btn.style.background = '';
    }, 2000);
}

// ========== CONTACT FORM ==========
function handleContactSubmit(e) {
    e.preventDefault();

    const name = document.getElementById('contactName').value;
    const email = document.getElementById('contactEmail').value;
    const message = document.getElementById('contactMsg').value;

    if (!name || !email || !message) {
        alert('⚠️ Please fill all fields!');
        return;
    }

    const btn = document.querySelector('.submit-btn-premium');
    const originalHTML = btn.innerHTML;

    btn.innerHTML = '<i class="fa-solid fa-circle-check"></i> Message Sent!';
    btn.style.background = 'rgba(0, 255, 65, 0.2)';
    btn.disabled = true;

    // Simulate sending
    setTimeout(() => {
        btn.innerHTML = originalHTML;
        btn.style.background = '';
        btn.disabled = false;
        e.target.reset();
    }, 2000);
}