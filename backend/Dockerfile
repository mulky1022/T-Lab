FROM php:8.4-apache

# Install system dependencies and PHP extensions
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        git \
        unzip \
        libpng-dev \
        libonig-dev \
        libxml2-dev \
        libzip-dev \
        libpq-dev \
        zip \
        curl \
    && docker-php-ext-install pdo pdo_pgsql pgsql bcmath ctype fileinfo mbstring xml zip opcache \
    && a2enmod rewrite headers remoteip

# Install Composer
COPY --from=composer:2.10 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Update Apache DocumentRoot to point to Laravel public directory
ENV APACHE_DOCUMENT_ROOT=/var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf
RUN sed -ri -e 's!/var/www/!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf

# Configure Apache to listen on dynamic PORT (fallback to 80)
RUN sed -i 's/Listen 80/Listen ${PORT:-80}/g' /etc/apache2/ports.conf
RUN sed -i 's/:80/:${PORT:-80}/g' /etc/apache2/sites-available/000-default.conf

# Copy application files and install dependencies
COPY composer.json composer.lock ./
RUN composer install --no-dev --optimize-autoloader --no-interaction --no-scripts

COPY . ./

# Ensure storage and bootstrap cache permissions
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache && \
    chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

# Build frontend assets for Laravel Vite integration if present
WORKDIR /var/www/html
RUN if [ -f "package.json" ]; then \
        apt-get install -y --no-install-recommends nodejs npm && \
        npm install && npm run build; \
    fi

# Expose the default Apache port
EXPOSE 80

# Set environment variables for production
ENV APP_ENV=production
ENV APP_DEBUG=false
ENV LOG_CHANNEL=stack
ENV SESSION_DRIVER=database

# Run Laravel optimization and start Apache
CMD ["bash", "-lc", "composer dump-autoload --optimize && php artisan config:cache && php artisan route:cache && php artisan view:cache && apache2-foreground"]
