import os
import pandas as pd
import json

from ABCD_ML import (ABCD_ML, CV)

import numpy as np
import scipy.stats as stats

from utils import save_error
from caching import (save_cache_subjects, get_subj_param_hash,
                     cache_just_subjects, load_cache_subjects,
                     check_loading_cache, save_to_loading_cache,
                     incr_input_cache, move_img_to_cache, check_loaded_cache,
                     save_to_loaded_cache)


# Replace this w/ load from DB

def fetchABCDData(variables):
    '''Pass in variables & output is a pd dataframe'''

    if not isinstance(variables, list):
        variables = [variables]

    # Reverse map input
    data_dr = '/var/www/html/data/tab_data/'

    map_loc = os.path.join(data_dr, 'ABCDFixRelease2p0p1',
                           'Fix Release Notes 2.0.1_Public',
                           '24. ABCD_Release_2.0.1_Updates',
                           'abcd_2.0.1_mapping.csv')

    maps = pd.read_csv(map_loc)
    rev_mapping = dict(zip(maps['deap_name'],
                           maps['nda_name']))

    # Apply reverse map
    for i in range(len(variables)):
        if variables[i] in rev_mapping:
            variables[i] = rev_mapping[variables[i]]

    # Load col to loc dict
    with open(data_dr + 'col_to_loc.json', 'r') as f:
        col_to_loc = json.load(f)

    # Load requested columns by each file seperately
    by_file = {}
    for v in variables:

        file = col_to_loc[v]

        try:
            by_file[data_dr + file].append(v)
        except KeyError:
            by_file[data_dr + file] = [v]

    # Create dfs for each file
    dfs = []
    for file in by_file:
        dfs.append(pd.read_csv(file, sep='\t',
                               skiprows=[1],
                               usecols=by_file[file] + ['src_subject_id',
                                                        'eventname']))

    if len(dfs) == 1:
        return dfs[0]
    return dfs


def load_params(user_dr, output_loc, n):

    # Load params
    try:
        params_loc = os.path.join(user_dr, 'ML_Params' + str(n) + '.json')
        with open(params_loc, 'r') as f:
            params = json.load(f)['params']

    except Exception as e:
        save_error('Error loading saved json params', output_loc, e)

    return params


def proc_from_file(sources):

    merged = set()

    for source in sources:
        lines = sources[source].split('\n')

        for line in lines:
            line = line.strip()
            merged.add(line)

    return merged


def get_by_val_subjects(entry, output_loc):

    # proc params pre-hash
    params = init_proc_params(entry['params'], output_loc, inc_exc=True)

    # Save value to params for hash
    params['value'] = entry['value']

    # hash + check
    param_hash, params =\
        get_subj_param_hash(params, 'inc_ex_subjects', output_loc)

    # If param hash is None, then params actually == loaded cached subjects
    if param_hash is None:
        return params

    # Otherwise if no cache load the start and compute the by val subjects
    ML, _ = init_ML(None, output_loc, params)
    ML = load_strat(ML, params, output_loc)

    # Strat should be loaded within ML with 1 column
    series = ML.strat[list(ML.strat)[0]].astype(int)
    value = int(float(entry['value']))

    # Grab by value
    subjects = set(series[series == value].index)

    # Save to cache
    save_cache_subjects(param_hash, subjects)

    return subjects


def proc_strat_by_val(by_val_params, exclusions, inclusions, output_loc):

    for entry in by_val_params:

        # Get subjects w/ caching
        subjects = get_by_val_subjects(entry, output_loc)

        if entry['filter_type'] == 'exclusions':
            exclusions.update(subjects)
        else:
            inclusions.update(subjects)

    return exclusions, inclusions


def proc_inc_ex(params, output_loc):

    # First check from file params
    # Both are computed as a union of all unique subjects

    if 'exclusions' in params:
        params['exclusions'] = proc_from_file(params['exclusions'])
    else:
        params['exclusions'] = set()

    if 'inclusions' in params:
        params['inclusions'] = proc_from_file(params['inclusions'])
    else:
        params['inclusions'] = set()

    # Next check if by val passed, and merge
    if 'ex_inc_by_val' in params:

        params['exclusions'], params['inclusions'] =\
            proc_strat_by_val(params['ex_inc_by_val'],
                              params['exclusions'],
                              params['inclusions'],
                              output_loc)

    # Cache + replace inc / exc w/ cache name, or None if none
    if len(params['exclusions']) > 0:
        params['exclusions'] = cache_just_subjects(params['exclusions'])
    else:
        params['exclusions'] = None

    if len(params['inclusions']) > 0:
        params['inclusions'] = cache_just_subjects(params['inclusions'])
    else:
        params['inclusions'] = None

    return params


def check_defaults(params):

    if '-eventname' not in params:
        params['-eventname'] = 'baseline'

    if '-drop-choice' not in params:
        params['-drop-choice'] = 'true'

    if '-binary-choice' not in params:
        params['-binary-choice'] = 'default'

    if '-outlier-percent' not in params:
        params['-outlier-percent'] = 'false'

    if '-outlier-std' not in params:
        params['-outlier-std'] = 'false'

    if '-outlier-cat' not in params:
        params['-outlier-cat'] = 'false'

    if '-outlier-std-cat' not in params:
        params['-outlier-std-cat'] = 'false'

    if '-outlier-percent-cat' not in params:
        params['-outlier-percent-cat'] = 'false'

    for k in ["percent", "std", "cat", "percent-cat", "std-cat"]:
        for end in ['', 'L', 'U']:
            if '-range-' + k + end not in params:
                params['-range-' + k + end] = ''

    if '-cat-bins' not in params:
        params['-cat-bins'] = '5'

    if '-cat-bins-strat' not in params:
        params['-cat-bins-strat'] = 'Quantile'

    return params


