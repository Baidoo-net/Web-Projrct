// ---------- CONFIG ----------
let EMBEDDED_API_KEY = "BKgMWK8hkqj1j5SRB2pqK"; // your provided key (used if input left blank)
const BASE = "https://api.scripture.api.bible/v1";
const DEFAULT_BIBLE_ID = "de4e12af7f28f599-01"; // WEB

// ---------- DOM ----------
const apiKeyInput = document.getElementById("apiKeyInput");
const bibleIdInput = document.getElementById("bibleIdInput");
const bookSelect = document.getElementById("bookSelect");
const chapterSelect = document.getElementById("chapterSelect");
const verseSelect = document.getElementById("verseSelect");
const showVerseBtn = document.getElementById("showVerseBtn");
const verseDisplay = document.getElementById("verseDisplay");
const searchInput = document.getElementBayId("searchInput");
const searchBtn = document.getElementById("searchBtn");
const dailyVerseBtn = document.getElementById("dailyVerseBtn");
const readBtn = document.getElementById("readBtn");
const copyBtn = document.getElementById("copyBtn");
const searchResults = document.getElementById("searchResults");
const darkToggle = document.getElementById("darkToggle");

// ---------- Helpers ----------
function apiKey(){
  const k = apiKeyInput.value.trim();
  return k || EMBEDDED_API_KEY;
}
function bibleId(){
  const b = bibleIdInput.value.trim();
  return b || DEFAULT_BIBLE_ID;
}
function headers(){
  return { "api-key": apiKey() };
}
async function apiFetch(path){
  const url = BASE + path;
  const res = await fetch(url, { headers: headers() });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`API error ${res.status}: ${txt}`);
  }
  return res.json();
}
function setBusy(elem, on=true){
  elem.disabled = on;
}

// ---------- Load books ----------
async function loadBooks(){
  try{
    bookSelect.innerHTML = `<option>Loading...</option>`;
    const data = await apiFetch(`/bibles/${bibleId()}/books`);
    bookSelect.innerHTML = "";
    data.data.forEach(b => {
      const opt = document.createElement("option");
      opt.value = b.id;
      opt.textContent = b.name;
      bookSelect.appendChild(opt);
    });
    // auto-load chapters for first book
    await loadChapters();
  }catch(e){
    bookSelect.innerHTML = `<option>Error loading books</option>`;
    verseDisplay.textContent = `Error loading books: ${e.message}`;
    console.error(e);
  }
}

// ---------- Load chapters for selected book ----------
async function loadChapters(){
  try{
    chapterSelect.innerHTML = `<option>Loading...</option>`;
    const bookId = bookSelect.value;
    const data = await apiFetch(`/bibles/${bibleId()}/books/${bookId}/chapters`);
    chapterSelect.innerHTML = "";
    data.data.forEach(ch => {
      const opt = document.createElement("option");
      opt.value = ch.id;
      opt.textContent = ch.reference; // e.g., "Genesis 1"
      chapterSelect.appendChild(opt);
    });
    // auto-load verses for first chapter
    await loadVerses();
  }catch(e){
    chapterSelect.innerHTML = `<option>Error</option>`;
    verseDisplay.textContent = `Error loading chapters: ${e.message}`;
    console.error(e);
  }
}

// ---------- Load verses for selected chapter ----------
async function loadVerses(){
  try{
    verseSelect.innerHTML = `<option>Loading...</option>`;
    const chapterId = chapterSelect.value;
    // get verses (paged); we request a sensible page size
    const data = await apiFetch(`/bibles/${bibleId()}/chapters/${chapterId}/verses?page=1&include=content`);
    verseSelect.innerHTML = "";
    data.data.forEach(v => {
      const opt = document.createElement("option");
      // v.reference looks like "Genesis 1:1"
      opt.value = v.id;
      opt.textContent = v.reference.split(":")[1] || v.reference; // show verse number
      verseSelect.appendChild(opt);
    });
  }catch(e){
    verseSelect.innerHTML = `<option>Error</option>`;
    verseDisplay.textContent = `Error loading verses: ${e.message}`;
    console.error(e);
  }
}

// ---------- Show specific verse by verseId (from verseSelect or search) ----------
async function showVerseById(verseId){
  try{
    setBusy(showVerseBtn,true);
    verseDisplay.textContent = "Loading verse...";
    const data = await apiFetch(`/bibles/${bibleId()}/verses/${verseId}`);
    // API returns HTML in data.data.content sometimes; show it safely
    const ref = data.data.reference || "";
    // prefer content if present, else use text
    const content = data.data.content || data.data.text || "";
    // sanitize minimal: show content as-is (API returns safe HTML fragments)
    verseDisplay.innerHTML = `<strong>${ref}</strong><div class="verse-content">${content}</div>`;
    // clear search results
    searchResults.innerHTML = "";
  }catch(e){
    verseDisplay.textContent = `Error loading verse: ${e.message}`;
    console.error(e);
  }finally{
    setBusy(showVerseBtn,false);
  }
}

