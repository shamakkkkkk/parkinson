# Project

## Objective

This project supports a research group in investigating the relationships between language and movement.
In the experiments, Parkinson’s candidates are asked to speak and perform motor tasks. During these tasks, the research group aims to record correlated data from various sensors. In addition, the data should be processed in real-time in order to monitor the progress of the experiment.
The data to be collected include:
•	Sound pressure level
•	Mouth opening during speech
•	Step length while walking
•	Speed and Acceleration

The recorded data will be post-processed using appropriate methods and, where necessary, interpreted by AI models.
Both the raw data and the interpreted data are made available for presentation and visualization through an API. The API is properly documented. 
Experiment control and data visualization are handled by the experimenter through a web application.

## Anticipated Experiment Workflow
An experiment is limited in duration, typically lasting from several minutes up to a maximum of a few hours. Two roles are involved in conducting the experiment: the experimenter and the participant.
During the experiment, the participant performs various tasks according to the experimenter’s instructions. The same tasks may be repeated several times. The tasks combine movement and speech activities. Examples include walking along a marked route and pronouncing predefined syllables, words, and sentences.
Each experimental session begins with attaching the sensors and calibrating the system. During calibration, the participant may already be required to perform certain tasks while following the experimenter’s instructions.
The calibration process is used to verify that all sensors are functioning as expected and to establish a baseline for selected measurements.

## Recording Control
The recording process is divided into several steps, each of which is referred to as an exercise. Before each exercise, the participant receives instructions from the experimenter. The experimenter then starts the recording, after which the participant performs the exercise. Once the exercise has been completed, the recording is stopped and supplemented with relevant notes or annotations.
The experimenter can view a visualization of the recorded data. Multiple graphs are displayed in a time-synchronized manner, including measurements such as step length, speech volume, and mouth opening.
In addition, a list of key metrics is displayed, such as mean and median values, peak values, and other metrics that are yet to be defined.
We can assume that the experimenter and the person who develops the experiment are not same. Having explicit instructions in the app itself, also for the experimenter, should be considered.

## Task Description

Create a Rest API service which allows managing experiments and exercises. Document the API using an OpenAPI spec and redoc. Verify the API service is working by covering all endpoints with automated API E2E Tests.

### Requirements

Experiments
1. Create a new experiment as umbrella entity. Include basic test person data such as height, age, weight and candidate number. Also store date of creation and custom properties (string key-value pairs) provided by the experimenter.
2. List experiments paginated.
3. Update an experiment.
4. Delete an experiment including all related data.

Exercises
1. Create a new exercise within an experiment. Include date of creation and custom properties (string key-value pairs) provided by the experimenter.
2. Start data recording for an exercise. Only works if the exercise has no data yet.
3. Stop data recording for an exercise.
4. Clear recorded exercise data.
5. Delete an exercise completely.
6. List all exercises.
7. Get recorded and processed data for one exercise:
    1. Mouth opening as array of floating point number tuples, representing vertical and horizontal mouth opening relative to the size of the video frame width and height
    2. Sampling rate of mouth opening values.
    3. Sound pressure as array of floating point numbers; unit Pascal or Dezibel (whatever is possible)
    4. Sampling rate of sound pressure values.
    5. Foot speed as array of floating point numbers; unit centimeters per second
    6. Sampling rate of speed values
    7. Aggregated data:
        1. Step lengths as array of floating point number; unit centimeters.
        2. Averages and medians of above values