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

1. Locate the data directory within the BPt_app folder. 