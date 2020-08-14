# Welcome to the Brain Predictability toolbox (BPt) Web Interface.

## **Intro**
This project is designed to be an easy to use user interface for performing neuroimaging based machine learning (ML) experiments. 

This is an early beta release version, so please be mindful that their will likely be some rough edges. Please open an issue with any errors that comes up!

The main python library (that serves as a backend for this application) can be found at: https://github.com/sahahn/BPt.

## **Installation**
---------------

As it currently stands, BPt_app is designed to be created and run in a docker container. In the future we would like to provide an easier to use installation script, but for now please follow the below instructions.

1. Make sure you have docker installed on your device. See: https://docs.docker.com/get-docker/
   
2. The next step involves building the docker container for this application. All you need to do this, is the Dockerfile hosted at the top level of this repository. To get this file locally clone this repository, on unix based systems this command is:
   <pre><code>git clone https://github.com/sahahn/BPt_app.git</code></pre>

3. Next, navigate within the repository BPt_app and run:
   
    <pre><code>docker build . -t bpt</code></pre>

    This will build the docker image.

4. Once this completes, you need to build the docker image:
    <pre><code>docker run -d --name bpt -p 8008:80 -v `pwd`/data:/var/www/html/data bpt</code></pre>
    One flexible part of this command is the 8008 part, this is the port number on your machine that you will access the app through. If for whatever reason this port is already taken, you can just change to this another port.

5. The other portion that the last command does is sets the 'data' folder within BPt_app as a shared volume (essentially storage which the app via docker can access and which you can access). This is the folder where data should be placed. See the following section for a tutorial on how to add data.


## **Adding Data**
---------------
An essential step to using to using the application is the ability to have the application access your data. This section will cover how you can go about adding data in the correct format such that BPt can read it into an internal database. (In the future we hope to support a broader range of loading compatibility, especially with non-tabular data!). For now though, we support the following format for adding in tabular data sources. 

1. Locate the data directory within the BPt_app main directory (as cloned from this github). Within the data directory, there should be a folder called 'sources'. Lastly, ythere should be
   a further directory called 'custom', navigate within that one (full path data/sources/custom/). 
   
2. The way this custom folder works is as follows. New datasets, where in this sense a dataset is defined just as any collection of tabular-csv style data that should be loaded with the same parameters, should be added as a folder. This folder can be called whatever you want. For example, lets say we create a folder called dataset1. Then inside dataset1, lets say we have 3 csv's with the data we would like to upload. The directory structure would look like this:
    - data/sources/custom/dataset1/
    - data/sources/custom/dataset1/data1.csv
    - data/sources/custom/dataset1/data2.csv
    - data/sources/custom/dataset1/data3.csv

3. We are not quite done, there are a few more considerations to make. By default, BPt_app will try to load each csv with the python pandas library read_csv function (see: https://pandas.pydata.org/pandas-docs/stable/reference/api/pandas.read_csv.html). That means that the files are assumed to be comma seperated in addition to other preset values. In the likely case that you would like to load in your dataset with different parameters, a json specification file should be created at the same directory level as your main dataset folder. Importantly, it must have the same name as the folder, but just with .json appeneded. What this looks like according to our previous example is:
   - data/sources/custom/dataset1.json

    An empty version of this config file is shown below.

    <pre><code>{
        "load_params": {},
        "ignore_cols": [],
        "mapping": {}
    }</code></pre>
    

4. The first parameter above, load_params, allows you to pass in any of the arguments from the pandas read csv function (https://pandas.pydata.org/pandas-docs/stable/reference/api/pandas.read_csv.html). For example, if we wanted to change it to loading all of our dataset files within dataset1 to tab seperated, and also we wanted to add MISSING as a NaN value, we would change load_params to:
    
    <pre><code>{
        "load_params": {"sep": "\t", "na_values": "MISSING"},
        "ignore_cols": [],
        "mapping": {}
    } </code></pre>
    
    As mentioned before, load_params can take any of the valid arguments from the pandas function.

5. The second parameter, ignore_cols, allows us to pass in columns which should not be loaded into the backend database. For example, lets say there is a column in all of our data csvs called 'data', and another called 'col6' that we want to ignore. We would change ignore cols to:
    
    <pre><code>{
        "load_params": {"sep": "\t", "na_values": "MISSING"},
        "ignore_cols": ["date", "col6"],
        "mapping": {}
    }</code></pre>
    
    These columns will then be skipped if they appear in any of the data sources.

6. The last parameter, mapping, is used to provide an optional name mapping between the saved named of a column, and the name that column should be loaded internally into BPt as (the way you will access it via the app!). This parameter will likely be useful if you need to change the name of the unique subject id to one that BPt recognizes. Specifically: all data needs a subject id, which must be a column named one of ['subject_id', 'participant_id', 'src_subject_id', 'subject', 'id']. This means that if for example the index / subject column in our data to load is called day 'src_id', we will need to pass a name mapping. This can be done as:

    <pre><code>{
        "load_params": {"sep": "\t", "na_values": "MISSING"},
        "ignore_cols": ["date", "col6"],
        "mapping": {"src_id": "subject_id"}
    }</code></pre>
    

    Multiple values can be passed here. Another option as well, which may be helpful if your mapping is especially large, is to pass instead the name of a saved json mapping file (at the same directory level as this config json). For example, lets say we save a file called mapping.json (data/sources/custom/mapping.json) with something like:
    
    <pre><code>{
        "column1": "col1",
        "column2": "col2",
        "src_id": "subject_id",
    }</code></pre>
   
    We can then change "mapping" to:


    <pre><code>{
        "load_params": {"sep": "\t", "na_values": "MISSING"},
        "ignore_cols": ["date", "col6"],
        "mapping": "mapping.json"
    }</code></pre>


-----

The above represents general instructions for how adding a dataset can currently be done. That said, there are a few other key points to keep in mind!

- All data source files must have a valid subject column. This column must be named one of ['subject_id', 'participant_id', 'src_subject_id', 'subject', 'id']. If it is not, then you should provide a mapping from whatever it is saved as to one of the valid names!
  
- Simmilarly, all data source files can have an optional eventname column. An eventname column is used in the case of longitudinal or multiple point studies where a specific subject has multiple values for a given measurement. If your data is not structured in this way, you can ignored this point. If it is, then you need to provide an 'eventname' column simmilarly to how you must provide a 'subject_id', where the eventname column must be named one of ['eventname', 'session_id']. If it is not, then you must either provide a "mapping" to one of those valid names, or the eventname will just be loaded in by default for every datapoint without a provided valid eventname column as None. 

- The database will be built with whatever data is in this data/sources/custom folder everytime the web application is launched. That said, once a file has been uploaded, it will be skipped upon every subsequent launch. This means that you can always go back and add new files even after the original database has been built. On the otherhand, if you make changes to the values in an already uploaded file, they will not be updated. Right now the only way to delete data from the database is to delete the whole database (which after constructed can be found at (data/bpt/db). 

- If a feature / column already exists within the database, it is updated as follows. If the new values contain any unique subject / eventname combinations, they will be added as new entries. If instead any overlapping subject / eventname data points are added, they will override the existing value. For example, if a data file was originally passed for feature 1, with subject x at eventname y and value z, but you upload a new datafile with the same feature 1, subject x and eventname y, but a different value, then the new value will override the previous one.

- The web app will not let you in until the first database, with atleast some data has been built. That said, if you add new data afterwards, it will be uploaded in the background, and therefore not be avaliable right away. 