def remove_eventname_check(params, output_loc):

    # Remove any eventname extensions from -input
    try:
        if '-input' in params:
            for key in ['.baseline', '.year1']:
                if params['-input'].endswith(key):
                    params['-input'] = params['-input'].replace(key, '')
    except Exception as e:
        save_error('Error processing passed input',
                   output_loc, e)

    return params


def init_proc_params(params, output_loc, inc_exc=True):

    # Proc passed inclusions exclusions if any & requested
    if inc_exc:

        try:
            params = proc_inc_ex(params, output_loc)
        except Exception as e:
            save_error('Error processing passed exclusions/inclusions',
                       output_loc, e)

    # Only proc defaults + eventname if -input in params
    if '-input' in params:

        # Replace any missing params w/ defaults
        params = check_defaults(params)

        # Remove any eventname extensions from -input
        params = remove_eventname_check(params, output_loc)

    # Perform a nested check for sub-params!
    if 'target_params' in params:
        for key in params['target_params']:
            params['target_params'][key] =\
                init_proc_params(params['target_params'][key],
                                 output_loc, inc_exc=False)

    if 'data_params' in params:

        # For set or key
        for key in params['data_params']:
            params['data_params'][key] =\
                init_proc_params(params['data_params'][key],
                                 output_loc, inc_exc=False)

    if 'strat_params' in params:
        for key in params['strat_params']:
            params['strat_params'][key] =\
                init_proc_params(params['strat_params'][key],
                                 output_loc, inc_exc=True)

    # Set-vars is an array
    if 'set-vars' in params:
        for i in range(len(params['set-vars'])):
            params['set-vars'][i] =\
                init_proc_params(params['set-vars'][i],
                                 output_loc, inc_exc=False)

    # Set params is a single dict
    if 'set_params' in params:
        params['set_params'] =\
            init_proc_params(params['set_params'],
                             output_loc, inc_exc=False)

    return params


def init_ML(user_dr, output_loc, params, n=0):

    try:
        ML = ABCD_ML(exp_name='ABCD_ML_Logs' + str(n),
                     log_dr=user_dr,
                     existing_log='overwrite',
                     verbose=False, notebook=False,
                     use_abcd_subject_ids=True, dpi=200,
                     n_jobs=1, mp_context='spawn')

        if user_dr is not None:
            log_dr = os.path.join(user_dr, 'ABCD_ML_Logs' + str(n))
        else:
            log_dr = ''

    except Exception as e:
        save_error('Error creating ABCD_ML object', output_loc, e)

    # For now these settings are okay
    ML.Set_Default_Load_Params(dataset_type='basic',
                               eventname_col='eventname',
                               drop_na=True,
                               subject_id='src_subject_id')

    # Load the name_map next -- won't need once db
    try:
        data_dr = '/var/www/html/data/tab_data/'
        map_loc = os.path.join(data_dr, 'ABCDFixRelease2p0p1',
                               'Fix Release Notes 2.0.1_Public',
                               '24. ABCD_Release_2.0.1_Updates',
                               'abcd_2.0.1_mapping.csv')
        ML.Load_Name_Map(loc=map_loc,
                         dataset_type='custom',
                         source_name_col='nda_name',
                         target_name_col='deap_name')
    except Exception as e:
        save_error('Error loading internal name map', output_loc, e)

    if params['inclusions'] is not None:
        ML.Load_Inclusions(subjects=load_cache_subjects(params['inclusions']))
    if params['exclusions'] is not None:
        ML.Load_Exclusions(subjects=load_cache_subjects(params['exclusions']))

    return ML, log_dr


def _proc_UL(base, params):

    if params['-outlier-' + base] == 'true':

        if params['-range-' + base] != '':
            val = float(params['-range-' + base])
        else:

            lower = params['-range-' + base + 'L']
            if lower == '':
                lower = None
            else:
                lower = float(lower)

            upper = params['-range-' + base + 'U']
            if upper == '':
                upper = None
            else:
                upper = float(upper)

            val = (lower, upper)

        return val

    return None


def _proc_datatype_args(params, output_loc):

    # Proc input params as needed
    try:

        data_type = params['-type']

        if data_type not in ['float', 'binary', 'cat']:
            save_error('You must select a Data Type', output_loc)

        fop, fos, cdp, binary_thresh, fb, fbs =\
            None, None, None, None, None, None

        if data_type == 'float':
            fop = _proc_UL('percent', params)
            fos = _proc_UL('std', params)

        if data_type == 'cat':
            cdp = _proc_UL('cat', params)

            if params['-cat-choice'] == 'bins':

                data_type = 'f2b'
                fop = _proc_UL('percent-cat', params)
                fos = _proc_UL('std-cat', params)

                fb = int(float(params['-cat-bins']))
                fbs = params['-cat-bin-strat'].lower()

        if data_type == 'binary':
            if params['-binary-choice'] == 'threshold':
                data_type = 'float'

                binary_thresh = {}
                binary_thresh['threshold'] = params["-binary-threshold"]
                binary_thresh['lower'] = params["-binary-thresholdL"]
                binary_thresh['upper'] = params["-binary-thresholdU"]

    except Exception as e:
        save_error('Error processing data type input args', output_loc, e)

    return data_type, fop, fos, cdp, binary_thresh, fb, fbs


def _proc_na(params):

    drop_na = params['-drop-choice']
    if drop_na == 'true':
        drop_na = True
    else:
        drop_na = False

    return drop_na


def _proc_eventname(params):

    if params['-eventname'] == 'baseline':
        return 'baseline_year_1_arm_1', '.baseline'
    elif params['-eventname'] == 'year 1':
        return '1_year_follow_up_y_arm_1', '.year1'


