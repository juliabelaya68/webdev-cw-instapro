import { USER_POSTS_PAGE } from "../routes.js";
import { renderHeaderComponent } from "./header-component.js";
import { posts, goToPage } from "../index.js";
import { changeFavorite, deletePost } from "../api.js";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";

// Функция для форматирования даты
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return formatDistanceToNow(date, { locale: ru });
};

// Функция для экранирования HTML-символов
function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Функция для форматирования списка лайков
function getFormattedLikes(likes) {
  if (likes.length === 0) return "Нет лайков";
  if (likes.length === 1)
    return `Нравится: <strong>${escapeHtml(likes[0].name)}</strong>`;
  if (likes.length === 2)
    return `Нравится: <strong>${escapeHtml(likes[0].name)}</strong> и <strong>${escapeHtml(
      likes[1].name
    )}</strong>`;
  return `Нравится: <strong>${escapeHtml(likes[0].name)}</strong>, <strong>${escapeHtml(
    likes[1].name
  )}</strong> и ещё <strong>${likes.length - 2}</strong>`;
}

// Шаблон поста,генерирует HTML-разметку для отображения одного поста
const postComponent = ({
  imageUrl,
  user,
  id,
  likes,
  description,
  createdAt,
  isLiked,
  currentUserId,
}) => `
  <div class="post" data-post-id="${id}">
    <div class="post-header" data-user-id="${user.id}">
      <img src="${user.imageUrl}" class="post-header__user-image">
      <p class="post-header__user-name">${escapeHtml(user.name)}</p>
    </div>
    <div class="post-image-container">
      <img class="post-image" src="${imageUrl}" />
    </div>
    <div class="post-likes">
      ${
        isLiked
          ? `<button data-set-favorite="dislike" class="like-button">
                <img src="./assets/images/like-active.svg">
              </button>`
          : `<button data-set-favorite="like" class="like-button">
                <img src="./assets/images/like-not-active.svg">
              </button>`
      }
      <p class="post-likes-text">
        ${getFormattedLikes(likes)}
      </p>
    </div>
    <p class="post-text">
      <span class="user-name">${escapeHtml(user.name)}</span>
      ${escapeHtml(description)}
    </p>
    <p class="post-date">
      ${formatDate(createdAt)}
    </p>
    ${
      currentUserId === user.id
        ? `<button class="delete-button">-</button>`
        : ""
    }
  </div>
`;

// Обработка лайка
const handleLike = async ({ user, postId, event, token, posts }) => {
  try {
    await changeFavorite({ token, postId, event });
    const postIndex = posts.findIndex((post) => post.id === postId);
    if (postIndex === -1) throw new Error("Пост не найден");
    const post = posts[postIndex];
    if (event === "like") {
      if (!post.likes.some((like) => like.id === user._id)) {
        post.likes.push({ id: user._id, name: user.name });
      }
      post.isLiked = true;
    } else {
      post.likes = post.likes.filter((like) => like.id !== user._id);
      post.isLiked = false;
    }
    return { ...post };
  } catch (error) {
    console.error("Ошибка при обработке лайка:", error);
    throw error;
  }
};

// Обновление кнопки лайка
const updateLikeButton = (element, post) => {
  const likeContainer = element.querySelector(".post-likes");
  if (!likeContainer) return;
  const likeButton = likeContainer.querySelector(".like-button");
  const likesText = likeContainer.querySelector(".post-likes-text");
  if (!likeButton || !likesText) return;
  const { isLiked, likes } = post;
  likeButton.setAttribute("data-set-favorite", isLiked ? "dislike" : "like");
  likeButton.innerHTML = `
    <img src="./assets/images/${isLiked ? "like-active" : "like-not-active"}.svg">
  `;
  likesText.innerHTML = getFormattedLikes(likes);
};