// ---------- Show verse from selections ----------
async function showSelectedVerse(){
  const verseId = verseSelect.value;
  if(!verseId){
    verseDisplay.textContent = "Please select a verse.";
    return;
  }
  await showVerseById(verseId);
}

// ---------- Random verse (from selected chapter) ----------
async function showRandomVerse(){
  try{
    setBusy(dailyVerseBtn,true);
    verseDisplay.textContent = "Picking random verse...";
    // fetch verses then pick random
    const chapterId = chapterSelect.value;
    const data = await apiFetch(`/bibles/${bibleId()}/chapters/${chapterId}/verses?page=1&include=content`);
    const verses = data.data;
    if(!verses || verses.length===0){
      verseDisplay.textContent = "No verses in this chapter.";
      return;
    }
    const pick = verses[Math.floor(Math.random()*verses.length)];
    await showVerseById(pick.id);
  }catch(e){
    verseDisplay.textContent = `Error picking random verse: ${e.message}`;
    console.error(e);
  }finally{
    setBusy(dailyVerseBtn,false);
  }
}

// ---------- Search (keyword) ----------
async function searchKeyword(){
  const q = searchInput.value.trim();
  if(!q){
    verseDisplay.textContent = "Please enter a search keyword (e.g., love, faith).";
    return;
  }

  try{
    setBusy(searchBtn,true);
    verseDisplay.textContent = `Searching for "${q}"...`;
    searchResults.innerHTML = "";
    // Use search endpoint: returns verses with text & reference
    const data = await apiFetch(`/bibles/${bibleId()}/search?query=${encodeURIComponent(q)}&fuzzy=false&page=1`);
    if(!data.data || !data.data.verses || data.data.verses.length===0){
      verseDisplay.textContent = `No results for "${q}".`;
      return;
    }
    verseDisplay.textContent = `Results for "${q}":`;
    // show clickable results (limit 20)
    const list = data.data.verses.slice(0,20);
    list.forEach(item => {
      const div = document.createElement("div");
      div.className = "item";
      div.innerHTML = `<strong>${item.reference}</strong><div style="margin-top:6px">${item.text}</div>`;
      div.addEventListener("click", async () => {
        // item.verseId sometimes available as verseId or id
        const vid = item.verseId || item.id || item.verse_id;
        if(vid){
          await showVerseById(vid);
        }else{
          // fallback: try fetch by reference
          try{
            const d = await apiFetch(`/bibles/${bibleId()}/search?query=${encodeURIComponent(item.reference)}`);
            if(d.data && d.data.verses && d.data.verses[0] && d.data.verses[0].verseId){
              await showVerseById(d.data.verses[0].verseId);
            }else{
              verseDisplay.textContent = "Unable to open selected verse.";
            }
          }catch(err){
            console.error(err);
            verseDisplay.textContent = "Unable to open selected verse.";
          }
        }
      });
      searchResults.appendChild(div);
    });
  }catch(e){
    verseDisplay.textContent = `Search error: ${e.message}`;
    console.error(e);
  }finally{
    setBusy(searchBtn,false);
  }
}

// ---------- Read aloud ----------
function readAloud(){
  const text = verseDisplay.innerText || verseDisplay.textContent;
  if(!text || text.trim().length===0) return;
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 1;
  u.pitch = 1;
  speechSynthesis.cancel();
  speechSynthesis.speak(u);
}

// ---------- Copy to clipboard ----------
async function copyVerse(){
  const txt = verseDisplay.innerText || verseDisplay.textContent;
  if(!txt) return;
  try{
    await navigator.clipboard.writeText(txt);
    copyBtn.textContent = "Copied!";
    setTimeout(()=>copyBtn.textContent = "📋 Copy",1200);
  }catch(e){
    console.error(e);
  }
}

// ---------- Dark toggle ----------
darkToggle.addEventListener("click", ()=> document.body.classList.toggle("dark"));

// ---------- Events ----------
bookSelect.addEventListener("change", loadChapters);
chapterSelect.addEventListener("change", loadVerses);
showVerseBtn.addEventListener("click", showSelectedVerse);
dailyVerseBtn.addEventListener("click", showRandomVerse);
searchBtn.addEventListener("click", searchKeyword);
readBtn.addEventListener("click", readAloud);
copyBtn.addEventListener("click", copyVerse);

// Allow Enter key for search
searchInput.addEventListener("keydown", (e)=>{ if(e.key === "Enter") searchKeyword(); });

// Initialize app
(async function init(){
  // populate API & Bible ID inputs with defaults (optional)
  bibleIdInput.value = DEFAULT_BIBLE_ID;
  apiKeyInput.value = ""; // keep blank to use embedded key; user can paste own key
  await loadBooks();
})();