def _proc_binary_thresh(ML, col_name, load_type, binary_thresh, output_loc):

    if binary_thresh is None:
        return ML

    if load_type == 'target':
        func = ML.Binarize_Target
    elif load_type == 'variable':
        func = ML.Binarize_Covar
    elif load_type == 'set':
        func = ML.Binarize_Covar

    try:
        threshold = float(binary_thresh['threshold'])
    except ValueError:
        threshold = None

    try:
        lower = float(binary_thresh['lower'])
        upper = float(binary_thresh['upper'])
    except ValueError:
        lower, upper = None, None

    try:
        func(threshold, lower, upper, col_name)
    except Exception as e:
        save_error('Error binarizing variable', output_loc, e)

    return ML


def drop_data_overlap(params, ML, target=False):

    if len(params['data_subjects']) > 0:

        ML._print('Other loaded data')

        if target:
            df = ML.targets
        else:
            df = ML.covars

        original_len = len(df.index)
        ML._print(original_len)

        overlap_subjects =\
            list(params['data_subjects'].intersection(set(list(df.index))))

        if original_len != len(overlap_subjects):
            ML._print('Dropped', str(original_len - len(overlap_subjects)),
                      'rows/subjects in computing overlap with Data')

            if target:
                ML.targets = ML.targets.loc[overlap_subjects]
                ML._print('New Shape:', ML.targets.shape)

            else:
                ML.covars = ML.covars.loc[overlap_subjects]
                ML._print('New Shape:', ML.covars.shape)

    return ML


def drop_strat_overlap(params, ML, target=False):

    if len(params['strat_subjects']) > 0:

        ML._print('Other loaded strat')

        if target:
            df = ML.targets
        else:
            df = ML.covars

        original_len = len(df.index)
        ML._print(original_len)

        overlap_subjects =\
            list(params['strat_subjects'].intersection(set(list(df.index))))

        if original_len != len(overlap_subjects):
            ML._print('Dropped', str(original_len - len(overlap_subjects)),
                      'rows/subjects in computing overlap with Non-Input ',
                      'Variables')

            if target:
                ML.targets = ML.targets.loc[overlap_subjects]
                ML._print('New Shape:', ML.targets.shape)

            else:
                ML.covars = ML.covars.loc[overlap_subjects]
                ML._print('New Shape:', ML.covars.shape)

    return ML


def drop_target_overlap(params, ML, target=False):

    if len(params['target_subjects']) > 0:

        ML._print('Other loaded target')

        if target:
            df = ML.targets
        else:
            df = ML.covars

        original_len = len(df.index)
        ML._print(original_len)

        overlap_subjects =\
            list(params['target_subjects'].intersection(set(list(df.index))))

        if original_len != len(overlap_subjects):
            ML._print('Dropped', str(original_len - len(overlap_subjects)),
                      'rows/subjects in computing overlap with Targets')

            if target:
                ML.targets = ML.targets.loc[overlap_subjects]
                ML._print('New Shape:', ML.targets.shape)

            else:
                ML.covars = ML.covars.loc[overlap_subjects]
                ML._print('New Shape:', ML.covars.shape)

    return ML


def load_target(ML, params, output_loc, drops=True):

    # Proc input args
    data_type, fop, fos, cdp, binary_thresh, fb, fbs =\
        _proc_datatype_args(params, output_loc)

    # Load the target df
    col_name = params['-input']

    try:
        target_df = fetchABCDData(col_name)
    except Exception as e:
        save_error('Error fetching target variable', output_loc, e)

    eventname, ext = _proc_eventname(params)

    try:
        ML.Load_Targets(df=target_df,
                        col_name=col_name,
                        data_type=data_type,
                        eventname=eventname,
                        ext=ext,
                        filter_outlier_percent=fop,
                        filter_outlier_std=fos,
                        categorical_drop_percent=cdp,
                        float_bins=fb,
                        float_bin_strategy=fbs)
    except Exception as e:
        save_error('Error loading target variable', output_loc, e)

    # Proc binary thresh if any
    ML = _proc_binary_thresh(ML, col_name+ext, 'target',
                             binary_thresh, output_loc)

    if drops:

        # Drop any other target overlap first
        ML = drop_target_overlap(params, ML, target=True)

        # Drop data overlap
        ML = drop_data_overlap(params, ML, target=True)

        # Then strat overlap
        ML = drop_strat_overlap(params, ML, target=True)

    return ML


def load_variable(ML, params, output_loc, drops=True):

    # check if set variable
    if 'set_params' in params and params['set_params'] is not None:

        # As set variable is only used when main focus, drops
        # will always be true here)

        set_params = params.pop('set_params')
        params_copy = params.copy()
        params_copy.update(set_params)

        return load_set(ML, params_copy, output_loc, drops=True)

    # Proc input args
    data_type, fop, fos, cdp, binary_thresh, fb, fbs =\
        _proc_datatype_args(params, output_loc)
    drop_na = _proc_na(params)

    # Load the covar df
    col_name = params['-input']
    try:
        covar_df = fetchABCDData(col_name)
    except Exception as e:
        save_error('Error fetching data variable', output_loc, e)

    eventname, ext = _proc_eventname(params)

    try:
        ML.Load_Covars(df=covar_df,
                       col_name=col_name,
                       data_type=data_type,
                       eventname=eventname,
                       ext=ext,
                       drop_na=drop_na,
                       filter_outlier_percent=fop,
                       filter_outlier_std=fos,
                       categorical_drop_percent=cdp,
                       float_bins=fb,
                       float_bin_strategy=fbs)
    except Exception as e:
        save_error('Error loading data variable', output_loc, e)

    # Proc binary thresh if any
    ML = _proc_binary_thresh(ML, col_name+ext, 'variable', binary_thresh,
                             output_loc)

    # If drops is passed, then compute the overlaps
    if drops:

        # Compute over w/ any other data if any
        # Order is do other data before targets
        ML = drop_data_overlap(params, ML)

        # Compute overlap w/ targets if any
        ML = drop_target_overlap(params, ML)

        # Drop strat last
        ML = drop_strat_overlap(params, ML)

    return ML


