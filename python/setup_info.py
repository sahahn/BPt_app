from ABCD_ML.pipeline.Ensembles import ENSEMBLES
from ABCD_ML.pipeline.Ensembles import AVALIABLE as AVALIABLE_ENSEMBLES
from ABCD_ML.pipeline.Feature_Selectors import SELECTORS
from ABCD_ML.pipeline.Feature_Selectors import AVALIABLE as AVALIABLE_SELECTORS
from ABCD_ML.pipeline.Transformers import TRANSFORMERS
from ABCD_ML.pipeline.Scalers import SCALERS
from ABCD_ML.pipeline.Imputers import IMPUTERS
from ABCD_ML.pipeline.Models import MODELS
from ABCD_ML.pipeline.Models import AVALIABLE as AVALIABLE_MODELS

import json
import inspect
from ABCD_ML.helpers.ML_Helpers import get_objects_by_type, get_objects
from ABCD_ML.helpers.Docstring_Helpers import get_name, get_scorer_name
from inspect import signature
import numpy as np
import re
import os
from ABCD_ML.pipeline.Scorers import get_scorers_by_type

import nevergrad as ng
from ABCD_ML.helpers.Default_Params import P


# Save ML Options Code

def save_ML_options(loc):

    options = {}
    options['model'] = get_by_type(AVALIABLE_MODELS, MODELS)
    options['imputers'] = get_not_by_type(IMPUTERS)
    options['scalers'] = get_not_by_type(SCALERS)
    options['transformers'] = get_not_by_type(TRANSFORMERS)
    options['feature_selectors'] = get_by_type(AVALIABLE_SELECTORS, SELECTORS)
    options['ensembles'] = get_by_type(AVALIABLE_ENSEMBLES, ENSEMBLES)
    options['parameter_search'] = [None] +\
        sorted(ng.optimizers.registry.keys())

    # Scorers
    options['metrics'] = {}
    for problem_type in ['binary', 'regression', 'categorical']:
        options['metrics'][problem_type] = {}

        by_type = get_scorers_by_type(problem_type)
        for scorer in by_type:
            options['metrics'][problem_type][scorer[0]] = {}
            options['metrics'][problem_type][scorer[0]]['docs_name'] =\
                get_scorer_name(scorer[1])

    with open(loc, 'w') as f:
        json.dump(options, f)


def proc_docs(obj, param_names):

    param_descrs = {}
    options = {}

    docs = inspect.getdoc(obj[1])
    if len(docs) < 250:
        docs = inspect.getdoc(obj[1].__init__)

    inds = []
    for name in param_names:
        p_name1 = '\n' + name + ' :'
        p_name2 = '\n' + name + ':'

        if p_name1 in docs:
            inds.append(docs.index(p_name1))
        elif p_name2 in docs:
            inds.append(docs.index(p_name2))
        else:
            param_descrs[name] = ''
            options[name] = ''

    if len(inds) == 0:
        return options, param_descrs

    inds.append(len(docs))
    inds = sorted(inds)

    for i in range(len(inds)-1):
        name, base, descr = extract_info(docs[inds[i]:inds[i+1]])

        options[name] = base
        param_descrs[name] = descr

    return options, param_descrs


def extract_info(doc_chunk):

    by_line = doc_chunk.split('\n')

    try:
        by_line[1].split(' : ')[1]
        name = by_line[1].split(' : ')[0]
    except IndexError:
        name = by_line[1].split(': ')[0]

    base = by_line[1]
    base = cat_options_check(base)

    # Override if class_weight
    if name == 'class_weight':
        base = ['None', 'balanced']

    elif name == 'initial_strategy':
        base = ['mean', 'median', 'most_frequent', 'constant']

    elif name == 'imputation_order':
        base = ['ascending', 'descending', 'roman', 'arabic', 'random']

    # Get the doc descr
    descr = ''
    for line in by_line[2:]:
        if (len(line.strip()) != 0):

            if line.startswith(' '):
                descr += line + '\n'
            else:
                break

    return name, base, descr


