#!/bin/bash

# ============================================================================
# Скрипт деплоя приложения sgiprealestate.com
# Вызывает deploy-smart.sh на прод сервере через nginx-microservice
# Запускается непосредственно на прод сервере
# ============================================================================

set -e

# Конфигурация
SERVICE_NAME="${SERVICE_NAME:-sgiprealestate-service}"
NGINX_MICROSERVICE_PATH="${NGINX_MICROSERVICE_PATH:-/home/alfares/nginx-microservice}"
DEPLOY_SCRIPT_PATH="$NGINX_MICROSERVICE_PATH/scripts/blue-green/deploy-smart.sh"

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функция для вывода сообщений
info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

# Проверка аргументов
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    echo "Использование: ./deploy.sh [SERVICE_NAME]"
    echo ""
    echo "Параметры:"
    echo "  SERVICE_NAME    Имя сервиса для деплоя (по умолчанию: sgiprealestate-service)"
    echo ""
    echo "Переменные окружения:"
    echo "  SERVICE_NAME            Имя сервиса (имеет приоритет над аргументом)"
    echo "  NGINX_MICROSERVICE_PATH Путь к nginx-microservice (по умолчанию: /home/alfares/nginx-microservice)"
    echo ""
    echo "Примеры:"
    echo "  ./deploy.sh"
    echo "  ./deploy.sh sgiprealestate-service"
    echo "  SERVICE_NAME=my-service ./deploy.sh"
    exit 0
fi

# Если передан аргумент, использовать его как имя сервиса
# (переменная окружения имеет приоритет, поэтому проверяем её первой)
if [ -n "$1" ] && [ -z "${SERVICE_NAME}" ]; then
    SERVICE_NAME="$1"
fi

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║              🚀 ДЕПЛОЙ ПРИЛОЖЕНИЯ                            ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
info "Сервис: $SERVICE_NAME"
info "Скрипт деплоя: $DEPLOY_SCRIPT_PATH"
echo ""

# Проверка доступа к директории nginx-microservice
info "Проверка доступа к nginx-microservice..."
if [ ! -r "$NGINX_MICROSERVICE_PATH" ] 2>/dev/null; then
    error "Нет доступа к директории: $NGINX_MICROSERVICE_PATH"
    echo ""
    warning "Проблема с правами доступа. Возможные причины:"
    echo "  1. Родительская директория /home/alfares имеет права drwxr-x---"
    echo "  2. Не установлены права на nginx-microservice"
    echo ""
    info "Для решения выполните на сервере:"
    echo ""
    echo "  # Если /home/alfares блокирует доступ:"
    echo "  sudo chgrp deployers /home/alfares"
    echo "  sudo chmod 775 /home/alfares"
    echo ""
    echo "  # Настройка прав на nginx-microservice:"
    echo "  sudo chgrp -R deployers $NGINX_MICROSERVICE_PATH"
    echo "  sudo chmod -R 775 $NGINX_MICROSERVICE_PATH"
    echo "  sudo chmod g+s $NGINX_MICROSERVICE_PATH"
    echo ""
    info "После настройки перелогиньтесь: exit && ssh alfares"
    exit 1
fi
success "Доступ к директории есть"

# Проверка существования скрипта деплоя
info "Проверка наличия скрипта деплоя..."
if [ ! -f "$DEPLOY_SCRIPT_PATH" ]; then
    error "Скрипт деплоя не найден: $DEPLOY_SCRIPT_PATH"
    error "Убедитесь, что nginx-microservice установлен и настроен"
    echo ""
    info "Проверьте путь или укажите через переменную окружения:"
    echo "  NGINX_MICROSERVICE_PATH=/path/to/nginx-microservice ./scripts/deploy.sh"
    exit 1
fi
success "Скрипт деплоя найден"

# Проверка прав на выполнение
info "Проверка прав на выполнение..."
if [ ! -x "$DEPLOY_SCRIPT_PATH" ]; then
    warning "Скрипт не имеет прав на выполнение, пытаемся исправить..."
    if chmod +x "$DEPLOY_SCRIPT_PATH" 2>/dev/null; then
        success "Права на выполнение установлены"
    else
        error "Не удалось установить права на выполнение"
        error "Нужна настройка группы deployers (см. инструкцию выше)"
        exit 1
    fi