def load_strat(ML, params, output_loc, drops=False):

    # Proc input args
    data_type, fop, fos, cdp, binary_thresh, fb, fbs =\
        _proc_datatype_args(params, output_loc)

    # Load df
    col_name = params['-input']
    try:
        strat_df = fetchABCDData(col_name)
    except Exception as e:
        save_error('Error fetching non-input variable', output_loc, e)

    if data_type == 'binary':
        binary_col = True
    else:
        binary_col = False

    if data_type == 'f2b':
        float_col = True
    else:
        float_col = False

    if binary_thresh is not None:

        try:
            float_to_binary = float(binary_thresh['threshold'])
        except ValueError:
            float_to_binary = (float(binary_thresh['lower']),
                               float(binary_thresh['upper']))
    else:
        float_to_binary = False

    eventname, ext = _proc_eventname(params)

    try:
        ML.Load_Strat(df=strat_df,
                      col_name=col_name,
                      eventname=eventname,
                      ext=ext,
                      binary_col=binary_col,
                      float_to_binary=float_to_binary,
                      float_col=float_col,
                      float_bins=fb,
                      float_bin_strategy=fbs,
                      categorical_drop_percent=cdp)

    except Exception as e:
        save_error('Error loading non-input variable', output_loc, e)

    ML._print('loaded strat', col_name)

    return ML


def load_set(ML, params, output_loc, drops=True):

    # Proc input args
    data_type, fop, fos, cdp, binary_thresh, fb, fbs =\
        _proc_datatype_args(params, output_loc)
    drop_na = _proc_na(params)

    # Get col names
    col_names = params['data-sets']

    # Turn input params into list of
    data_type = [data_type for i in range(len(col_names))]
    fop = [fop for i in range(len(col_names))]
    fos = [fos for i in range(len(col_names))]
    cdp = [cdp for i in range(len(col_names))]
    binary_thresh = [binary_thresh for i in range(len(col_names))]
    fb_s = [fb for fb in range(len(col_names))]
    fbs_s = [fbs for fbs in range(len(col_names))]

    # Check if any set vars passed
    if 'set-vars' in params:
        for var in params['set-vars']:

            # make sure eventname didnt change
            if (('-eventname' in var) and
                    (var['-eventname'] != params['-eventname'])):

                save_error('You cannot change the eventname of a set ' +
                           'variable ' +
                           'from the original', output_loc)

            if '-drop-choice' in var and _proc_na(var) != drop_na:
                save_error('You cannot change drop na of a set variable ' +
                           'from the original', output_loc)

            # Remove eventname if any there for some reason
            var = remove_eventname_check(var, output_loc)

            # Get index of this set var within list of all
            i = col_names.index(var['-input'])

            # Proc input args, and override
            data_type[i], fop[i], fos[i], cdp[i], binary_thresh[i], fb_s[i], fbs_s[i] =\
                _proc_datatype_args(var, output_loc)

    params['all_data_types'] = data_type

    # Load from db/files
    try:
        data_df = fetchABCDData(col_names)
    except Exception as e:
        save_error('Error fetching set data variables', output_loc, e)

    # Proc eventname
    eventname, ext = _proc_eventname(params)

    # For now load data as covars, since want to handle types
    try:
        ML.Load_Covars(df=data_df,
                       col_name=col_names,
                       data_type=data_type,
                       eventname=eventname,
                       ext=ext,
                       drop_na=drop_na,
                       filter_outlier_percent=fop,
                       filter_outlier_std=fos,
                       categorical_drop_percent=cdp,
                       float_bins=fb_s,
                       float_bin_strategy=fbs_s)
    except Exception as e:
        save_error('Error loading data variable', output_loc, e)

    # Proc binary threshes if any
    for col_name, b_t in zip(col_names, binary_thresh):
        ML = _proc_binary_thresh(ML, col_name+ext, 'set', b_t,
                                 output_loc)

    # Compute any overlaps
    if drops:

        # Compute over w/ any other data if any
        # Order is do other data before targets
        ML = drop_data_overlap(params, ML)

        # Compute overlap w/ targets if any
        ML = drop_target_overlap(params, ML)

        # Drop strat last
        ML = drop_strat_overlap(params, ML)

        ML._print('finish loading set')

    return ML


def plot_dist(params, ML, load_type, log_dr, output_loc):

    _, ext = _proc_eventname(params)
    key = params['-input'] + ext
    ML._print('Plot ', key)

    try:
        if load_type == 'target':
            d_dfs = ML.Show_Targets_Dist(targets=key, return_display_dfs=True)
            key = '_target_distribution.png'
        elif load_type == 'variable':
            d_dfs = ML.Show_Covars_Dist(covars=key, return_display_dfs=True)
            key = '_covar_distribution.png'
        elif load_type == 'strat':
            d_dfs = ML.Show_Strat_Dist(strat=key, return_display_dfs=True)
            key = '_strat_distribution.png'

    except Exception as e:
        save_error('Error creating variable distribution image', output_loc, e)

    # Save a copy of the dist figure
    try:

        # Should only be one
        img_files = [f for f in os.listdir(log_dr) if key in f]
        img_loc = os.path.join(log_dr, img_files[0])

        # Move to cache
        img_loc = move_img_to_cache(img_loc)

    except Exception as e:
        save_error('Error saving variable distribution image', output_loc, e)

    return img_loc, d_dfs


def chunk_line(line):
    return [h.strip() for h in line.split(' ') if len(h.strip()) > 0]