// Функция для создания и управления сообщениями об ошибках
function createErrorMessage(container, message) {
  let errorMessageContainer = container.querySelector(".error-message");
  if (!errorMessageContainer) {
    errorMessageContainer = document.createElement("div");
    errorMessageContainer.className = "error-message";
    errorMessageContainer.style.display = "none";
    errorMessageContainer.style.position = "fixed";
    errorMessageContainer.style.top = "10px";
    errorMessageContainer.style.left = "50%";
    errorMessageContainer.style.transform = "translateX(-50%)";
    errorMessageContainer.style.backgroundColor = "red";
    errorMessageContainer.style.color = "white";
    errorMessageContainer.style.padding = "10px";
    errorMessageContainer.style.borderRadius = "5px";
    errorMessageContainer.style.zIndex = "1000";
    container.appendChild(errorMessageContainer);
  }
  errorMessageContainer.textContent = message;
  errorMessageContainer.style.display = "block";
  setTimeout(() => {
    errorMessageContainer.style.display = "none";
  }, 3000);
}

// Обработка удаления поста
const handleDeletePost = async ({ postId, token, posts, container }) => {
  try {
    await deletePost({ token, postId });
    posts = posts.filter((post) => post.id !== postId);
    const postElement = container.querySelector(`[data-post-id="${postId}"]`);
    if (postElement) {
      postElement.innerHTML = `<p class="tooltip">Пост удален</p>`;
    }
  } catch (error) {
    console.error(error);
    createErrorMessage(container, "Произошла ошибка при удалении поста.");
  }
};

// Рендеринг страницы постов
export function renderPostsPageComponent({ appEl, user, token }) {
  const container = document.createElement("div");
  container.className = "page-container";

  // Рендеринг заголовка
  const headerContainer = document.createElement("div");
  headerContainer.className = "header-container";
  container.appendChild(headerContainer);

  // Создание списка постов
  const postsList = document.createElement("ul");
  postsList.className = "posts";

  posts.forEach((post) => {
    const postElement = document.createElement("li");//Создание элемента списка (li)
    postElement.classList.add("post-item"); // Добавляем класс для элемента списка
    postElement.setAttribute("data-post-id", post.id);//Установка атрибута data-post-id:

    // Передаем currentUserId для проверки прав доступа
    postElement.innerHTML = postComponent({ ...post, currentUserId: user?._id }, user);

    // Обработка клика на имя пользователя
    const userEl = postElement.querySelector(".post-header");
    userEl.addEventListener("click", () => {
      goToPage(USER_POSTS_PAGE, { userId: userEl.dataset.userId });
    });

    // Обработка клика на кнопку лайка
    const likeButton = postElement.querySelector(".like-button");
    if (likeButton) {
      likeButton.addEventListener("click", async (e) => {
        e.stopPropagation();
        if (!user || !user._id) {
          createErrorMessage(container, "Вы должны быть авторизованы, чтобы поставить лайк.");
          return;
        }
        const postId = post.id;
        const event = likeButton.getAttribute("data-set-favorite");
        try {
          const updatedPost = await handleLike({
            user,
            postId,
            event,
            token,
            posts,
          });
          updateLikeButton(postElement, updatedPost);
        } catch (error) {
          console.error(error);
          createErrorMessage(container, "Произошла ошибка при установке лайка.");
        }
      });
    }

    // Обработка клика на кнопку удаления
    const deleteButton = postElement.querySelector(".delete-button");
    if (deleteButton) {
      deleteButton.addEventListener("click", async (e) => {
        e.stopPropagation();
        if (!user || !user._id) {
          createErrorMessage(container, "Вы должны быть авторизованы, чтобы удалить пост.");
          return;
        }
        const postId = post.id;
        await handleDeletePost({ postId, token, posts, container });
      });
    }

    postsList.appendChild(postElement);
  });

  container.appendChild(postsList);
  appEl.innerHTML = "";
  appEl.appendChild(container);

  // Рендерим заголовок
  renderHeaderComponent({
    element: headerContainer,
    user,
  });
}
