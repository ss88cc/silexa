const apiUrl = "https://blog-psy-backend.onrender.com/api";
let token = null;
let role = null;

// Section utilisateur
const userSection = document.getElementById("user-section");
const adminSection = document.getElementById("admin-section");
const postsContainer = document.getElementById("posts-container");

// --- Fonctions de login/register ---
function renderLoginForm() {
  userSection.innerHTML = `
    <form id="login-form">
      <input type="text" id="login-username" placeholder="Username" required>
      <input type="password" id="login-password" placeholder="Password" required>
      <button type="submit">Login</button>
    </form>
    <button id="show-register">S'inscrire</button>
  `;

  document.getElementById("login-form").addEventListener("submit", async e => {
    e.preventDefault();
    const username = document.getElementById("login-username").value;
    const password = document.getElementById("login-password").value;
    const res = await fetch(`${apiUrl}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (data.token) {
      token = data.token;
      role = data.role;
      renderUserSection();
      loadPosts();
    } else {
      alert("Login échoué");
    }
  });

  document.getElementById("show-register").addEventListener("click", renderRegisterForm);
}

function renderRegisterForm() {
  userSection.innerHTML = `
    <form id="register-form">
      <input type="text" id="register-username" placeholder="Username" required>
      <input type="password" id="register-password" placeholder="Password" required>
      <button type="submit">S'inscrire</button>
    </form>
    <button id="show-login">Retour Login</button>
  `;

  document.getElementById("register-form").addEventListener("submit", async e => {
    e.preventDefault();
    const username = document.getElementById("register-username").value;
    const password = document.getElementById("register-password").value;
    await fetch(`${apiUrl}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });
    alert("Inscription réussie !");
    renderLoginForm();
  });

  document.getElementById("show-login").addEventListener("click", renderLoginForm);
}

// --- Afficher section user et admin ---
function renderUserSection() {
  userSection.innerHTML = `
    <span>Connecté (${role})</span>
    <button id="logout-btn">Logout</button>
  `;
  document.getElementById("logout-btn").addEventListener("click", () => {
    token = null;
    role = null;
    renderLoginForm();
  });

  adminSection.classList.toggle("hidden", role !== "admin");
}

// --- Publier un post (admin) ---
document.getElementById("post-form")?.addEventListener("submit", async e => {
  e.preventDefault();
  const title = document.getElementById("post-title").value;
  const content = document.getElementById("post-content").value;
  await fetch(`${apiUrl}/posts`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": token },
    body: JSON.stringify({ title, content })
  });
  document.getElementById("post-title").value = "";
  document.getElementById("post-content").value = "";
  loadPosts();
});

// --- Charger les posts et commentaires ---
async function loadPosts() {
  postsContainer.innerHTML = "";
  const res = await fetch(`${apiUrl}/posts`);
  const posts = await res.json();
  const template = document.getElementById("post-template");

  posts.forEach(post => {
    const clone = template.content.cloneNode(true);
    clone.querySelector(".post-title").textContent = post.title;
    clone.querySelector(".post-content").textContent = post.content;

    // Formulaire commentaire
    const commentForm = clone.querySelector(".comment-form");
    const commentsContainer = clone.querySelector(".comments-container");
    commentForm.addEventListener("submit", async e => {
      e.preventDefault();
      const content = commentForm.querySelector(".comment-content").value;
      await fetch(`${apiUrl}/comments/${post.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": token },
        body: JSON.stringify({ content })
      });
      commentForm.querySelector(".comment-content").value = "";
      loadPosts();
    });

    // Charger les commentaires
    fetch(`${apiUrl}/comments/${post.id}`)
      .then(res => res.json())
      .then(comments => {
        commentsContainer.innerHTML = "";
        comments.forEach(c => {
          const div = document.createElement("div");
          div.textContent = c.content;
          commentsContainer.appendChild(div);
        });
      });

    postsContainer.appendChild(clone);
  });
}

// --- Initialisation ---
renderLoginForm();
loadPosts();