def get_set_output(log_dr, ML, params, output_loc):

    try:

        html_output = _get_set_html_output(log_dr)

        # Try to make the set table, if any errors: then just display
        # show buttons
        try:
            html_table = _get_set_table(ML, params, output_loc)
        except Exception as e:

            button_names = params['data-sets']
            max_name = max([len(name) for name in button_names])

            error_txt = 'Could not generate summary stats due to error: "' +\
                str(e) + '". This could be due to bad input arguments' +\
                ' or in some cases where changes are made to specific set ' +\
                'variables, e.g., the type of one variable is changed, ' +\
                'which while valid, will break the summary table.'
            error_txt = '<br><p><i>' + wrap_check(error_txt,
                                                  max_sz=max_name+10) +\
                        '</i></p>'

            html_table = '<table id="default-table-id" class="table '
            html_table += 'table-striped table-responsive">'
            html_table += '<thead><tr>'
            html_table += '<th scope="col">Variable</th>'
            html_table += '<th scope="col"></th>'
            html_table += '</tr></thead>'
            html_table += '<tbody>'
            html_table += '<tr>'
            for i, v in enumerate(button_names):
                html_table += '<th scope="row">' + v + '</th>'
                html_table += _add_button(v, i)
                html_table += '</tr>'
            html_table += '</tbody></table>'
            html_table += error_txt

        return html_output, html_table

    except Exception as e:
        save_error('Error generating set output', output_loc, e)


def _get_set_html_output(log_dr):

    with open(os.path.join(log_dr, 'logs.txt'), 'r') as f:
        lines = f.readlines()

    if_keys = [' cols for all missing values',
               'Loaded Shape',
               'Loaded rows with NaN remaining:',
               'outside of included subjects',
               ' excluded subjects',
               'Total inclusion subjects:',
               'rows/subjects in computing overlap with',
               'New Shape']

    up_to_keys = [' rows for missing values']

    ignore = ['Removed excluded subjects from loaded dfs']

    return _extract_from_logs(lines, if_keys, up_to_keys, [], ignore=ignore)


def _add_button(button_name, i):

    t_output = ''
    t_output += '<td><button type="button" data-name="' + button_name + '" '
    t_output += 'data-i="' + str(i) + '" '
    t_output += 'class="btn btn-sm btn-primary edit-set-button">Edit'
    t_output += '</button></td>'
    return t_output


def _get_set_table(ML, params, output_loc):

    data_type = params['-type']
    any_nan = pd.isnull(ML.covars).any().any()

    if data_type == 'float':
        cols = ['Mean', 'Std', 'Skew', 'Kurtosis']
        funcs = [np.mean, np.std, stats.skew, stats.kurtosis]
        button_names = list(ML.covars)

    elif data_type == 'binary':

        button_names = list(ML.covars_encoders)
        all_sums, num_nans = [], []

        for covar in button_names:
            single_df, encoder, _ =\
                ML._get_single_df(covar, ML.covars, ML.covars_encoders)

            _, sums, cols =\
                ML._get_cat_display_df(single_df, encoder, covar, True)

            all_sums.append(sums)
            num_nans.append(np.sum(pd.isnull(single_df))[0])

    elif data_type == 'cat':
        button_names = list(ML.covars_encoders)
        num_nans, num_cats, max_cats, max_vals, min_cats, min_vals =\
            [], [], [], [], [], []

        for covar in button_names:
            single_df, encoder, _ =\
                ML._get_single_df(covar, ML.covars, ML.covars_encoders)
            _, sums, cols =\
                ML._get_cat_display_df(single_df, encoder, covar, True)

            num_nans.append(np.sum(pd.isnull(single_df))[0])
            num_cats.append(len(sums))
            max_cats.append(sums.idxmax())
            max_vals.append(sums.max())
            min_cats.append(sums.idxmin())
            min_vals.append(sums.min())

        cols = ['Categories', 'Min Cat.', '# Min', 'Max Cat.', '# Max']

    t_output = '<table id="default-table-id" '
    t_output += 'class="table table-striped table-responsive">'
    t_output += '<thead><tr>'
    t_output += '<th scope="col">Variable</th>'

    for col in cols:
        t_output += '<th scope="col">' + str(col) + '</th>'

    if any_nan:
        t_output += '<th scope="col">NaN</th>'

    t_output += '<th scope="col"></th>'
    t_output += '</tr></thead>'
    t_output += '<tbody>'
    t_output += '<tr>'

    if data_type == 'float':
        n_round = 3

        for i, v in enumerate(button_names):
            vals, n_nan = _get_col(ML.covars, v)
            t_output += '<th scope="row">' + v + '</th>'

            for func in funcs:
                t_output += '<td>'
                t_output += str(np.round(func(vals), n_round))
                t_output += '</td>'

            if any_nan:
                t_output += '<td>' + str(n_nan) + '</td>'

            t_output += _add_button(v, i)
            t_output += '</tr>'

    elif data_type == 'binary':
        for i, v in enumerate(button_names):
            vals, n_nan = _get_col(ML.covars, v)
            t_output += '<th scope="row">' + str(v) + '</th>'

            sums = all_sums[i]
            for s in sums:
                t_output += '<td>'
                t_output += str(s)
                t_output += '</td>'

            if any_nan:
                t_output += '<td>' + str(num_nans[i]) + '</td>'

            t_output += _add_button(v, i)
            t_output += '</tr>'

    elif data_type == 'cat':
        for i, v in enumerate(button_names):
            vals, n_nan = _get_col(ML.covars, v)
            t_output += '<th scope="row">' + str(v) + '</th>'

            for val_cat in [num_cats[i], min_cats[i],
                            min_vals[i], max_cats[i], max_vals[i]]:

                t_output += '<td>'
                t_output += str(val_cat)
                t_output += '</td>'

            if any_nan:
                t_output += '<td>' + str(num_nans[i]) + '</td>'

            t_output += _add_button(v, i)
            t_output += '</tr>'

    t_output += '</tbody></table>'

    return t_output


