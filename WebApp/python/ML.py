
import os
import json
from utils import save_error
from load_test_split import base_test_load
from loading import get_subjects, get_CV_from_params

from BPt import (Problem_Spec, Model_Pipeline,
                     Imputer, Scaler,
                     Transformer, Feat_Selector,
                     Model, Ensemble,
                     Param_Search, Select)

import nevergrad as ng
import numpy as np
from sklearn.feature_selection import (f_regression, f_classif,
                                       mutual_info_classif,
                                       mutual_info_regression, chi2)

def get_param_keys(params_in):

    param_keys = set()

    for p_name in list(params_in):
        original = p_name

        for key in ['_type', '_dist']:
            cnt = p_name.count(key)

            if cnt == 1 and original.endswith(key):
                p_name = p_name.replace(key, '')
            elif cnt > 1 and original.endswith(key):
                r_p_name = p_name[::-1]
                r_p_name = r_p_name.replace(key[::-1], '', 1)
                p_name = r_p_name[::-1]

        param_keys.add(p_name)

    return param_keys


def proc_val(val, p_type=None):

    # Check for None
    if val == 'None' or val is None:
        return None

    # Warn if use default show up here, it should not
    if val == 'USE-DEFAULT':
        print('Warning use default propegated')
        return None

    # Start by trying to eval the value
    # we know here it will be a str,
    # but want to catch the requested str
    # but no quotes cases
    try:
        val = eval(val)
    except NameError:
        if p_type == 'str':
            val = val

    # If type is '-', means just infer, no explicit casting
    if p_type == '-' or p_type is None:
        return val

    # Now try to explicitly cast to requested type
    val = eval(p_type)(val)

    return val


def base_ilu_proc(dist_params, p_type):

    ps = {'init': None,
          'lower': None,
          'upper': None}

    if '-init' in dist_params:
        ps['init'] = proc_val(dist_params['-init'], p_type)
    if '-lower'in dist_params:
        ps['lower'] = proc_val(dist_params['-lower'], p_type)
    if '-upper' in dist_params:
        ps['upper'] = proc_val(dist_params['-upper'], p_type)

    return ps


def get_normal_dist(dist_params, p_type):

    ps = base_ilu_proc(dist_params, p_type)
    dist = ng.p.Scalar(**ps)

    if p_type == 'int':
        dist = dist.set_integer_casting()

    return dist


def get_log_dist(dist_params, p_type):

    ps = base_ilu_proc(dist_params, p_type)
    ps['exponent'] = None
    if '-exponent' in dist_params:
        ps['exponent'] = proc_val(dist_params['-exponent'], 'float')

    dist = ng.p.Log(**ps)
    return dist


def get_base_choice_dist(dist_params):

    raw_choices = dist_params['-choices']
    choices = []

    for choice in raw_choices:

        # If not a sub dist will just fail
        try:
            choice_params = dist_params[choice.lower()]
        except KeyError:
            choice_params = None

        # If not subdist or no type will just fail
        try:
            p_type = dist_params[choice + '_type']
        except KeyError:
            p_type = None

        # Check / get different sub-dists
        if choice.startswith('Normal-'):
            val = get_normal_dist(choice_params, p_type)

        elif choice.startswith('Log-'):
            val = get_log_dist(choice_params, p_type)

        elif choice.startswith('Choice-'):
            val = get_choice_dist(choice_params)

        elif choice.startswith('Transition-'):
            val = get_transition_dist(choice_params)

        else:
            val = proc_val(choice, '-')

        choices.append(val)

    return choices


def get_choice_dist(dist_params):

    choices = get_base_choice_dist(dist_params)
    return ng.p.Choice(choices=choices)


def get_transition_dist(dist_params):

    choices = get_base_choice_dist(dist_params)
    return ng.p.TransitionChoice(choices=choices)


def get_code_dist(dist_params):

    code = dist_params['-code']

    # Can add more checks here if needed
    if 'import ' in code:
        return None

    return eval(code)


def proc_dist(dist):

    # Select the hyper params dist info
    selected_dist = dist['type']
    dist_params = dist[selected_dist]

    # Check for type
    try:
        p_type = dist[selected_dist + '_type']
    except KeyError:
        p_type = '-'
        print('no type for', selected_dist, 'setting to "-"')

    if selected_dist == 'normal':
        val = get_normal_dist(dist_params, p_type)
    elif selected_dist == 'log':
        val = get_log_dist(dist_params, p_type)
    elif selected_dist == 'choice':
        val = get_choice_dist(dist_params)
    elif selected_dist == 'transition':
        val = get_transition_dist(dist_params)
    elif selected_dist == 'code':
        val = get_code_dist(dist_params)
    else:
        print('warning unknown selected dist type', selected_dist)

    return val


