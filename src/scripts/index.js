/*
  Файл index.js является точкой входа в наше приложение
  и только он должен содержать логику инициализации нашего приложения
  используя при этом импорты из других файлов

  Из index.js не допускается что то экспортировать
*/

import {
  getUserInfo,
  getCardList,
  setUserInfo,
  setUserAvatar,
  addNewCard,
  deleteCardFromServer,
  changeLikeCardStatus,
} from "./components/api.js";
import { createCardElement } from "./components/card.js";
import {
  openModalWindow,
  closeModalWindow,
  setCloseModalWindowEventListeners,
} from "./components/modal.js";
import { enableValidation, clearValidation } from "./components/validation.js";

const validationConfig = {
  formSelector: ".popup__form",
  inputSelector: ".popup__input",
  submitButtonSelector: ".popup__button",
  inactiveButtonClass: "popup__button_disabled",
  inputErrorClass: "popup__input_type_error",
  errorClass: "popup__error_visible",
};

const placesWrap = document.querySelector(".places__list");

const profileFormModalWindow = document.querySelector(".popup_type_edit");
const profileForm = profileFormModalWindow.querySelector(".popup__form");
const profileTitleInput = profileForm.querySelector(".popup__input_type_name");
const profileDescriptionInput = profileForm.querySelector(".popup__input_type_description");

const cardFormModalWindow = document.querySelector(".popup_type_new-card");
const cardForm = cardFormModalWindow.querySelector(".popup__form");
const cardNameInput = cardForm.querySelector(".popup__input_type_card-name");
const cardLinkInput = cardForm.querySelector(".popup__input_type_url");

const imageModalWindow = document.querySelector(".popup_type_image");
const imageElement = imageModalWindow.querySelector(".popup__image");
const imageCaption = imageModalWindow.querySelector(".popup__caption");

const cardInfoModalWindow = document.querySelector(".popup_type_info");
const cardInfoModalTitle = cardInfoModalWindow.querySelector(".popup__title");
const cardInfoModalInfoList = cardInfoModalWindow.querySelector(".popup__info");
const cardInfoModalText = cardInfoModalWindow.querySelector(".popup__text");
const cardInfoModalList = cardInfoModalWindow.querySelector(".popup__list");

const openProfileFormButton = document.querySelector(".profile__edit-button");
const openCardFormButton = document.querySelector(".profile__add-button");

const profileTitle = document.querySelector(".profile__title");
const profileDescription = document.querySelector(".profile__description");
const profileAvatar = document.querySelector(".profile__image");

const avatarFormModalWindow = document.querySelector(".popup_type_edit-avatar");
const avatarForm = avatarFormModalWindow.querySelector(".popup__form");
const avatarInput = avatarForm.querySelector(".popup__input_type_avatar");

const infoDefinitionTemplate = document.getElementById("popup-info-definition-template");
const infoUserPreviewTemplate = document.getElementById("popup-info-user-preview-template");

let userId = null;

const handlePreviewPicture = ({ name, link }) => {
  imageElement.src = link;
  imageElement.alt = name;
  imageCaption.textContent = name;
  openModalWindow(imageModalWindow);
};

const handleLikeClick = (likeButton, cardId, likeCountElement) => {
  const isLiked = likeButton.classList.contains("card__like-button_is-active");

  changeLikeCardStatus(cardId, isLiked)
    .then((updatedCard) => {
      likeButton.classList.toggle("card__like-button_is-active");
      if (likeCountElement) {
        likeCountElement.textContent = updatedCard.likes.length;
      }
    })
    .catch((err) => {
      console.error(err);
    });
};

const handleDeleteClick = (cardElement, cardId) => {
  deleteCardFromServer(cardId)
    .then(() => {
      cardElement.remove();
    })
    .catch((err) => {
      console.error(err);
    });
};