def _get_col(data, v):

    col = data[v]
    non_nan_col = col[~pd.isnull(col)]
    n_nan_subjects = len(col) - len(non_nan_col)

    return np.array(non_nan_col), n_nan_subjects


def _extract_from_logs(lines, if_keys, up_to_keys, s_funcs, ignore=None):

    if ignore is None:
        ignore = []

    output = '<ul> '

    for line in lines:

        if any([key in line for key in ignore]):
            continue

        for key in if_keys:
            if key in line:
                output += '<li>'
                line = line.replace('\n', '')
                output += wrap_check(line)
                output += '</li>'

        for key in up_to_keys:

            if key in line:
                output += '<li>'
                output += wrap_check(line[:line.index(key) + len(key)])
                output += '</li>'

        for s_func in s_funcs:
            output += wrap_check(s_func(line))

    output += '</ul>'
    return output


def wrap_check(chunk, max_sz=35):

    chunks = chunk.split(' ')
    new = chunks[0]
    sz = len(new)

    for c in chunks[1:]:
        if sz + (len(c)+1) > max_sz:
            new += '<br>' + c
            sz = 0
        else:
            new += ' ' + c
            sz += (len(c)+1)

    return new


def output_from_single_logs(log_dr, output_loc):

    try:
        return _output_from_single_logs(log_dr)
    except Exception as e:
        save_error('Error reading info from ML logs', output_loc, e)


def _output_from_single_logs(log_dr):

    with open(os.path.join(log_dr, 'logs.txt'), 'r') as f:
        lines = f.readlines()

    if_keys = ['Dropped value(s)',
               'Dummy coding by dropping col',
               'Loaded Shape',
               'Min-Max value ',
               'Note: ',
               'outside of included subjects',
               ' excluded subjects',
               'Total inclusion subjects:',
               'rows/subjects in computing overlap with',
               'New Shape',
               'Filtering for outliers']

    up_to_keys = [' rows for missing values']

    def s_func1(line):

        output = ''

        key = ' rows based on filter input params'
        if key in line:
            output += '<li>'
            line = line[:line.index(key) + len(key)].replace('Score', 'value')
            line += '.'
            line = line.replace('filter input', 'outlier options')
            output += line
            output += '</li>'

        return output

    ignore = ['Removed excluded subjects from loaded dfs']

    output = _extract_from_logs(lines, if_keys, up_to_keys, [s_func1],
                                ignore=ignore)

    return output


def save_results(output_loc, output):

    try:
        with open(output_loc, 'w') as f:
            json.dump(output, f)
    except Exception as e:
        save_error('Error saving output from ABCD_ML', output_loc, e)


def get_subjects_load(params, inclusions, exclusions, output_loc, v_type):

    try:
        params['inclusions'] = inclusions
        params['exclusions'] = exclusions
        params['set_params'] = None

        # hash + check
        param_hash, params =\
            get_subj_param_hash(params, v_type + '_subjects', output_loc)

        # If param hash None, then params actually == loaded cached subjects
        if param_hash is None:
            return params

        # If not, load the subjects newly
        ML, _ = init_ML(None, output_loc, params)
        ML = load_var(ML, params, output_loc, v_type, drops=False)

        if v_type == 'variable':
            subjects = set(list(ML.covars.index))
        elif v_type == 'target':
            subjects = set(list(ML.targets.index))

        # Save to cache
        save_cache_subjects(param_hash, subjects)

        return subjects

    except Exception as e:
        save_error('Error loading ' + params['-input'] + ' for computing' +
                   ' overlapping subjects', output_loc, e)


def get_strat_subjects(params, output_loc):

    try:

        # hash + check
        param_hash, params =\
            get_subj_param_hash(params, 'strat_subjects', output_loc)

        # If param hash None, then params actually == loaded cached subjects
        if param_hash is None:
            return params

        ML, _ = init_ML(None, output_loc, params)
        ML = load_strat(ML, params, output_loc, drops=False)
        strat_subjects = set(list(ML.strat.index))

        # Save to cache
        save_cache_subjects(param_hash, strat_subjects)

        return strat_subjects

    except Exception as e:
        save_error('Error loading ' + params['-input'] + ' for computing' +
                   ' overlapping subjects', output_loc, e)


def get_set_subjects(params, inclusions, exclusions, output_loc):

    try:
        params['inclusions'] = inclusions
        params['exclusions'] = exclusions

        # hash + check
        param_hash, params =\
            get_subj_param_hash(params, 'set_subjects', output_loc)

        # If param hash None, then params actually == loaded cached subjects
        if param_hash is None:
            return params

        # If not caches, load the set subjects
        ML, _ = init_ML(None, output_loc, params)
        ML = load_set(ML, params, output_loc, drops=False)
        set_subjects = set(list(ML.covars.index))

        # Save to cache
        save_cache_subjects(param_hash, set_subjects)

        return set_subjects

    except Exception as e:
        save_error('Error loading ' + params['-input'] + ' for computing' +
                   ' overlapping subjects', output_loc, e)


def load_var(ML, params, output_loc, v_type, drops=True):

    if v_type == 'variable':
        return load_variable(ML, params, output_loc, drops=drops)
    elif v_type == 'target':
        return load_target(ML, params, output_loc, drops=drops)
    elif v_type == 'strat':
        return load_strat(ML, params, output_loc, drops=drops)


def set_target_subjects(params, output_loc):

    subjects = []

    if 'target_params' in params:
        for key in params['target_params']:
            target_subjects =\
                get_subjects_load(params['target_params'][key],
                                  params['inclusions'],
                                  params['exclusions'],
                                  output_loc, 'target')
            subjects.append(target_subjects)

    if len(subjects) > 0:
        params['target_subjects'] = subjects[0]
        for s in subjects[1:]:
            params['target_subjects'].intersection_update(s)
    else:
        params['target_subjects'] = set()

    return params


