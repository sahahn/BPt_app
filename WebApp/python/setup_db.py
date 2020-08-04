import sqlite3
import numpy as np
import pandas as pd
import time
import json
import os

def get_all_tables(con):
    
    c = con.cursor()
    c.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = c.fetchall()
    c.close()

    return [t[0] for t in tables if t[0] != '__loaded__']


def load_dataset(source, load_params, con):
    
    try:
        pd.DataFrame({'loaded': []}).to_sql('__loaded__',
                                            con,
                                            if_exists='fail',
                                            index=False)
        loaded = set()
    except ValueError:
        loaded =\
            set(pd.read_sql_query("SELECT * from __loaded__",
                                  con)['loaded'])
        
    if source in loaded:
        return None
    
    data = pd.read_csv(source, low_memory=False, **load_params)
    
    return data


def check_data(data, params):
    
    if data is None:
        return None
    
    # Apply mapping
    data = data.rename(params['mapping'], axis=1)
    
    if 'subject_id' not in data:
        if 'participant_id' in data:
            data = data.rename({'participant_id': 'subject_id'}, axis=1)
        elif 'src_subject_id' in data:
            data = data.rename({'src_subject_id': 'subject_id'}, axis=1)
        else:
            print('warning no valid subject data found')
            return None
        
    if 'eventname' not in data:
        if 'session_id' in data:
            data = data.rename({'session_id': 'eventname'}, axis=1)
        else:
            data['eventname'] = 'None'
            
    # Drop ignore cols
    to_drop = list(set(list(data)).intersection(set(params['ignore_cols'])))
    data = data.drop(to_drop, axis=1)
    
    # Set index
    data = data.set_index(['subject_id', 'eventname'])

    return data


def add_col(data, col, con):
    
    print('add ', col)
    
    try:
        data[col].to_sql(col, con, if_exists='fail')
    
    except ValueError:
        existing = pd.read_sql_query("SELECT * from " + col, con)
        merged = pd.merge(data[col].reset_index(), existing, how='outer')
        merged.to_sql(col, con, if_exists='replace', index=False)
        
        
def upload_dataset(data, file, con):
    
    for col in list(data):
        add_col(data, col, con)
        
    loaded = set(pd.read_sql_query("SELECT * from __loaded__", con)['loaded'])
    loaded.add(file)
    pd.DataFrame({'loaded': list(loaded)}).to_sql('__loaded__', con, if_exists='replace', index=False)
    

def upload_custom_data(custom_dr, con):

    
    folders = [f for f in os.listdir(custom_dr) if '.json' not in f]

    for folder in folders:
        json_loc = os.path.join(custom_dr, folder + '.json')
        
        if os.path.exists(json_loc):
            with open(json_loc, 'r') as f:
                params = json.load(f)
        else:   
            params = {'load_params': {},
                      'ignore_cols': [],
                      'mapping': {}}
        
        folder_loc = os.path.join(custom_dr, folder)
        files = [os.path.join(folder_loc, f) for f in os.listdir(folder_loc)]
        
        for file_name in files:

            print('load ', file_name)
            
            # Load in as dataframe
            data = load_dataset(file_name, params['load_params'], con)
            
            # Check data
            data = check_data(data, params)
            
            # If already loaded or has error
            if data is None:
                continue
            
            # Upload the dataset
            upload_dataset(data, file_name, con)


def main():

    # Make connection
    db_dr = '/var/www/html/data/bpt/db'
    con = sqlite3.connect(db_dr)
    
    # Try to upload all custom data
    custom_dr = '/var/www/html/data/sources/custom/'
    upload_custom_data(custom_dr, con)

    # When done with uploads, save a json with the
    # current loaded tables
    loaded_loc = '/var/www/html/data/bpt/loaded.json'
    loaded = get_all_tables(con)
    with open(loaded_loc, 'w') as f:
        json.dump(loaded, f)


if __name__ == "__main__":
    main()