def cat_options_check(base):

    search = re.finditer(r'\{.*?\}', base)

    try:
        in_brackets = next(search).group(0)
    except StopIteration:
        return ''

    in_brackets = in_brackets.replace('{', '').replace('}', '')
    options = in_brackets.split(',')
    options = [o.lstrip() for o in options]

    return options


def get_param_names(obj):

    try:
        param_names =\
            obj[1]._get_param_names()
    except AttributeError:
        param_names =\
            dict(inspect.getmembers(obj[1].__init__.__code__))['co_varnames']

    param_names = [p for p in param_names if p !=
                   'self' and p != 'kwargs' and p != 'mapping']
    return param_names


def add_default_params(obj_params, obj, param_names):
    default_params = {}

    sig = signature(obj[1])
    for name, param in sig.parameters.items():

        val = param.default
        if callable(val):
            val = repr(val)

        if val is np.nan:
            val = 'NaN'

        default_params[param.name] = val

    default_params = [default_params[p]
                      if p in default_params else '' for p in param_names]

    # Save types
    obj_params['default_param_types'] =\
        [type(p).__name__ for p in default_params]

    default_params = [repr(p) for p in default_params]
    obj_params['default_params'] = default_params


def add_od_from_docs(obj_options, obj, param_names):

    os, descrs = proc_docs(obj, param_names)
    os = [os[p] if p in os else '' for p in param_names]
    descrs = [descrs[p] if p in descrs else '' for p in param_names]

    obj_options['options'] = os
    obj_options['descrs'] = descrs


def get_obj_params(obj, obj_type=None):

    obj_params = {}

    # Save docstring name
    obj_params['docs_name'] = get_name(obj[1])

    # Save preset params
    obj_params['preset_params'] = obj[2]

    # Save param names
    param_names = get_param_names(obj)
    obj_params['param_names'] = param_names

    # Add default params
    add_default_params(obj_params, obj, param_names)

    # Add options + descriptions
    add_od_from_docs(obj_params, obj, param_names)

    # Custom changes
    for i in range(len(obj_params['default_param_types'])):

        # Save any bool w/ choices
        if obj_params['default_param_types'][i] == 'bool':
            obj_params['options'][i] = ['True', 'False']

        # Set score func w/ choices
        elif obj_params['param_names'][i] == 'score_func':
            if obj_type == 'regression':
                obj_params['options'][i] = [
                    'f_regression', 'mutual_info_regression', 'chi2']
            elif obj_type == 'categorical' or obj_type == 'binary':
                obj_params['options'][i] = [
                    'f_classif', 'mutual_info_classif', 'chi2']

        elif obj_params['param_names'][i] == 'n_features_to_select':
            obj_params['descrs'][i] = '   The number of features to select. ' +\
                                      'If `None`, half of the features are selected. ' +\
                                      'If a floating point number between 0 and 1, that percentage ' +\
                                      'of the total features will be selected.'

    return obj_params


def get_by_type(AVALIABLE, OBJS):

    problem_types = ['binary', 'regression', 'categorical']
    opts = {}

    for pt in problem_types:
        opts[pt] = {}
        objs = get_objects_by_type(pt, AVALIABLE, OBJS)

        for obj in objs:
            n = obj[0]
            n = n.replace(' regressor', '').replace(
                ' classifier', '').replace(' logistic', '')

            opts[pt][n] = get_obj_params(obj, obj_type=pt)

    return opts


def get_not_by_type(OBJS):

    opts = {}
    objs = get_objects(OBJS)
    for obj in objs:

        n = obj[0]
        opts[n] = get_obj_params(obj)

    return opts


def get_between(txt, s, e):

    stack = []

    for i in range(len(txt)):
        if txt[i] == s:
            stack.append(i)
        elif txt[i] == e:

            if len(stack) == 1:
                return txt[stack[0]+1: i]
            else:
                stack.pop()

    return ''


# Save default params code

