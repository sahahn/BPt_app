FROM ubuntu:18.04
ARG DEBIAN_FRONTEND=noninteractive

RUN apt-get update -qq && apt-get install -yq --no-install-recommends  \
    apache2 \
    apache2-utils \
    ca-certificates \
    git \
    build-essential \
    php7.2 \
    php7.2-curl \
    php7.2-mbstring \
    libapache2-mod-php7.2 \
    add-apt-key \
    sudo \
    wget \
    && apt-get clean \
    cd /tmp/ && wget https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh \
    && sh Miniconda3-latest-Linux-x86_64.sh -b -p /opt/conda && . /opt/conda/bin/activate \
    && conda init bash && . ~/.bashrc && conda update -n base -c defaults conda -y \
    && conda create --name ML -y && conda activate ML && conda install pip \
    && git clone https://github.com/sahahn/BPt.git /var/www/html/BPt \
    && git clone https://github.com/sahahn/ABCD_ML.git /var/www/html/ABCD_ML \
    && pip install /var/www/html/ABCD_ML/ \
    && sed -i '/post_max_size = 8M/cpost_max_size = 5000M' /etc/php/7.2/apache2/php.ini \
    && sed -i '/memory_limit = 128M/cmemory_limit = 1024M' /etc/php/7.2/apache2/php.ini \
    && sed -i '/; max_input_vars = 1000/cmax_input_vars = 100000' /etc/php/7.2/apache2/php.ini


EXPOSE 80
ENTRYPOINT apache2ctl -D FOREGROUND \
&& conda activate ML \
&& python /var/www/html/BPt/WebApp/python/setup_info.py