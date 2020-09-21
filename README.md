# Welcome to the Brain Predictability toolbox (BPt) Web Interface.

## **Intro**
This project is designed to be an easy to use user interface for performing neuroimaging based machine learning (ML) experiments. 

This is an early beta release version, so please be mindful that their will likely be some rough edges. Please open an issue with any errors that comes up!

The main python library (that serves as a backend for this application) can be found at: https://github.com/sahahn/BPt.

## **Installation**
---------------------

As it currently stands, BPt_app is designed to be created and run in a docker container. Please follow the below instructions:

1. Make sure you have docker installed on your device. See: https://docs.docker.com/get-docker/

2. Secondly, we make use of docker-compose to make the installation process overall more painless. On some systems with will already be installed with docker, but on others you may need to perform additional steps to download it, see: https://docs.docker.com/compose/install/
   
3. Next, you will clone this repository to your local device. On unix based systems, the command is as follows:

   <pre><code>git clone https://github.com/sahahn/BPt_app.git</code></pre>

4. An essential step to using to using the application is the ability to have the application access your datasets of interest. Importantly, adding datasets can be done either before installation or after.
   
   1. Datasets are saved within BPt_app in the folder 'BPt_app/data/sources'
   
   2. Datasets must be compatible with BPt, this requires the user to format the dataset accordingly, before adding it to the sources directory. Specifically, datasets are comprised of a folder (where the name of the folder is name of the dataset), and within that folder 1 or more csv files with the datasets data. For example:

    <pre><code>
    BPt_app/data/sources/my_dataset/
    BPt_app/data/sources/my_dataset/data1.csv
    BPt_app/data/sources/my_dataset/data2.csv
    BPt_app/data/sources/my_dataset/data3.csv
    </code></pre>

   3. Each file with data (data1.csv, data2.csv data3.csv above) must also be formatted in a specific way. Specifically- all data files must be comma seperated and contain only one header row with the name of each feature (or an index name / eventname - described in the next steps). For example (where note the \n character is ussually hidden in most text editors):

    <pre><code>
    subject_id,feat1,feat2,feat3\n
    a,1.4,9,1.22\n
    b,1.3,9,0.8\n
    c,2,10,1.9\n
    </code></pre>

   4. Each file must have a column with a stored subject id. Valid names for this subject id column are currently: 
    ['subject_id', 'participant_id', 'src_subject_id', 'subject', 'id', 'sbj', 'sbj_id', 'subjectkey', 'ID', 'UID', 'GUID']
    As long as a column is included and saved under one of those names, then that column will be used iternally as the subject id. In the example above, 'subject_id' is used as the subject id column.

   5. Next, each data file can optionally be stored with a valid 'event name' column. This column should be stored in the same way as the subject id column, and is used in cases where the underlying dataset is for example longitudinal or any case where a feature contains multiple values for the same subject. Valid column names for this are currently:
   ['eventname', 'event', 'events', 'session_id', 'session', 'time_point', 'event_name', 'event name']
   Within BPt_app, this column lets you filter data by a specific eventname value.

   1. A few general notes about adding data to BPt:
      - You may add multiple datasets, just with different folder names
      - Data will be processed by BPt upon launch of the web application, this means that if you add a new dataset once the application has already been launched initially, that dataset will be processed upon the next launch of the application. Re-loading the web page can trigger the app to look for changes to the backend data.
      - If a feature / column overlaps across different data sources, e.g., data1.csv, data2.csv, then that feature will be merged across all data files, and saved in a new file. Merge behavior is if new values are found (as indexed by subject id and eventname overlap) they are simply added. If overlapped values are found, the newer value for that subject_id / eventname pair will be used. 
      - You can change or delete data files or datasets at will, this will just prompt BPt to re-index that dataset and changes will be made accordingly. 

5. Now, to install the application, navigate within the main BPt_app folder/repository and run the docker compose command:
   
    <pre><code>docker-compose up</code></pre>

    This will take care of building the docker image and application. There are a number of different tweaks here that you can make as desired, some of these are listed below:
    - You may pass the flag "-d", so "docker-compose up -d", which will run the docker container in the background, otherwise the docker instance will be tied to your current terminal (and therefore shutdown if you close that terminal). See https://docs.docker.com/compose/reference/up/ for other simmilar options.
    - Before running docker-compose up, you can optionally modify the docker-compose.yml file. One perhaps useful modification is to change the value of restart: no, to restart: always what this will do is restart BPt_app whenever it goes down, e.g., when you restart your computer. Otherwise, you must start the container manually everytime you wish to use BPt_app after a restart.
    - You can use the command 'docker-compose start' from the BPt_app directory to restart the container
    - Likewise, you can use the command 'docker-compose stop' to stop the web app

6. After the container is running, navigate to http://localhost:8008/BPt_app/WebApp/index.php this is the web address of the app, and should bring you to the home page!


## **Once up and running**
----------------------------
The most useful commands to know once up and running are those used to start and stop the container (as mentioned above) with docker-compose, and also updating.
There are two main ways to update. A faster temporary update (where the update will persist across stopping and starting the docker container, e.g., docker-compose start and stop, but will be deleted if docker-compose down is ever called). To call this faster temporary update, naviagte to the BPt_app folder and run the command:

<pre><code>bash update.sh</code></pre>

If instead you would like to do a full and lasting update, this involves re-building the whole container. It will also call git pull on your main directory, looking for changes in the docker files. To run this full update, run within BPt_app:

<pre><code>bash full_update.sh</code></pre>

