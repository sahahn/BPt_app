# Welcome to the Brain Predictability toolbox (BPt) Web Interface.

## **Intro**
This project is designed to be an easy to use user interface for performing neuroimaging based machine learning (ML) experiments. 

This is an early beta release version, so please be mindful that their will likely be some rough edges. Please open an issue with any errors that comes up!

The main python library (that serves as a backend for this application) can be found at: https://github.com/sahahn/BPt.

## **Installation**
---------------

As it currently stands, BPt_app is designed to be created and run in a docker container. Please follow the below instructions:

1. Make sure you have docker installed on your device. See: https://docs.docker.com/get-docker/

2. Secondly, we make use of docker-compose to make the installation process overall more painless. On some systems with will already be installed with docker, but on others you may need to perform additional steps to download it, see: https://docs.docker.com/compose/install/
   
3. Next, you will clone this repository to your local device. On unix based systems, the command is as follows:

   <pre><code>git clone https://github.com/sahahn/BPt_app.git</code></pre>

4. An essential step to using to using the application is the ability to have the application access your datasets of interest. Importantly, adding datasets can be done either before installation or after - though the app will not function correctly if there are no datasets added, so it is reccomended to add atleast one now (before the rest of the installation).
   
   1. 

5. Now, to install the application, navigate within the main BPt_app folder/repository and run the docker compose command:
   
    <pre><code>docker-compose up</code></pre>

    This will build the docker image.



The above represents general instructions for how adding a dataset can currently be done. That said, there are a few other key points to keep in mind!

- All data source files must have a valid subject column. This column must be named one of ['subject_id', 'participant_id', 'src_subject_id', 'subject', 'id']. If it is not, then you should provide a mapping from whatever it is saved as to one of the valid names!
  
- Simmilarly, all data source files can have an optional eventname column. An eventname column is used in the case of longitudinal or multiple point studies where a specific subject has multiple values for a given measurement. If your data is not structured in this way, you can ignored this point. If it is, then you need to provide an 'eventname' column simmilarly to how you must provide a 'subject_id', where the eventname column must be named one of ['eventname', 'session_id']. If it is not, then you must either provide a "mapping" to one of those valid names, or the eventname will just be loaded in by default for every datapoint without a provided valid eventname column as None. 

- The database will be built with whatever data is in this data/sources/custom folder everytime the web application is launched. That said, once a file has been uploaded, it will be skipped upon every subsequent launch. This means that you can always go back and add new files even after the original database has been built. On the otherhand, if you make changes to the values in an already uploaded file, they will not be updated. Right now the only way to delete data from the database is to delete the whole database (which after constructed can be found at (data/bpt/db). 

- If a feature / column already exists within the database, it is updated as follows. If the new values contain any unique subject / eventname combinations, they will be added as new entries. If instead any overlapping subject / eventname data points are added, they will override the existing value. For example, if a data file was originally passed for feature 1, with subject x at eventname y and value z, but you upload a new datafile with the same feature 1, subject x and eventname y, but a different value, then the new value will override the previous one.

- The web app will not let you in until the first database, with atleast some data has been built. That said, if you add new data afterwards, it will be uploaded in the background, and therefore not be avaliable right away. 
