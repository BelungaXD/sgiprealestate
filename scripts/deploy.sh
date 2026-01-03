#!/bin/bash

# ============================================================================
# Скрипт деплоя приложения sgiprealestate.com
# Вызывает deploy-smart.sh на прод сервере через nginx-microservice
# Запускается непосредственно на прод сервере
# ============================================================================

set -e

# Конфигурация
SERVICE_NAME="${SERVICE_NAME:-sgiprealestate-service}"
NGINX_MICROSERVICE_PATH="/home/alfares/nginx-microservice"
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
    echo "  SERVICE_NAME    Имя сервиса (имеет приоритет над аргументом)"
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

# Проверка существования скрипта деплоя
info "Проверка наличия скрипта деплоя..."
if [ ! -f "$DEPLOY_SCRIPT_PATH" ]; then
    error "Скрипт деплоя не найден: $DEPLOY_SCRIPT_PATH"
    error "Убедитесь, что nginx-microservice установлен и настроен"
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
        error "Возможно, нужны права sudo или настройка группы deployers"
        exit 1
    fi
else
    success "Права на выполнение установлены"
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
    info "Проверьте статус сервиса:"
    echo "   docker ps | grep $SERVICE_NAME"
else
    error "Деплой завершился с ошибкой (код: $DEPLOY_EXIT_CODE)"
    echo ""
    warning "Проверьте логи на сервере для деталей"
    exit $DEPLOY_EXIT_CODE
fi