def get_base_val(p_name, params_in):

    try:
        p_type = params_in[p_name + '_type']
    except KeyError:
        p_type = '-'
        print('no type for', p_name, 'setting to "-"')

    val = proc_val(params_in[p_name], p_type)
    return val


def proc_hyper_params(params_in):

    params_out = {}
    for p_name in get_param_keys(params_in):

        # Set the base value
        val = get_base_val(p_name, params_in)

        # Check if dist exists
        if p_name + '_dist' in params_in:

            # Make sure dist is set to on
            dist = params_in[p_name + '_dist']
            if dist['on'] == 'true':
                val = proc_dist(dist)

        # Set the eithert single val or hyper-param dist in params out
        params_out[p_name] = val

    return params_out


def get_sub_params(name, params):
    sub_params = {key.replace(
        name, '', 1): params[key] for key in params if key.startswith(name)}
    del sub_params['']
    return sub_params


def get_base_obj(obj_params):

    obj = obj_params['-obj-input']
    scope = obj_params['-scope-input']

    # The way post works, if params is empty, then wont show up
    if 'params' in obj_params:
        params = proc_hyper_params(obj_params['params'])
    else:
        params = {}

    return obj, params, scope


def get_select_sub_keys(key, p_params):

    keys = list(p_params)

    sub_keys = []
    for k in keys:
        if k.startswith(key) and len(key.split('-')) == len(k.split('-')):
            k_split = k.split('_')
            if len(k_split) > 1:
                select_split = k_split[1].split('-')
                if len(select_split) == 1:
                    print(k)
                    sub_keys.append(select_split[0])

    return [key + '_' + str(s) for s in sub_keys]


def get_keys_by_index(p_params):

    def by_index(key):

        try:
            index = float(p_params[key]['index'])
        except KeyError:
            index = 9999999

        return index

    all_keys = list(p_params)
    return sorted(all_keys, key=by_index)


def get_obj_from_params(name, obj_params, class_obj, p_params, sub_key=None):

    obj, params, scope = get_base_obj(obj_params)

    # If could have a sub model
    if sub_key is not None:

        base_model = None
        if obj_params['-obj-input'] == sub_key:
            sub_params = get_sub_params(name, p_params)
            base_model = get_model('-model-space-model', sub_params)

        # Add w/ sub model
        return class_obj(obj=obj, params=params,
                         scope=scope, base_model=base_model)

    # Otherwise, standard add
    else:
        return class_obj(obj=obj, params=params, scope=scope)


def get_pipeline_obj(name_key, class_obj, p_params, sub_key=None):

    objs = []

    for key in get_keys_by_index(p_params):

        split_key = key.split('-')
        if split_key[1] == name_key and len(split_key) == 4 and '_' not in key:

            name = '-'.join(split_key)

            # Get base imputer name
            obj_params = p_params[name]
            obj = get_obj_from_params(name, obj_params, class_obj,
                                      p_params, sub_key=sub_key)

            # If select
            if obj_params['select'] == 'true':
                select_objs = [obj]

                select_names = get_select_sub_keys(key, p_params)
                for s_name in select_names:

                    # Init select objects with base obj
                    s_obj_params = p_params[s_name]

                    # Get rest of select objects
                    select_objs.append(get_obj_from_params(s_name,
                                                           s_obj_params,
                                                           class_obj,
                                                           p_params,
                                                           sub_key=sub_key))

                    # Append to objs all of the objects Select wrapped
                    objs.append(Select(select_objs))

            # Otherwise just add obj
            else:
                objs.append(obj)

    if len(objs) == 0:
        return None

    return objs


def get_model_from_params(obj_params, model_name, p_params):

    if 'ensemble' not in obj_params:
        obj_params['ensemble'] = 'false'

    if obj_params['ensemble'] == 'true':
        return get_ensemble(model_name, p_params)
    else:
        obj, params, scope = get_base_obj(obj_params)
        return Model(obj=obj, params=params, scope=scope)


def get_model(model_name, p_params):

    obj_params = p_params[model_name]
    obj = get_model_from_params(obj_params, model_name, p_params)

    # If select
    if obj_params['select'] == 'true':

        # Init select objects with base obj
        select_objs = [obj]

        # Get each select model seperate
        select_names = get_select_sub_keys(model_name, p_params)
        for s_name in select_names:
            s_obj_params = p_params[s_name]

            select_objs.append(get_model_from_params(s_obj_params,
                                                     s_name,
                                                     p_params))

            # Wrap in Select
            return Select(select_objs)

    # If not select, just return model
    else:
        return obj


def get_ensemble(model_name, p_params):

    # Get base ensemble object first
    obj, params, scope = get_base_obj(p_params[model_name])
    is_des = p_params[model_name]['is_des'] == 'true'
    single_estimator = p_params[model_name]['single_estimator'] == 'true'

    # Get base models
    models = []
    for key in get_keys_by_index(p_params):
        if key.startswith(model_name + '-'):
            models.append(get_model(key, p_params))

    return Ensemble(obj=obj, models=models,
                    params=params, scope=scope,
                    is_des=is_des,
                    single_estimator=single_estimator)