def set_strat_subjects(params, output_loc):

    subjects = []

    if 'strat_params' in params:
        for key in params['strat_params']:
            strat_subjects =\
                get_strat_subjects(params['strat_params'][key], output_loc)

            subjects.append(strat_subjects)

    if len(subjects) > 0:
        params['strat_subjects'] = subjects[0]
        for s in subjects[1:]:
            params['strat_subjects'].intersection_update(s)
    else:
        params['strat_subjects'] = set()

    return params


def set_data_subjects(params, output_loc):

    subjects = []

    if 'data_params' in params:

        for key in params['data_params']:

            if key.endswith('-var'):
                var_subjects =\
                    get_subjects_load(params['data_params'][key],
                                      params['inclusions'],
                                      params['exclusions'],
                                      output_loc, 'variable')
                subjects.append(var_subjects)

            elif key.endswith('-set'):
                set_subjects =\
                    get_set_subjects(params['data_params'][key],
                                     params['inclusions'],
                                     params['exclusions'],
                                     output_loc)
                subjects.append(set_subjects)

    if len(subjects) > 0:
        params['data_subjects'] = subjects[0]

        for s in subjects[1:]:
            params['data_subjects'].intersection_update(s)
    else:
        params['data_subjects'] = set()

    return params


def check_set_params(params):

    if '-var-space' in params['key']:
        ind = params['key'].index('-var-space')
        set_key = params['key'][:ind]
        params['set_params'] = params['data_params'].pop(set_key)
    else:
        params['set_params'] = None

    return params


def proc_main_input(params, output_loc):

    try:
        params = check_set_params(params)
    except Exception as e:
        save_error('Error checking set params', output_loc, e)

    try:
        params = set_target_subjects(params, output_loc)
    except Exception as e:
        save_error('Error setting target subjects', output_loc, e)

    try:
        params = set_data_subjects(params, output_loc)
    except Exception as e:
        save_error('Error setting data subjects', output_loc, e)

    try:
        params = set_strat_subjects(params, output_loc)
    except Exception as e:
        save_error('Error setting non-input variable subjects', output_loc, e)

    return params


def base_single_load(user_dr, v_type, n):

    output_loc = os.path.join(user_dr, 'ML_Output' + str(n) + '.json')

    # Load in params
    params = load_params(user_dr, output_loc, n)

    # Perform initial processing
    params = init_proc_params(params, output_loc, inc_exc=True)

    # After init proc of params, check the loading cache
    # If results cached will set the results and exit the script
    param_hash = check_loading_cache(params, output_loc, v_type)

    # Perform procs / checks on input
    params = proc_main_input(params, output_loc)

    # Init ML object
    ML, log_dr = init_ML(user_dr, output_loc, params, n=n)

    return params, output_loc, ML, log_dr, param_hash


def base_finish_load(output_loc, output, params, param_hash, v_type):

    # Set status to finish
    output['status'] = 1

    # Save the results
    save_results(output_loc, output)

    # Save also to the loading cache
    save_to_loading_cache(output, param_hash)

    # And increment the input cache
    incr_input_cache(v_type, params)


def variable_load(user_dr, v_type, n):

    # Base overlapping loading steps
    params, output_loc, ML, log_dr, param_hash =\
        base_single_load(user_dr, v_type, n)

    # Load variable
    try:
        ML = load_var(ML, params, output_loc, v_type, drops=True)
    except Exception as e:
        save_error('Unknown loading error:',
                   output_loc, e)

    ML._print('loaded variable')

    # Save a copy of the dist figure
    img_loc, d_dfs = plot_dist(params, ML, v_type, log_dr, output_loc)

    ML._print('plotted Dist')

    # Generate output
    output = {}
    output['img_loc'] = img_loc
    output['html_output'] = output_from_single_logs(log_dr, output_loc)
    output['html_table'] = get_variable_table_html(d_dfs)

    # Save + cache, etc..
    base_finish_load(output_loc, output, params, param_hash, v_type)


def rnd(val):

    if isinstance(val, float):
        return str(np.round(val, 5))

    return str(val)


def get_variable_table_html(d_dfs):

    df = d_dfs[0]

    # Get rid of index if there
    df = df.reset_index()
    df = df.rename({'index': ''}, axis=1)

    # Create table
    t_output = '<table id="default-table-id" class="table table-striped">'
    t_output += '<thead><tr>'

    # Create header
    for col in list(df):
        t_output += '<th scope="col">' + str(col) + '</th>'
    t_output += '</tr></thead><tbody>'

    # Create body
    for index, row in df.iterrows():
        t_output += '<tr>'
        t_output += '<th>' + rnd(row.values[0]) + '</th>'
        for val in row.values[1:]:
            t_output += '<td>' + rnd(val) + '</td>'
        t_output += '</tr>'

    t_output += '</tbody></table>'

    return t_output


def set_load(user_dr, n):

    v_type = 'set'

    # Base overlapping loading steps
    params, output_loc, ML, log_dr, param_hash = base_single_load(
        user_dr, v_type, n)

    # Load the passed set data
    ML = load_set(ML, params, output_loc, drops=True)

    # Generate set output + table
    output = {}
    output['html_output'], output['html_table'] =\
        get_set_output(log_dr, ML, params, output_loc)

    # Save + cache, etc..
    base_finish_load(output_loc, output, params, param_hash, v_type)


