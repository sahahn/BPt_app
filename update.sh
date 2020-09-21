docker exec bpt bash -c ". /opt/conda/bin/activate \
&& conda init bash \
&& conda activate ML \
&& cd /var/www/html/BPt_app \
&& git pull \
&& cd ../ \
&& cd BPt \
&& git pull \
&& pip install . "