def get_splits_CV(ps, error_output_loc, strat_u_name):

    if ps['split-type'] == 'kfold':
        splits = int(float(ps['-if-kfold']))
        n_repeats = int(float(ps['-repeats']))
    elif ps['split-type'] == 'single':
        splits = float(ps['-if-single'])
        n_repeats = int(float(ps['-repeats']))
    else:
        splits = ps['-group-text']
        n_repeats = 1

    CV = get_CV_from_params(ps['val_params'], error_output_loc, strat_u_name)
    return splits, n_repeats, CV

def get_param_search(p_params, error_output_loc, strat_u_name):

    ps = p_params['-parameter_search-space-parameter_search']

    # Return none if no search
    if ps['-search-type'] == 'None' or ps['-search-type'] is None:
        return None

    search_type = ps['-search-type']
    n_iter = int(float(ps['-n-iter']))
    scorer = ps['-metric']

    splits, n_repeats, CV = get_splits_CV(ps, error_output_loc, strat_u_name)

    return Param_Search(search_type=search_type,
                        splits=splits, n_repeats=n_repeats,
                        n_iter=n_iter, CV=CV,
                        scorer=scorer, weight_scorer=False)


def get_pipeline(eval_params, error_output_loc, strat_u_name):

    # Get pipe params with base pipe name removed
    pipe_params = eval_params['pipeline_params']
    pipe_name = eval_params['-pipeline']
    p_params = get_sub_params(pipe_name, pipe_params)

    # Extract each pice
    imputers = get_pipeline_obj(
        'imputers', Imputer, p_params, sub_key='iterative')
    scalers = get_pipeline_obj('scalers', Scaler, p_params)
    transformers = get_pipeline_obj('transformers', Transformer, p_params)
    feat_selectors = get_pipeline_obj(
        'feature_selectors', Feat_Selector, p_params, sub_key='rfe')
    model = get_model('-model-space-model', p_params)
    param_search = get_param_search(p_params, error_output_loc, strat_u_name)

    return Model_Pipeline(imputers=imputers,
                          scalers=scalers,
                          transformers=transformers,
                          feat_selectors=feat_selectors,
                          model=model,
                          param_search=param_search)


def get_problem_spec(eval_params, output_loc):

    # Input checks here maybe

    Problem_Spec()

    problem_spec =\
        Problem_Spec(problem_type=eval_params['problem_type'],
                     target=eval_params['-target'],
                     scorer=eval_params['-metrics'],
                     scope=eval_params['-scope-input'],
                     subjects=get_subjects(eval_params, output_loc),
                     random_state=int(float(eval_params['random_state'])),
                     n_jobs=int(float(eval_params['n-jobs'])))

    return problem_spec


def run_setup(user_dr, job_name):

    # Load params
    temp_dr = os.path.join(user_dr, 'temp')
    params_loc = os.path.join(temp_dr, 'ML_Params_' + str(job_name) + '.json')
    with open(params_loc, 'r') as f:
        params = json.load(f)['params']

    # Make sure project job directory exists first
    project_dr = os.path.join(user_dr, 'Jobs', params['project_id'])
    os.makedirs(project_dr, exist_ok=True)

    # Get job specific directory
    job_dr = os.path.join(project_dr, job_name)
    os.makedirs(job_dr, exist_ok=True)

    # Set error_output loc within job dr
    error_output_loc = os.path.join(job_dr, 'Error_Output.json')

    return params, job_dr, error_output_loc


def base_run(params, job_dr, error_output_loc, job_name):

    # Perform base test load - includes loading all data
    # The ML logs are created in temp dr
    ML = base_test_load(params, job_dr, error_output_loc, job_name)
    ML._print('Base test load finished.')

    # Get the pipeline
    try:
        model_pipeline = get_pipeline(params['eval_params'],
                                      error_output_loc, ML.strat_u_name)
    except Exception as e:
        save_error('Error parsing model pipeline', error_output_loc, e)

    ML._print(model_pipeline)
    ML._print(model_pipeline.feat_selectors)

    # Get the problem spec
    try:
        problem_spec = get_problem_spec(params['eval_params'],
                                        error_output_loc)
    except Exception as e:
        save_error('Error parsing problem spec', error_output_loc, e)

    # Set progress loc + verbosity on
    ML.Set_Default_ML_Verbosity(progress_loc=os.path.join(job_dr,
                                                          'progress.txt'),
                                fold_name=True,
                                time_per_fold=True,
                                score_per_fold=True,
                                fold_sizes=True,
                                pipeline_verbose=True,
                                best_params_score=True,
                                best_params=True,
                                save_to_logs=True)
    ML.Set_Default_ML_Verbosity()

    return model_pipeline, problem_spec, ML
