const form = document.getElementById("note-form");
const input = document.getElementById("note-input");
const list = document.getElementById("notes-list");

function loadNotes() {
  const notes = JSON.parse(localStorage.getItem("notes") || "[]");
  list.innerHTML = notes.map((note) => `<li class="card">${note}</li>`).join("");
}

function addNote(text) {
  const notes = JSON.parse(localStorage.getItem("notes") || "[]");
  notes.push(text);
  localStorage.setItem("notes", JSON.stringify(notes));
  loadNotes();
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  addNote(text);
  input.value = "";
});

loadNotes();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      console.log("SW registered:", reg.scope);
    } catch (error) {
      console.error("SW registration failed:", error);
    }
  });
}
