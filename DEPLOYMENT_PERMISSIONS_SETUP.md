# Настройка прав доступа для совместного деплоя

## Текущая ситуация

- **Пользователь alfares**: владелец nginx-microservice в `/home/alfares/nginx-microservice`
- **Пользователь belunga**: нужен доступ к скриптам деплоя
- **Проблема**: директория `/home/alfares` имеет права `drwxr-x---` (только владелец может читать)
- **Оба пользователя** уже в группе `docker` (988)

## Решение: Создание общей группы для деплоя

### Вариант 1: Общая группа `deployers` (РЕКОМЕНДУЕТСЯ)

Этот вариант позволяет обоим пользователям деплоить свои приложения через общий nginx-microservice.

#### Шаги настройки (выполнить от пользователя с sudo правами):

```bash
# 1. Создать общую группу для деплоя
sudo groupadd deployers

# 2. Добавить обоих пользователей в группу
sudo usermod -a -G deployers alfares
sudo usermod -a -G deployers belunga

# 3. Изменить группу директории nginx-microservice
sudo chgrp -R deployers /home/alfares/nginx-microservice

# 4. Установить права на директорию (владелец и группа могут читать/писать/выполнять)
sudo chmod -R 775 /home/alfares/nginx-microservice

# 5. Установить SGID бит на директорию (новые файлы будут создаваться с группой deployers)
sudo chmod g+s /home/alfares/nginx-microservice

# 6. Убедиться, что скрипты исполняемые
sudo chmod +x /home/alfares/nginx-microservice/scripts/blue-green/deploy-smart.sh
```

#### После настройки:

Оба пользователя должны **перелогиниться** (или выполнить `newgrp deployers`) чтобы изменения вступили в силу.

### Вариант 2: Использование существующей группы `docker`

Если не хотите создавать новую группу, можно использовать группу `docker`:

```bash
# 1. Изменить группу директории nginx-microservice на docker
sudo chgrp -R docker /home/alfares/nginx-microservice

# 2. Установить права (группа docker может читать/выполнять)
sudo chmod -R 775 /home/alfares/nginx-microservice

# 3. Установить SGID бит
sudo chmod g+s /home/alfares/nginx-microservice

# 4. Убедиться, что скрипты исполняемые
sudo chmod +x /home/alfares/nginx-microservice/scripts/blue-green/deploy-smart.sh
```

**Недостаток**: группа docker обычно используется для доступа к Docker socket, смешивание может быть небезопасно.

### Вариант 3: Символическая ссылка в общей директории

Создать общую директорию для деплоя скриптов:

```bash
# 1. Создать общую директорию
sudo mkdir -p /opt/deploy-scripts
sudo chown alfares:deployers /opt/deploy-scripts
sudo chmod 775 /opt/deploy-scripts

# 2. Создать символическую ссылку на скрипты
sudo ln -s /home/alfares/nginx-microservice/scripts /opt/deploy-scripts/nginx-microservice

# 3. Теперь belunga может использовать:
# /opt/deploy-scripts/nginx-microservice/blue-green/deploy-smart.sh
```

## Проверка настройки

После выполнения шагов, проверить можно так:

```bash
# От пользователя belunga:
ssh alfares
groups  # должен видеть deployers (или docker)
ls -la /home/alfares/nginx-microservice/scripts/blue-green/deploy-smart.sh
# Должен видеть файл и права должны быть -rwxr-xr-x или -rwxrwxr-x
```

## Использование скрипта деплоя

После настройки прав, пользователь belunga может деплоить так:

```bash
ssh alfares
cd /home/alfares/nginx-microservice/scripts/blue-green
./deploy-smart.sh sgiprealestate-service
```

Или если используется симлинк из варианта 3:

```bash
ssh alfares
/opt/deploy-scripts/nginx-microservice/blue-green/deploy-smart.sh sgiprealestate-service
```

## Безопасность

- ✅ Оба пользователя уже в группе docker (могут управлять контейнерами)
- ✅ Общая группа deployers позволит только читать/выполнять скрипты nginx-microservice
- ✅ Docker и nginx остаются общими (как и требовалось)
- ⚠️  Убедитесь, что скрипты деплоя не содержат чувствительных данных (пароли, ключи)

## Автоматическая настройка (скрипт)

Для автоматической настройки можно использовать скрипт `setup-deploy-permissions.sh`:

```bash
# 1. Скопировать скрипт на сервер
scp setup-deploy-permissions.sh alfares:/tmp/

# 2. Подключиться к серверу
ssh alfares

# 3. Выполнить скрипт с sudo правами
sudo /tmp/setup-deploy-permissions.sh
```

Скрипт автоматически:
- Создаст группу `deployers` (если не существует)
- Добавит пользователей `alfares` и `belunga` в группу
- Настроит права на директорию nginx-microservice
- Установит права на исполнение для всех скриптов

## Рекомендация

**Использовать Вариант 1** (группа `deployers`) - это наиболее чистое и безопасное решение, которое:
- Разделяет права доступа к Docker и права доступа к скриптам деплоя
- Позволяет легко добавлять новых пользователей в будущем
- Соответствует принципу минимальных привилегий

**Для быстрой настройки используйте скрипт `setup-deploy-permissions.sh`**

