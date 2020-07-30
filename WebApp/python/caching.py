import os
import sys
import json
from shutil import copyfile
from hashlib import blake2b
from collections.abc import Iterable
from utils import save_subjects, load_subjects
from ABCD_ML import Load
from pathlib import Path

V_DR = '/var/www/html/data/bpt/'

SUBJECT_CACHE_DR = os.path.join(V_DR, 'Subjects_Cache')
os.makedirs(SUBJECT_CACHE_DR, exist_ok=True)

LOADING_CACHE_DR = os.path.join(V_DR, 'Loading_Cache')
os.makedirs(LOADING_CACHE_DR, exist_ok=True)

IMAGE_CACHE_DR = os.path.join(V_DR, 'Image_Cache')
os.makedirs(IMAGE_CACHE_DR, exist_ok=True)

LOADED_CACHE_DR = os.path.join(V_DR, 'Loaded_Cache')
os.makedirs(LOADED_CACHE_DR, exist_ok=True)

LOADED_SZ_LIMIT = 25000000

# Caching Utils #


def get_hash(in_str):

    h = blake2b()
    h.update(in_str.encode('ascii'))
    return str(h.hexdigest())


def get_param_cache_key(params):

    key = ''

    if isinstance(params, dict):

        no_cache = ['ex_inc_by_val', 'n', 'key', '-data-sets', 'id', 'index']
        if 'data-sets' in params:
            no_cache.append('-input')

        param_keys = sorted(list(params.keys()))
        for k in param_keys:
            if k not in no_cache:
                key += str(k) + '='

                if isinstance(params[k], Iterable) and \
                   not isinstance(params[k], str):
                    key += get_param_cache_key(params[k])
                else:
                    key += str(params[k])

    elif isinstance(params, Iterable) and not isinstance(params, str):
        for entry in params:
            key += get_param_cache_key(entry) + '@'

    else:
        key += str(params)

    return key


def get_param_hash(params):

    as_str = get_param_cache_key(params)
    return get_hash(as_str)


# Subject Caching #


def save_cache_subjects(subj_hash, subjs):

    save_loc = os.path.join(SUBJECT_CACHE_DR, subj_hash)
    save_subjects(save_loc, subjs)


def cache_just_subjects(subjs):

    # Sort the passed set of subjs / conv to list
    subjs = sorted(list(subjs))

    # Get the hash for this subset of subjects
    subj_hash = get_hash('*'.join(subjs))

    # Save the subjects w/ the hash name
    save_cache_subjects(subj_hash, subjs)

    return subj_hash


def load_cache_subjects(subj_hash, as_set=True):

    load_loc = os.path.join(SUBJECT_CACHE_DR, subj_hash)
    return load_subjects(load_loc, as_set)


def get_subj_param_hash(params, to_load_name, output_loc):

    # Add to make sure hash is unique to load strat subjects
    params['to_load'] = to_load_name

    # Compute hash of these params
    param_hash = get_param_hash(params)

    # Check if this hash exists, if it does load + return the subjects
    if os.path.exists(os.path.join(SUBJECT_CACHE_DR, param_hash)):
        return None, load_cache_subjects(param_hash)

    # If not, return the param hash + updated params
    return param_hash, params


# Loading Caching #


def check_loading_cache(params, output_loc, v_type):

    # Compute hash of the passed params
    try:
        param_hash = get_param_hash(params)
    except Exception as e:
        from utils import save_error
        save_error('Error caching passed params', output_loc, e)

    # Check if params are cached
    if os.path.exists(os.path.join(LOADING_CACHE_DR, param_hash)):

        # Copy saved results / output to the output_loc
        saved_loc = os.path.join(LOADING_CACHE_DR, param_hash)
        copyfile(saved_loc, output_loc)

        # Increment the input cache
        incr_input_cache(v_type, params)

        # Exit the script, as everything is done
        sys.exit()

    # Otherwise, just return the param hash
    # to be used to eventually save the output
    return param_hash


def save_to_loading_cache(output, param_hash):

    # Save output to spot  in loading cache dr
    save_loc = os.path.join(LOADING_CACHE_DR, param_hash)
    with open(save_loc, 'w') as f:
        json.dump(output, f)


# Input Caching #