const formatDate = (date) => {
  return date.toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const createInfoString = (termText, descriptionText) => {
  const infoItem = infoDefinitionTemplate.content.cloneNode(true);
  const term = infoItem.querySelector(".popup__info-term");
  const description = infoItem.querySelector(".popup__info-description");

  term.textContent = termText;
  description.textContent = descriptionText;

  return infoItem;
};

const createUserPreview = (userName) => {
  const userPreview = infoUserPreviewTemplate.content.cloneNode(true);
  const badge = userPreview.querySelector(".popup__list-item");

  badge.textContent = userName;

  return userPreview;
};

const handleInfoClick = (cardId) => {
  getCardList()
    .then((cards) => {
      const cardData = cards.find((card) => card._id === cardId);

      if (!cardData) {
        return Promise.reject("Карточка не найдена");
      }

      cardInfoModalTitle.textContent = cardData.name;
      cardInfoModalInfoList.innerHTML = "";
      cardInfoModalList.innerHTML = "";

      cardInfoModalInfoList.append(
        createInfoString("Дата создания:", formatDate(new Date(cardData.createdAt)))
      );

      cardInfoModalInfoList.append(
        createInfoString("Автор:", cardData.owner.name)
      );

      cardInfoModalText.textContent = "Лайкнули:";

      if (cardData.likes.length === 0) {
        const emptyItem = document.createElement("li");
        emptyItem.classList.add("popup__list-item");
        emptyItem.textContent = "Пока никто";
        cardInfoModalList.append(emptyItem);
      } else {
        cardData.likes.forEach((user) => {
          cardInfoModalList.append(createUserPreview(user.name));
        });
      }

      openModalWindow(cardInfoModalWindow);
    })
    .catch((err) => {
      console.error(err);
    });
};

const handleProfileFormSubmit = (evt) => {
  evt.preventDefault();
  const submitButton = profileForm.querySelector(".popup__button");
  const originalText = submitButton.textContent;
  submitButton.textContent = "Сохранение...";

  setUserInfo({
    name: profileTitleInput.value,
    about: profileDescriptionInput.value,
  })
    .then((userData) => {
      profileTitle.textContent = userData.name;
      profileDescription.textContent = userData.about;
      closeModalWindow(profileFormModalWindow);
    })
    .catch((err) => {
      console.error(err);
    })
    .finally(() => {
      submitButton.textContent = originalText;
    });
};

const handleAvatarFormSubmit = (evt) => {
  evt.preventDefault();
  const submitButton = avatarForm.querySelector(".popup__button");
  const originalText = submitButton.textContent;
  submitButton.textContent = "Сохранение...";

  setUserAvatar(avatarInput.value)
    .then((userData) => {
      profileAvatar.style.backgroundImage = `url(${userData.avatar})`;
      closeModalWindow(avatarFormModalWindow);
      avatarForm.reset();
    })
    .catch((err) => {
      console.error(err);
    })
    .finally(() => {
      submitButton.textContent = originalText;
    });
};

const handleCardFormSubmit = (evt) => {
  evt.preventDefault();
  const submitButton = cardForm.querySelector(".popup__button");
  const originalText = submitButton.textContent;
  submitButton.textContent = "Создание...";

  addNewCard({
    name: cardNameInput.value,
    link: cardLinkInput.value,
  })
    .then((cardData) => {
      placesWrap.prepend(
        createCardElement(cardData, {
          onPreviewPicture: handlePreviewPicture,
          onLikeIcon: handleLikeClick,
          onDeleteCard: handleDeleteClick,
          onInfoClick: handleInfoClick,
          userId: userId,
        })
      );
      closeModalWindow(cardFormModalWindow);
      cardForm.reset();
    })
    .catch((err) => {
      console.error(err);
    })
    .finally(() => {
      submitButton.textContent = originalText;
    });
};

profileForm.addEventListener("submit", handleProfileFormSubmit);
cardForm.addEventListener("submit", handleCardFormSubmit);
avatarForm.addEventListener("submit", handleAvatarFormSubmit);

openProfileFormButton.addEventListener("click", () => {
  profileTitleInput.value = profileTitle.textContent;
  profileDescriptionInput.value = profileDescription.textContent;
  clearValidation(profileForm, validationConfig);
  openModalWindow(profileFormModalWindow);
});

profileAvatar.addEventListener("click", () => {
  avatarForm.reset();
  clearValidation(avatarForm, validationConfig);
  openModalWindow(avatarFormModalWindow);
});

openCardFormButton.addEventListener("click", () => {
  cardForm.reset();
  clearValidation(cardForm, validationConfig);
  openModalWindow(cardFormModalWindow);
});

const allPopups = document.querySelectorAll(".popup");
allPopups.forEach((popup) => {
  setCloseModalWindowEventListeners(popup);
});

enableValidation(validationConfig);

Promise.all([getCardList(), getUserInfo()])
  .then(([cards, userData]) => {
    userId = userData._id;

    profileTitle.textContent = userData.name;
    profileDescription.textContent = userData.about;
    profileAvatar.style.backgroundImage = `url(${userData.avatar})`;

    cards.forEach((card) => {
      placesWrap.append(
        createCardElement(card, {
          onPreviewPicture: handlePreviewPicture,
          onLikeIcon: handleLikeClick,
          onDeleteCard: handleDeleteClick,
          onInfoClick: handleInfoClick,
          userId: userId,
        })
      );
    });
  })
  .catch((err) => {
    console.error(err);
  });