else
    success "Права на выполнение установлены"
fi

# Загрузка конфигурации nginx из nginx.config.json (если существует)
NGINX_CONFIG_FILE="$(dirname "$0")/../nginx.config.json"
CLIENT_MAX_BODY_SIZE="10G" # Значение по умолчанию

if [ -f "$NGINX_CONFIG_FILE" ]; then
    info "Загрузка конфигурации nginx из nginx.config.json..."
    # Извлекаем client_max_body_size из JSON (требует jq или используем простой парсинг)
    if command -v jq >/dev/null 2>&1; then
        CLIENT_MAX_BODY_SIZE=$(jq -r '.nginx.client_max_body_size // "10G"' "$NGINX_CONFIG_FILE" 2>/dev/null || echo "10G")
    else
        # Простой парсинг без jq
        CLIENT_MAX_BODY_SIZE=$(grep -o '"client_max_body_size"[[:space:]]*:[[:space:]]*"[^"]*"' "$NGINX_CONFIG_FILE" 2>/dev/null | sed 's/.*"\([^"]*\)".*/\1/' || echo "10G")
    fi
    success "client_max_body_size установлен: $CLIENT_MAX_BODY_SIZE"
else
    warning "Файл nginx.config.json не найден, используется значение по умолчанию: $CLIENT_MAX_BODY_SIZE"
fi

echo ""
info "Запуск деплоя..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Выполнение деплоя
cd "$NGINX_MICROSERVICE_PATH/scripts/blue-green"
./deploy-smart.sh "$SERVICE_NAME"

DEPLOY_EXIT_CODE=$?

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $DEPLOY_EXIT_CODE -eq 0 ]; then
    success "Деплой успешно завершен!"
    echo ""
    
    # Применение конфигурации nginx (client_max_body_size)
    info "Применение конфигурации nginx (client_max_body_size: $CLIENT_MAX_BODY_SIZE)..."
    NGINX_CONF_DIR="$NGINX_MICROSERVICE_PATH/nginx/conf.d/blue-green"
    
    # Обновляем конфигурационные файлы для blue и green
    for conf_file in "$NGINX_CONF_DIR"/*.conf; do
        if [ -f "$conf_file" ] && grep -q "sgiprealestate" "$conf_file" 2>/dev/null; then
            # Проверяем, есть ли уже client_max_body_size в server блоке
            if ! grep -q "client_max_body_size" "$conf_file" 2>/dev/null; then
                # Добавляем client_max_body_size в HTTPS server блок после ssl_certificate_key
                if grep -q "ssl_certificate_key" "$conf_file" 2>/dev/null; then
                    sed -i "/ssl_certificate_key/a\\    client_max_body_size $CLIENT_MAX_BODY_SIZE;" "$conf_file"
                    success "Добавлен client_max_body_size в $(basename "$conf_file")"
                fi
            else
                # Обновляем существующее значение
                sed -i "s/client_max_body_size[[:space:]]*[^;]*;/client_max_body_size $CLIENT_MAX_BODY_SIZE;/" "$conf_file"
                success "Обновлен client_max_body_size в $(basename "$conf_file")"
            fi
        fi
    done
    
    # Перезагрузка nginx для применения изменений
    info "Перезагрузка nginx..."
    if docker exec nginx-microservice nginx -t >/dev/null 2>&1; then
        if docker exec nginx-microservice nginx -s reload >/dev/null 2>&1; then
            success "Nginx успешно перезагружен"
        else
            warning "Не удалось перезагрузить nginx (возможно, контейнер не запущен)"
        fi
    else
        warning "Конфигурация nginx содержит ошибки, перезагрузка пропущена"
    fi
    
    echo ""
    info "Проверьте статус сервиса:"
    echo "   docker ps | grep $SERVICE_NAME"
else
    error "Деплой завершился с ошибкой (код: $DEPLOY_EXIT_CODE)"
    echo ""
    warning "Проверьте логи на сервере для деталей"
    exit $DEPLOY_EXIT_CODE
fi
