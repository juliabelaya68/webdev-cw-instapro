import { renderHeaderComponent } from "./header-component.js";
import { renderUploadImageComponent } from "./upload-image-component.js";
import { registerUser, loginUser } from "../api.js";

/**
 * Функция для экранирования HTML-символов.
 * @param {string} unsafe - Небезопасная строка.
 * @returns {string} - Безопасная строка с экранированными символами.
 */
function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Функция для удаления HTML-тегов из строки.
 * @param {string} unsafe - Строка, которая может содержать HTML-теги.
 * @returns {string} - Строка без HTML-тегов.
 */
function stripTags(unsafe) {
  return unsafe.replace(/<[^>]*>/g, ""); // Удаляем все HTML-теги
}

/**
 * Компонент страницы авторизации.
 * Этот компонент предоставляет пользователю интерфейс для входа в систему или регистрации.
 *
 * @param {HTMLElement} params.appEl - Корневой элемент приложения, в который будет рендериться страница.
 * @param {Function} params.setUser - Функция, вызываемая при успешной авторизации или регистрации.
 *                                    Принимает объект пользователя в качестве аргумента.
 */
export function renderAuthPageComponent({ appEl, setUser }) {
  let isLoginMode = true; // Режим формы: вход или регистрация
  let imageUrl = ""; // URL загруженного изображения

  /**
   * Рендерит форму авторизации или регистрации.
   */
  const renderForm = () => {
    const appHtml = `
      <div class="page-container">
          <div class="header-container"></div>
          <div class="form">
              <h3 class="form-title">
                ${
                  isLoginMode
                    ? "Вход в&nbsp;Instapro"
                    : "Регистрация в&nbsp;Instapro"
                }
              </h3>
              <div class="form-inputs">
                  ${
                    !isLoginMode
                      ? `
                      <div class="upload-image-container"></div>
                      <input type="text" id="name-input" class="input" placeholder="Имя" />
                      `
                      : ""
                  }
                  <input type="text" id="login-input" class="input" placeholder="Логин" />
                  <input type="password" id="password-input" class="input" placeholder="Пароль" />
                  <div class="form-error"></div>
                  <button class="button" id="login-button">${
                    isLoginMode ? "Войти" : "Зарегистрироваться"
                  }</button>
              </div>
              <div class="form-footer">
                <p class="form-footer-title">
                  ${isLoginMode ? "Нет аккаунта?" : "Уже есть аккаунт?"}
                  <button class="link-button" id="toggle-button">
                    ${isLoginMode ? "Зарегистрироваться." : "Войти."}
                  </button>
                </p>
              </div>
          </div>
      </div>    
    `;
    appEl.innerHTML = appHtml;

    /**
     * Устанавливает сообщение об ошибке в форме.
     * @param {string} message - Текст сообщения об ошибке.
     */
    const setError = (message) => {
      const escapedMessage = escapeHtml(message); // Экранируем сообщение
      appEl.querySelector(".form-error").textContent = escapedMessage;
    };

    // Рендерим заголовок страницы
    renderHeaderComponent({
      element: document.querySelector(".header-container"),
    });

    // Если режим регистрации, рендерим компонент загрузки изображения
    const uploadImageContainer = appEl.querySelector(".upload-image-container");
    if (uploadImageContainer) {
      renderUploadImageComponent({
        element: uploadImageContainer,
        onImageUrlChange(newImageUrl) {
          imageUrl = newImageUrl;
        },
      });
    }

    // Обработка клика на кнопку входа/регистрации
    document.getElementById("login-button").addEventListener("click", () => {
      setError(""); // Очищаем предыдущие ошибки

      if (isLoginMode) {
        // Обработка входа
        const login = document.getElementById("login-input").value;
        const password = document.getElementById("password-input").value;

        if (!login) {
          alert("Введите логин");
          return;
        }
        if (!password) {
          alert("Введите пароль");
          return;
        }

        // Отправляем данные на сервер
        loginUser({ login, password })
          .then((user) => {
            setUser(user.user);
          })
          .catch((error) => {
            console.warn(error);
            setError(error.message); // Устанавливаем ошибку с экранированием
          });
      } else {
        // Обработка регистрации
        const login = stripTags(document.getElementById("login-input").value); // Удаляем теги
        const name = stripTags(document.getElementById("name-input").value); // Удаляем теги
        const password = stripTags(document.getElementById("password-input").value); // Удаляем теги

        if (!name) {
          alert("Введите имя");
          return;
        }
        if (!login) {
          alert("Введите логин");
          return;
        }
        if (!password) {
          alert("Введите пароль");
          return;
        }
        if (!imageUrl) {
          alert("Не выбрана фотография");
          return;
        }

        // Отправляем данные на сервер
        registerUser({ login, password, name, imageUrl })
          .then((user) => {
            setUser(user.user);
          })
          .catch(async (err) => {
            const { error } = await err;
            console.warn(error);
            setError(error); // Устанавливаем ошибку с экранированием
          });
      }
    });

    // Обработка переключения режима (вход ↔ регистрация)
    document.getElementById("toggle-button").addEventListener("click", () => {
      isLoginMode = !isLoginMode;
      renderForm(); // Перерисовываем форму с новым режимом
    });
  };

  // Инициализация формы
  renderForm();
}
