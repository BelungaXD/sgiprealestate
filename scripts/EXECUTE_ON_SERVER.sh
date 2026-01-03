#!/bin/bash

# ============================================================================
# КОМАНДЫ ДЛЯ ВЫПОЛНЕНИЯ НА ПРОД СЕРВЕРЕ
# Выполнить от пользователя с sudo правами (alfares или belunga)
# ============================================================================

# Шаг 1: Создать группу deployers
sudo groupadd deployers

# Шаг 2: Добавить пользователей в группу
sudo usermod -a -G deployers alfares
sudo usermod -a -G deployers belunga

# Шаг 3: Изменить группу директории nginx-microservice
sudo chgrp -R deployers /home/alfares/nginx-microservice

# Шаг 4: Установить права 775 (владелец и группа могут читать/писать/выполнять)
sudo chmod -R 775 /home/alfares/nginx-microservice

# Шаг 5: Установить SGID бит (новые файлы будут создаваться с группой deployers)
sudo chmod g+s /home/alfares/nginx-microservice

# Шаг 6: Убедиться, что все скрипты исполняемые
sudo find /home/alfares/nginx-microservice/scripts -type f -name "*.sh" -exec chmod +x {} \;

# Шаг 7: Проверить результат
echo "Проверка настроек:"
echo "Группа deployers:"
getent group deployers
echo ""
echo "Пользователи в группе:"
groups alfares
groups belunga
echo ""
echo "Права на директорию:"
ls -ld /home/alfares/nginx-microservice
echo ""
echo "Права на скрипт деплоя:"
ls -l /home/alfares/nginx-microservice/scripts/blue-green/deploy-smart.sh

echo ""
echo "✅ Настройка завершена!"
echo "⚠️  ВАЖНО: Оба пользователя (alfares и belunga) должны перелогиниться"
echo "   или выполнить: newgrp deployers"

