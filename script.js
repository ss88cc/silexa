// URL du backend Render
const apiUrl = "https://blog-psy-backend.onrender.com/api";
let token = null;
let role = null;

// Sections HTML
const userSection = document.getElementById("user-section");
const adminSection = document.getElementById("admin-section");
const postsContainer = document.getElementById("posts-container");

// --- LOGIN / REGISTER ---
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

    try {
      const res = await fetch(`${apiUrl}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      if (!res.ok) return alert("Login échoué");
      const data = await res.json();
      token = data.token;
      role = data.role;
      renderUserSection();
      loadPosts();
    } catch (err) {
      console.error(err);
      alert("Impossible de se connecter au serveur");
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

    try {
      const res = await fetch(`${apiUrl}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      if (!res.ok) return alert("Inscription échouée");
      alert("Inscription réussie !");
      renderLoginForm();
    } catch (err) {
      console.error(err);
      alert("Impossible de se connecter au serveur");
    }
  });

  document.getElementById("show-login").addEventListener("click", renderLoginForm);
}

// --- SECTION USER / ADMIN ---
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

  if (role === "admin") {
    // Formulaire publier post
    document.getElementById("post-form")?.addEventListener("submit", async e => {
      e.preventDefault();
      const title = document.getElementById("post-title").value;
      const content = document.getElementById("post-content").value;

      try {
        const res = await fetch(`${apiUrl}/posts`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": token },
          body: JSON.stringify({ title, content })
        });
        if (!res.ok) return alert("Impossible de publier l'article");
        document.getElementById("post-title").value = "";
        document.getElementById("post-content").value = "";
        loadPosts();
      } catch (err) {
        console.error(err);
        alert("Impossible de se connecter au serveur");
      }
    });
  }
}

// --- CHARGER POSTS + COMMENTAIRES ---
async function loadPosts() {
  postsContainer.innerHTML = "";
  try {
    const res = await fetch(`${apiUrl}/posts`);
    if (!res.ok) return;
    const posts = await res.json();
    const template = document.getElementById("post-template");

    posts.forEach(post => {
      const clone = template.content.cloneNode(true);
      clone.querySelector(".post-title").textContent = post.title;
      clone.querySelector(".post-content").textContent = post.content;

      const commentForm = clone.querySelector(".comment-form");
      const commentsContainer = clone.querySelector(".comments-container");

      // --- Soumettre un commentaire ---
      commentForm.addEventListener("submit", async e => {
        e.preventDefault();
        const content = commentForm.querySelector(".comment-content").value;
        try {
          const res = await fetch(`${apiUrl}/comments/${post.id}`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": token },
            body: JSON.stringify({ content })
          });
          if (!res.ok) return alert("Impossible de commenter");
          commentForm.querySelector(".comment-content").value = "";
          loadPosts();
        } catch (err) {
          console.error(err);
          alert("Impossible de se connecter au serveur");
        }
      });

      // --- Charger les commentaires ---
      fetch(`${apiUrl}/comments/${post.id}`)
        .then(res => res.json())
        .then(comments => {
          commentsContainer.innerHTML = "";
          comments.forEach(c => {
            const div = document.createElement("div");
            div.innerHTML = `<strong>${c.username}</strong><br>${c.content}`;
            commentsContainer.appendChild(div);
          });
        });

      // --- Boutons admin pour modifier/supprimer post ---
      if (role === "admin") {
        const adminControls = document.createElement("div");
        adminControls.innerHTML = `
          <button class="edit-post">Modifier</button>
          <button class="delete-post">Supprimer</button>
        `;

        adminControls.querySelector(".edit-post").addEventListener("click", () => {
          const newTitle = prompt("Nouveau titre", post.title);
          const newContent = prompt("Nouveau contenu", post.content);
          if (!newTitle || !newContent) return;
          fetch(`${apiUrl}/posts/${post.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", "Authorization": token },
            body: JSON.stringify({ title: newTitle, content: newContent })
          }).then(() => loadPosts());
        });

        adminControls.querySelector(".delete-post").addEventListener("click", () => {
          if (!confirm("Supprimer cet article ?")) return;
          fetch(`${apiUrl}/posts/${post.id}`, {
            method: "DELETE",
            headers: { "Authorization": token }
          }).then(() => loadPosts());
        });

        clone.querySelector(".post-content").after(adminControls);
      }

      postsContainer.appendChild(clone);
    });
  } catch (err) {
    console.error(err);
  }
}

// --- INITIALISATION ---
renderLoginForm();
loadPosts();
