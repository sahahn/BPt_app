FROM ubuntu:18.04
ARG DEBIAN_FRONTEND=noninteractive

RUN apt-get update -qq && apt-get install -yq --no-install-recommends  \
    apache2 \
    apache2-utils \
    git \
    python3.7 \
    python3-pip \
    php7.2 \
    php7.2-curl \
    php7.2-mbstring \
    libapache2-mod-php7.2 \
    && apt-get clean \
    && git clone https://github.com/sahahn/BPt.git /var/www/html/BPt \
    && git clone https://github.com/sahahn/ABCD_ML.git /var/www/html/ABCD_ML \
    && pip3 install /var/www/html/ABCD_ML/ \
    && sed -i '/post_max_size = 8M/cpost_max_size = 5000M' /etc/php/7.2/apache2/php.ini \
    && sed -i '/memory_limit = 128M/cmemory_limit = 1024M' /etc/php/7.2/apache2/php.ini \
    && sed -i '/; max_input_vars = 1000/cmax_input_vars = 100000' /etc/php/7.2/apache2/php.ini \

EXPOSE 80
CMD ["apache2ctl", "-D", "FOREGROUND"]