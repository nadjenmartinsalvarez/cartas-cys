FROM php:8.2-cli

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
  unzip \
  libssl-dev \
  ca-certificates \
  && pecl install mongodb \
  && docker-php-ext-enable mongodb \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /var/www/html

COPY . .

RUN composer install --no-dev --no-interaction --prefer-dist --optimize-autoloader