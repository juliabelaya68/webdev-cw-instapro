import { USER_POSTS_PAGE } from "../routes.js";
import { renderHeaderComponent } from "./header-component.js";
import { posts, goToPage } from "../index.js";
import { changeFavorite, deletePost } from "../api.js";
import { formatDistanceToNow } from "../node_modules/date-fns/index.js";
import { ru } from "../node_modules/date-fns/locale/ru.js";

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return formatDistanceToNow(date, { locale: ru });
};

const postComponent = ({
  imageUrl,
  user,
  id,
  likes,
  description,
  createdAt,
  isLiked,
}) => ` <li class="post">
<div class="post-header" data-user-id=${user.id}>
    <img src=${user.imageUrl} class="post-header__user-image">
    <p class="post-header__user-name">${user.name}</p>
  </div>
        
          <div class="post-image-container">
            <img class="post-image" src=${imageUrl} />
          </div>
          <div class="post-likes">
          ${
            isLiked
            ? `<button data-post-id="${id}" data-set-favorite="dislike" class="like-button">
                      <img src="./assets/images/like-active.svg">
                    </button>`
            : `<button data-post-id="${id}" data-set-favorite="like" class="like-button">
                      <img src="./assets/images/like-not-active.svg">
                    </button>`
          }
            <p class="post-likes-text">
              Нравится: <strong>${likes.length}</strong>
            </p>
          </div>
          <p class="post-text">
            <span class="user-name">${user.name}</span>
            ${description}
          </p>
          <p class="post-date">
          ${formatDate(createdAt)}
          </p>
        
`;
const handleLike = async ({ user, postId, event, token, posts }) => {
  try {
    // Отправляем запрос на сервер
    await changeFavorite({
      token,
      postId,
      event,
    });

     // Находим индекс поста
     const postIndex = posts.findIndex((post) => post.id === postId);
     if (postIndex === -1) {
      throw new Error("Пост не найден");
    }
     // Обновляем состояние лайка
     const post = posts[postIndex];
     if (event === "like") {
       post.likes.push({
         id: user._id,
         name: user.name,
       });
       post.isLiked = true;
     } else {
       post.likes = post.likes.filter((like) => like.id !== user._id);
       post.isLiked = false;
     }
     return post;
    } catch (error) {
      console.error("Ошибка при обработке лайка:", error);
      throw error;
    }
  };
  
  const updateLikeButton = (element, post) => {
    const likeContainer = element.querySelector(".post-likes");
    if (!likeContainer) return;
  
    const likeButton = likeContainer.querySelector(".like-button");
    const likesText = likeContainer.querySelector(".post-likes-text");
  
    if (!likeButton || !likesText) return;
  
    const { isLiked } = post;
    likeButton.setAttribute("data-set-favorite", isLiked ? "like" : "dislike");
    likeButton.innerHTML = `
                       <img src="./assets/images/${
                         isLiked ? "like-active" : "like-not-active"
                       }.svg">
                   `;
  
    // Обновляем текст счетчика
    likesText.textContent = `Нравится: ${post.likes.length}`;
  };
  
  export function renderPostsPageComponent({ appEl,user,token }) {
    // Создаем контейнер для постов
    const container = document.createElement("div");
    container.className = "page-container";
  
    // Рендерим заголовок
    const headerContainer = document.createElement("div");
    headerContainer.className = "header-container";
    container.appendChild(headerContainer);
  
    // Создаем список постов
    const postsList = document.createElement("ul");
    postsList.className = "posts";
  
    posts.forEach((post,index) => {
      const postElement = document.createElement("li");
      postElement.classList.add('post')
      postElement.setAttribute('data-post-id', post.id)
      postElement.innerHTML = postComponent(post,user);

      const userEl = postElement.querySelector(".post-header");
    userEl.addEventListener("click", () => {
      goToPage(USER_POSTS_PAGE, {
        userId: userEl.dataset.userId,
      });
    });


    const likeButton = postElement.querySelector(".like-button");
    if (likeButton) {
      likeButton.addEventListener("click", async (e) => {
        e.stopPropagation();
        const postId = post.id
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
        }
      });
   
    }
    const deleteButton = postElement.querySelector('.delete-button')
    if (deleteButton) {
      deleteButton.addEventListener("click", async (e) => {
        const postId = post.id

        try {
          await deletePost({token, postId})
          posts.filter(el => el.id !== postId)

          const htmlPosts = document.querySelectorAll('.post')
          htmlPosts[index].innerHTML=`<p class='tooltip'>Пост удален</p>`
        } catch (error) {
          console.error(error);
        }
      })
    }

    postsList.appendChild(postElement);
  });



  container.appendChild(postsList);
  appEl.innerHTML = "";
  appEl.appendChild(container);

  renderHeaderComponent({
    element: headerContainer,
    user,
  })
}