def save_default_params(loc):
    def_param_dists = P.copy()

    dist_keys = list(def_param_dists)
    for dist_key in dist_keys:
        keys = list(def_param_dists[dist_key])

        for key in keys:
            val = def_param_dists[dist_key][key]

            if 'ng.p.' in val:
                result = check(val)

                if len(result) == 1:
                    new_val = {}
                    new_val['code'] = {'-code': result[0]}
                    new_val['type'] = 'code'
                    new_val['on'] = 'true'
                    new_val['code_type'] = "-"
                    def_param_dists[dist_key][key+'_dist'] = new_val
                    # def_param_dists[dist_key][key+'_type'] = "-"

                else:
                    new_val = {}
                    new_val[result[1]] = result[0]
                    new_val['type'] = result[1]
                    new_val['on'] = 'true'

                    # Set saved type or - if choice
                    if len(result) == 3:
                        new_val[result[1] + '_type'] = result[2]
                    else:
                        new_val[result[1] + '_type'] = '-'

                    def_param_dists[dist_key][key+'_dist'] = new_val

                # Change old key to use default
                def_param_dists[dist_key][key] = 'USE-DEFAULT'

            # Save param type if not a dist
            else:

                try:
                    val_type = type(eval(val)).__name__
                except NameError:
                    val_type = "-"

                def_param_dists[dist_key][key+'_type'] = val_type

    with open(loc, 'w') as f:
        json.dump(def_param_dists, f)


def get_split(val):

    cnt = 0
    start = 0
    split = []

    for i in range(len(val)):

        if val[i] == '(':
            cnt += 1
        elif val[i] == ')':
            cnt -= 1

        elif val[i] == ',' and cnt == 0:
            split.append(val[start:i])
            start = i

    split.append(val[start:])
    return split


def check(val):

    if 'ng.p.' in val:

        # Check if transition Choice
        ind = val.find('ng.p.TransitionChoice')
        if ind != -1:
            inside = get_between(val[ind:], '(', ')')
            choices = inside[1:-1].split(',')
            actual = eval(inside)

            if len(actual) != len(choices):

                if 'ng.p.' in inside:
                    options = [check(c) for c in get_split(inside[1:-1])]
                elif 'np.' in inside:
                    options = [(repr(a), ) for a in list(actual)]
            else:
                options = [check(c) for c in choices]

            result = {'-choices': []}
            n_cnt = 0
            l_cnt = 0

            for option in options:
                if len(option) == 3:

                    if option[1] == 'log':
                        l_cnt += 1
                        result['Log-'+str(l_cnt) + '_type'] = option[2]
                        result['-choices'].append('Log-'+str(l_cnt))
                        result['log-'+str(l_cnt)] = option[0]

                    elif option[1] == 'normal':
                        n_cnt += 1
                        result['Normal-'+str(n_cnt) + '_type'] = option[2]
                        result['-choices'].append('Normal-'+str(n_cnt))
                        result['normal-'+str(n_cnt)] = option[0]

                elif len(option) == 2:
                    print('Warning nested choices are not supported here yet')
                else:
                    result['-choices'].append(option[0])

            return (result, 'transition')

        dist_type = None

        ind = val.find('ng.p.Scalar')
        if ind != -1:
            dist_type = 'normal'

        ind = val.find('ng.p.Log')
        if ind != -1:
            dist_type = 'log'

        if dist_type is not None:
            if dist_type == 'normal':
                ind = val.find('ng.p.Scalar')

            p_type = 'float'
            if '.set_integer_casting()' in val:
                p_type = 'int'

            inside = get_between(val[ind:], '(', ')')

            result = {}
            params = inside.split(',')

            if len(inside) > 0:
                for p in params:
                    split = p.split('=')
                    p_name = split[0].strip()
                    p_val = split[1].strip()
                    result['-'+p_name] = p_val
            else:
                result['-lower'] = 0
                result['-upper'] = 1
                result['-init'] = .5

            if '-exponent' not in result and dist_type == 'log':
                result['-exponent'] = 2

            return (result, dist_type, p_type)

    return (val.strip(), )


if __name__ == "__main__":

    cache_dr = '/var/www/html/data/ABCD/ABCD_ML_Cache'
    save_ML_options(os.path.join(cache_dr, 'ML_options.json'))
    save_default_params(os.path.join(cache_dr, 'default_param_dists.json'))
