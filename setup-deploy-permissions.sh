#!/bin/bash

# Скрипт для настройки прав доступа к nginx-microservice
# Требует выполнения с sudo правами
# Использование: sudo ./setup-deploy-permissions.sh

set -e

NGINX_MICROSERVICE_PATH="/home/alfares/nginx-microservice"
DEPLOY_GROUP="deployers"

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║     Настройка прав доступа для совместного деплоя           ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Проверка, что скрипт запущен с sudo
if [ "$EUID" -ne 0 ]; then
    echo "❌ Ошибка: Этот скрипт должен быть запущен с sudo правами"
    echo "   Использование: sudo ./setup-deploy-permissions.sh"
    exit 1
fi

# Проверка существования директории
if [ ! -d "$NGINX_MICROSERVICE_PATH" ]; then
    echo "❌ Ошибка: Директория $NGINX_MICROSERVICE_PATH не найдена"
    exit 1
fi

echo "📋 Шаг 1: Создание группы $DEPLOY_GROUP..."
if getent group "$DEPLOY_GROUP" > /dev/null 2>&1; then
    echo "   ✅ Группа $DEPLOY_GROUP уже существует"
else
    groupadd "$DEPLOY_GROUP"
    echo "   ✅ Группа $DEPLOY_GROUP создана"
fi

echo ""
echo "📋 Шаг 2: Добавление пользователей в группу $DEPLOY_GROUP..."
for user in alfares belunga; do
    if id "$user" &>/dev/null; then
        if groups "$user" | grep -q "\b$DEPLOY_GROUP\b"; then
            echo "   ✅ Пользователь $user уже в группе $DEPLOY_GROUP"
        else
            usermod -a -G "$DEPLOY_GROUP" "$user"
            echo "   ✅ Пользователь $user добавлен в группу $DEPLOY_GROUP"
        fi
    else
        echo "   ⚠️  Пользователь $user не найден, пропускаем"
    fi
done

echo ""
echo "📋 Шаг 3: Настройка прав на директорию nginx-microservice..."
chgrp -R "$DEPLOY_GROUP" "$NGINX_MICROSERVICE_PATH"
echo "   ✅ Группа директории изменена на $DEPLOY_GROUP"

chmod -R 775 "$NGINX_MICROSERVICE_PATH"
echo "   ✅ Права установлены на 775 (rwxrwxr-x)"

chmod g+s "$NGINX_MICROSERVICE_PATH"
echo "   ✅ SGID бит установлен (новые файлы будут с группой $DEPLOY_GROUP)"

echo ""
echo "📋 Шаг 4: Установка прав на исполнение для скриптов..."
find "$NGINX_MICROSERVICE_PATH/scripts" -type f -name "*.sh" -exec chmod +x {} \;
echo "   ✅ Все .sh скрипты сделаны исполняемыми"

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                    ✅ НАСТРОЙКА ЗАВЕРШЕНА                    ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "📝 Следующие шаги:"
echo "   1. Пользователи alfares и belunga должны перелогиниться"
echo "      или выполнить: newgrp $DEPLOY_GROUP"
echo ""
echo "   2. Проверить доступ можно командой:"
echo "      ls -la $NGINX_MICROSERVICE_PATH/scripts/blue-green/deploy-smart.sh"
echo ""
echo "   3. Использовать деплой:"
echo "      cd $NGINX_MICROSERVICE_PATH/scripts/blue-green"
echo "      ./deploy-smart.sh <service-name>"
echo ""

