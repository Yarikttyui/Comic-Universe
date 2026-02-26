# Comic Universe

Платформа для создания и чтения интерактивных комиксов с разветвлённым сюжетом.  
Читатель делает выборы, которые влияют на развитие истории и определяют концовку.

---

## Возможности

- Чтение комиксов с выбором действий и несколькими концовками
- Визуальный редактор для создателей
- Библиотека с фильтрацией по жанрам, размеру, рейтингу
- Админ-панель: модерация комиксов, жалобы, заявки, управление пользователями
- Загрузка APK и Desktop-приложения через сайт

---

## Стек технологий

### Backend
- Node.js + TypeScript
- Express.js
- MySQL 8.0
- JWT
- Socket.IO

### Web
- React 18 + TypeScript
- Axios


### Android
- Kotlin
- Jetpack Compose + Material 3

### Desktop
- Electron 28
- electron-builder

### Инфраструктура
- Docker Compose
- Nginx (reverse proxy + HTTPS)
- Let's Encrypt (certbot)

---

## Запуск (разработка)

```bash
# Установка зависимостей
npm install

# Backend + Web одновременно
npm run dev

# Только backend
npm run backend

# Только web
npm run web
```


## Docker

# Полный запуск

docker compose up --build


