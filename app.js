const firebaseConfig = {
  apiKey: "AIzaSyBaqROPsywPgtKjQU7cs1ke1WaqDFhWwn0",
  authDomain: "sistema-gw-36566.firebaseapp.com",
  projectId: "sistema-gw-36566",
  storageBucket: "sistema-gw-36566.firebasestorage.app",
  messagingSenderId: "472820177992",
  appId: "1:472820177992:web:2e1b98c9f6ac3a823d0c7d"
};

const VERSAO = "1.0";
document.getElementById("versao-app").textContent = "v" + VERSAO;

firebase.initializeApp(firebaseConfig);
const db  = firebase.firestore();
const col = db.collection("servicos");

function escHtml(s) {
  return String(s || "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function parseMoeda(s) {
  const v = parseFloat(String(s).replace(/[^\d,]/g, "").replace(",", "."));
  return isNaN(v) ? 0 : v;
}

function fmtMoeda(v) {
  return "R$ " + (v || 0).toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

let servicosCache = {};
let editandoId = null;

function render(docs) {
  const lista = document.getElementById("lista");
  servicosCache = {};

  if (docs.length === 0) {
    lista.innerHTML = '<p class="empty">Nenhum serviço cadastrado.</p>';
    return;
  }

  lista.innerHTML = docs.map(doc => {
    const s = doc.data();
    servicosCache[doc.id] = s;
    return `
      <div class="card">
        <div class="card-acoes">
          <button class="btn-edit" onclick="editarServico('${doc.id}')" title="Editar">✏</button>
          <button class="btn-del" onclick="excluir('${doc.id}')" title="Excluir">✕</button>
        </div>
        <div class="card-nome">${escHtml(s.nome)}</div>
        <div class="card-info">
          <span class="badge">por apto</span>
          <span class="card-valor">${fmtMoeda(s.valor)}</span>
        </div>
        ${s.obs ? `<div class="card-obs">${escHtml(s.obs)}</div>` : ""}
      </div>`;
  }).join("");
}

col.orderBy("criadoEm", "asc").onSnapshot(snap => {
  render(snap.docs);
}, err => {
  console.error(err);
  document.getElementById("lista").innerHTML =
    '<p class="empty">Erro ao conectar. Verifique sua internet.</p>';
});

document.getElementById("form").addEventListener("submit", function(e) {
  e.preventDefault();
  const nome  = document.getElementById("f-nome").value.trim();
  const valor = parseMoeda(document.getElementById("f-valor").value);
  const obs   = document.getElementById("f-obs").value.trim();

  if (!nome) {
    alert("Nome do serviço é obrigatório.");
    return;
  }

  if (editandoId) {
    col.doc(editandoId).update({ nome, valor, obs });
    editandoId = null;
  } else {
    col.add({ nome, valor, obs,
      criadoEm: firebase.firestore.FieldValue.serverTimestamp() });
  }

  this.reset();
  toggleForm();
});

document.getElementById("f-valor").addEventListener("blur", function() {
  const v = parseMoeda(this.value);
  if (v > 0) this.value = v.toFixed(2).replace(".", ",");
});

function editarServico(id) {
  const s = servicosCache[id];
  if (!s) return;
  editandoId = id;
  document.getElementById("form-titulo").textContent = "Editar Serviço";
  document.getElementById("btn-submit").textContent  = "✓ Salvar alterações";
  document.getElementById("f-nome").value  = s.nome  || "";
  document.getElementById("f-valor").value = s.valor > 0
    ? s.valor.toFixed(2).replace(".", ",") : "";
  document.getElementById("f-obs").value   = s.obs   || "";
  const form = document.getElementById("form");
  const fab  = document.getElementById("fab");
  form.style.display = "block";
  fab.classList.add("open");
  document.getElementById("f-nome").focus();
}

function excluir(id) {
  const s = servicosCache[id];
  if (!s) return;
  const senha = prompt("EXCLUIR SERVIÇO?\n\n" + s.nome + "\n\nDigite a senha:");
  if (senha === null) return;
  if (senha !== "4512") {
    alert("Senha incorreta.");
    return;
  }
  col.doc(id).delete();
}

function toggleForm() {
  const form = document.getElementById("form");
  const fab  = document.getElementById("fab");
  const open = form.style.display === "none" || form.style.display === "";
  form.style.display = open ? "block" : "none";
  fab.classList.toggle("open", open);
  if (open) {
    document.getElementById("f-nome").focus();
  } else {
    editandoId = null;
    document.getElementById("form-titulo").textContent = "Novo Serviço";
    document.getElementById("btn-submit").textContent  = "+ Cadastrar";
    document.getElementById("form").reset();
  }
}

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js");
}