def load_all_data(params, output_loc, user_dr, n):

    # Proc inc/excl + nested defaults
    params = init_proc_params(params, output_loc, inc_exc=True)

    # Check cache
    param_hash = check_loaded_cache(params, output_loc, user_dr, n)

    # If not str, then means was loaded from saved cache
    if not isinstance(param_hash, str):
        return param_hash

    # Init ML object - this also sets any incl / excl to the ML obj
    ML, log_dr = init_ML(user_dr, output_loc, params, n=n)

    # Load targets
    if 'target_params' not in params:
        save_error('No valid target variable specified!', output_loc)
    for key in params['target_params']:
        ML = load_target(ML, params['target_params'][key],
                         output_loc, drops=False)

    # Load data
    if 'data_params' not in params:
        save_error('No valid data specified!', output_loc)
    for key in params['data_params']:
        if key.endswith('-var'):
            ML = load_variable(ML, params['data_params'][key],
                               output_loc, drops=False)
        elif key.endswith('-set'):
            ML = load_set(ML, params['data_params'][key],
                          output_loc, drops=False)

    # Load strat variables
    if 'strat_params' in params:
        for key in params['strat_params']:
            ML = load_strat(ML, params['strat_params'][key],
                            output_loc, drops=False)

    # Prep data
    ML.Prepare_All_Data()

    # Save to loaded cache - return ML has low memory applied
    ML = save_to_loaded_cache(ML, param_hash)

    return ML


def get_tr_only(val_params, output_loc):

    # If any train_only by value
    tr_only_subjects = set()

    if 'tr_only_by_val' in val_params:
        tr_only_subjects = get_by_val_subjects(val_params['tr_only_by_val'],
                                               output_loc)

    # Or passed file
    elif 'tr_onlys' in val_params:
        tr_only_subjects = proc_from_file(val_params['tr_onlys'])

    return tr_only_subjects


def get_subjects(eval_params, output_loc):

    # If any train_only by value
    subjects = set()

    if 'subjs_by_val' in eval_params:
        subjects = get_by_val_subjects(eval_params['subjs_by_val'],
                                       output_loc)

    # Or passed file
    elif 'subjs_file' in eval_params:
        subjects = proc_from_file(eval_params['subjs_file'])

    # If none of the above, use all
    else:
        subjects = 'all'

    return subjects


def get_CV_from_params(val_params, output_loc, strat_u_name):

    if isinstance(val_params, str):
        return CV()

    val_type = 'random'
    if '-val-type' in val_params:
        val_type = val_params['-val-type']

    groups, stratify = None, None

    if val_type == 'group':
        groups = val_params['-group-text']

    elif val_type == 'stratify':

        # Special case for stratify
        stratify = []
        for strat in val_params['-stratify-text']:
            if ' (non-input)' in strat:
                strat = strat.replace(' (non-input)', strat_u_name)
            elif ' (target)' in strat:
                strat = strat.replace(' (target)', '')
            stratify.append(strat)

    try:
        train_only_subjects = get_tr_only(val_params, output_loc)
    except Exception as e:
        save_error('Error proc. train only subjs', output_loc, e)

    cv_params = CV(groups=groups, stratify=stratify,
                   train_only_subjects=train_only_subjects)

    return cv_params


def get_val_output_from_logs(log_dr):

    with open(os.path.join(log_dr, 'logs.txt'), 'r') as f:
        lines = f.readlines()

    if_keys = ['Train only subjects defined.',
               'CV defined with stratifying behavior over',
               'CV defined with group preserving over']

    output = _extract_from_logs(lines, if_keys, [], [])

    table_start = None
    for i, line in enumerate(lines):
        if 'CV defined with stratifying behavior over' in line:
            table_start = i

    # If not stratifying, return no table
    if table_start is None:
        return output, ''

    # If here, then there is a strat table
    t_output = '<table id="default-table-id" class="table table-striped">'
    t_output += '<thead><tr>'

    # Make header
    header = lines[table_start+1]
    header = chunk_line(header)
    for h in header:
        t_output += '<th scope="col">' + h + '</th>'
    t_output += '</tr></thead>'

    # Fill in body
    t_output += '<tbody>'
    for line in lines[table_start+2:]:
        line = chunk_line(line)

        if len(line) > 0:
            t_output += '<tr>'

            # Skip index
            for e in line[1:]:
                t_output += '<td>' + e + '</td>'
            t_output += '</tr>'
        else:
            break

    t_output += '</tbody></table>'

    return output, t_output


def apply_test_split(test_params, ML, output_loc):

    if 'val_params' in test_params:
        try:
            cv_params = get_CV_from_params(test_params['val_params'],
                                           output_loc, ML.strat_u_name)
        except Exception as e:
            save_error('Error creating CV params', output_loc, e)

        ML._print(cv_params)

        test_size = .2
        if test_params['test-size-type'] == 'percent':
            test_size = float(test_params['test-size']) / 100
        else:
            test_size = int(float(test_params['test-size']))

        random_state = int(float(test_params['random_state']))

        try:
            ML.Train_Test_Split(test_size=test_size, CV=cv_params,
                                random_state=random_state)
        except Exception as e:
            save_error('Error with test split', output_loc, e)

    else:

        test_subjects = None

        if 'test_only_by_val' in test_params:
            test_subjects =\
                get_by_val_subjects(test_params['test_only_by_val'],
                                    output_loc)
        elif 'test_subjs_file' in test_params:
            test_subjects =\
                proc_from_file(test_params['test_subjs_file'])

        try:
            ML.Train_Test_Split(test_subjects=test_subjects)
        except Exception as e:
            save_error('Error with test split', output_loc, e)


def get_test_output_from_logs(log_dr):

    with open(os.path.join(log_dr, 'logs.txt'), 'r') as f:
        lines = f.readlines()

    if_keys = ['Performing split on',
               'Train size:',
               'Test size:',
               'random_state:',
               'Test split size']

    output = _extract_from_logs(lines, if_keys, [], [])

    return output, ''
