# Быстрая настройка прав для деплоя

> 📖 **См. также**: [INDEX.md](./INDEX.md) - Индекс всей документации

## Проблема

Пользователь `belunga` не может получить доступ к скриптам деплоя в `/home/alfares/nginx-microservice/scripts/blue-green/deploy-smart.sh` из-за прав доступа.

## Решение (выполнить на прод сервере)

### Вариант А: Автоматический (рекомендуется)

```bash
# 1. Скопировать скрипт на сервер
scp scripts/setup-deploy-permissions.sh alfares:/tmp/

# 2. Подключиться к серверу
ssh alfares

# 3. Выполнить с sudo
sudo /tmp/setup-deploy-permissions.sh

# 4. Перелогиниться (или выполнить newgrp deployers)
exit
ssh alfares
```

### Вариант Б: Вручную

```bash
ssh alfares
sudo groupadd deployers
sudo usermod -a -G deployers alfares
sudo usermod -a -G deployers belunga
sudo chgrp -R deployers /home/alfares/nginx-microservice
sudo chmod -R 775 /home/alfares/nginx-microservice
sudo chmod g+s /home/alfares/nginx-microservice
sudo chmod +x /home/alfares/nginx-microservice/scripts/blue-green/*.sh
```

После этого **перелогиниться** обоим пользователям.

## Проверка

```bash
# От пользователя belunga:
ssh alfares
groups  # должен видеть deployers
ls -la /home/alfares/nginx-microservice/scripts/blue-green/deploy-smart.sh
# Должен видеть файл с правами -rwxrwxr-x
```

## Использование

После настройки деплой выполняется так:

**Вариант 1 — из репозитория приложения (рекомендуется):**

```bash
ssh sgipreal   # или belunga@server1
cd ~/sgiprealestate   # или путь к клону приложения
git pull
./scripts/deploy.sh
```

**Вариант 2 — напрямую из nginx-microservice:**

```bash
ssh alfares
cd /home/alfares/nginx-microservice/scripts/blue-green
./deploy-smart.sh sgiprealestate
```

Имя сервиса для deploy-smart.sh — **sgiprealestate**. В `.env` приложения на проде должно быть **SERVICE_NAME=sgiprealestate** (не sgipreal.com), иначе при source .env скрипты деплоя подхватят домен вместо имени сервиса. Реестр создаётся как `service-registry/sgiprealestate.json`.

Подробная документация: [DEPLOYMENT_PERMISSIONS_SETUP.md](./DEPLOYMENT_PERMISSIONS_SETUP.md)
