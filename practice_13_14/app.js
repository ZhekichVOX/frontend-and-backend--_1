const form = document.getElementById("note-form");
const input = document.getElementById("note-input");
const list = document.getElementById("notes-list");

function loadNotes() {
  const notes = JSON.parse(localStorage.getItem("notes") || "[]");
  list.innerHTML = notes
    .map(
      (note, index) => `
        <li class="card row" style="align-items:center; gap:8px;">
          <span class="col-9">${note}</span>
          <button class="col-3 button error" type="button" data-delete-index="${index}">Удалить</button>
        </li>
      `
    )
    .join("");
}

function addNote(text) {
  const notes = JSON.parse(localStorage.getItem("notes") || "[]");
  notes.push(text);
  localStorage.setItem("notes", JSON.stringify(notes));
  loadNotes();
}

function deleteNoteByIndex(index) {
  const notes = JSON.parse(localStorage.getItem("notes") || "[]");
  notes.splice(index, 1);
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

list.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-delete-index]");
  if (!btn) return;
  const index = Number(btn.dataset.deleteIndex);
  if (Number.isNaN(index)) return;
  deleteNoteByIndex(index);
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