def incr_input_cache(v_type, params):

    # Make sure the main cache dr exists
    os.makedirs(V_DR, exist_ok=True)
    v_loc = os.path.join(V_DR, 'input_cache.json')

    # Load from existing if there, otherwise create new
    try:
        with open(v_loc, 'r') as f:
            v_cache = json.load(f)
    except FileNotFoundError:
        v_cache = {}

    if v_type not in v_cache:
        v_cache[v_type] = {}

    # Input cache is index'ed by type of input, and then -input
    col_name = params.pop('-input')
    if col_name not in v_cache[v_type]:
        v_cache[v_type][col_name] = {}

    # Beyond that we only want to store some info, for now just around dataType
    # so only save if there is a valid type
    if "-type" in params:

        all_keys =\
            {'float': ["-outlier-percent", "-range-percent",
                       "-range-percentL", "-range-percentU"
                       "-outlier-std", "-range-std", "-range-stdL",
                       "-range-stdU"],
             'cat': ["-outlier-cat", "-range-cat", "-cat-choice",
                     '-cat-bins', '-cat-bin-strat'],
             'binary': ["-binary-choice", "-binary-threshold",
                        "-binary-thresholdU", "-binary-thresholdL"]
             }

        all_keys['cat'] += [k + '-cat' for k in all_keys['float']]

        defaults = ["-type"]
        to_save_keys = all_keys[params['-type']] + defaults

        # For each key, if in both the list to save and in params
        # increment the input cache
        for p in to_save_keys:
            if p in params:

                # Create new entry if doesnt exist for this param
                if p not in v_cache[v_type][col_name]:
                    v_cache[v_type][col_name][p] = {}

                # Increment the cache
                try:
                    v_cache[v_type][col_name][p][str(params[p])] += 1
                except KeyError:
                    v_cache[v_type][col_name][p][str(params[p])] = 1

        # Re-save the cache
        with open(v_loc, 'w') as f:
            json.dump(v_cache, f)


# Image Caching #


def get_free_img_name(img_dr, img_name):

    cnt = 0
    files = os.listdir(img_dr)

    before = '.'.join(img_name.split('.')[:-1])
    end = img_name.split('.')[-1]

    while before + str(cnt) + '.' + end in files:
        cnt += 1

    return before + str(cnt) + '.' + end


def move_img_to_cache(img_loc):

    img_name = img_loc.split('/')[-1]
    img_name = get_free_img_name(IMAGE_CACHE_DR, img_name)
    new_loc = os.path.join(IMAGE_CACHE_DR, img_name)

    os.rename(img_loc, new_loc)

    return new_loc


# Loaded Caching #

def check_loaded_cache(params, output_loc, user_dr, n):

    # Compute hash of the passed params
    try:
        param_hash = get_param_hash(params)
    except Exception as e:
        from utils import save_error
        save_error('Error caching passed params', output_loc, e)

    # Check if params are already cached
    saved_loc = os.path.join(LOADED_CACHE_DR, param_hash)
    if os.path.exists(saved_loc):

        # If exists load saved ML obj, overriding old cache info
        ML = Load(saved_loc, exp_name='ABCD_ML_Logs' + str(n),
                  log_dr=user_dr, existing_log='overwrite')

        # Update timestamp
        Path(saved_loc).touch()

        return ML

    # If not caches return the param_hash
    return param_hash


def save_to_loaded_cache(ML, param_hash):

    # Start by checking the size limit
    check_loaded_sz_limit()

    # Save ML obj to spot in loaded cache dr
    save_loc = os.path.join(LOADED_CACHE_DR, param_hash)
    ML.Save(loc=save_loc, low_memory=True)

    # Return the low_memory modified ML object
    return ML


def check_loaded_sz_limit():

    all_cached = [os.path.join(LOADED_CACHE_DR, f)
                  for f in os.listdir(LOADED_CACHE_DR)]
    size = sum(os.path.getsize(f) for f in all_cached)

    if size > LOADED_SZ_LIMIT:
        old_to_new = sorted(all_cached, key=os.path.getctime)

        removed, n = 0, 0

        while size - removed > LOADED_SZ_LIMIT:
            to_remove = old_to_new[n]

            removed += os.path.getsize(to_remove)
            os.remove(to_remove)

            n += 1
