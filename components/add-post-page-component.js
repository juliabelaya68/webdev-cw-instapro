import { renderHeaderComponent } from "./header-component.js";
import { renderUploadImageComponent } from "./upload-image-component.js";

export function renderAddPostPageComponent({ appEl, onAddPostClick, user }) {
  let imageUrl;
  const render = () => {
    const appHtml = `
 <div class="page-container">
        <div class="header-container"></div>
         <div class="form">
         <h3 class="form-title">Добавление новго поста</h3>
          <div class="form-inputs">
           <div class="upload-image-container"></div>
           <input type="text" id="desc-input" class="input" placeholder="Описание поста" />
           <div class="form-error"></div>
           </div>
        <button class="button" id="add-button">Добавить</button>
      </div>
    `;

    appEl.innerHTML = appHtml;

     /**
     * Устанавливает сообщение об ошибке в форме.
     * @param {string} message - Текст сообщения об ошибке.
     */
     const setError = (message) => {
      appEl.querySelector(".form-error").textContent = message;
    };

    renderHeaderComponent({
      element: appEl.querySelector(".header-container"),
      user,
    });

    renderUploadImageComponent({
      element: appEl.querySelector(".upload-image-container"),
      onImageUrlChange(newImageUrl) {
        imageUrl = newImageUrl;
      },
    });

    document.getElementById("add-button").addEventListener("click", () => {
      if (!imageUrl) {
        setError("Добавьте картинку");
        return;
      }

      const description = document.getElementById("desc-input").value;
      if (!description) {
        setError("Введите описание картинки");
        return;
      }

      onAddPostClick({
        description,
        imageUrl,
      });
    });
  };

  render();
}
