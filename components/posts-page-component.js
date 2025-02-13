import { USER_POSTS_PAGE } from "../routes.js";
import { renderHeaderComponent } from "./header-component.js";
import { posts, goToPage } from "../index.js";

const postComponent = ({imageUrl, user, id, likes, description, createdAt}) => `  
                  <li class="post">
                  <div class="post-header" data-user-id=${user.id}>
                        <img src=${user.imageUrl} class="post-header__user-image">
                        <p class="post-header__user-name">${user.name}</p>
                    </div>

                    <div class="post-image-container">
                    <img class="post-image" src=${imageUrl} />
                    </div>
                    <div class="post-likes">
                      <button data-post-id=${id} class="like-button">
                        <img src="./assets/images/like-not-active.svg">
                      </button>
                      <p class="post-likes-text">
                        Нравится: <strong>${likes.length}</strong>
                      </p>
                    </div>
                    <p class="post-text">
                    <span class="user-name">${user.name}</span>
                      ${description}
                    </p>
                    <p class="post-date">
                    ${createdAt}
                    </p>
                  </li>
`
export function renderPostsPageComponent({ appEl, user }) {
  /**
   * @TODO: чтобы отформатировать дату создания поста в виде "19 минут назад"
   * можно использовать https://date-fns.org/v2.29.3/docs/formatDistanceToNow
   */

  const fead = posts.map(post => postComponent(post)).join(" ")

  const appHtml = `
              <div class="page-container">
                <div class="header-container"></div>
                <ul class="posts">
                  ${fead}
                </ul>
              </div>`;

  appEl.innerHTML = appHtml;

  renderHeaderComponent({
    element: document.querySelector(".header-container"),
    user
  });

  for (let userEl of document.querySelectorAll(".post-header")) {
    userEl.addEventListener("click", () => {
      goToPage(USER_POSTS_PAGE, {
        userId: userEl.dataset.userId,
      });
    });
  }
}
