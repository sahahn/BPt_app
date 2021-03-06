
import json
import sys


def save_error(msg, output_loc, e=None):

    error_output = {}
    error_output['html_output'] = ''
    error_output['status'] = -1
    error_output['error'] = msg

    if e is not None:
        error_output['error'] += ' - ' + repr(e)

    with open(output_loc, 'w') as f:
        json.dump(error_output, f)

    sys.exit()


def save_subjects(loc, subjs):

    with open(loc, 'w') as f:
        for s in subjs:
            f.write(s + '\n')


def load_subjects(loc, as_set=True):

    with open(loc, 'r') as f:
        lines = f.readlines()
        subjs = [s.rstrip() for s in lines]

    if as_set:
        subjs = set(subjs)

    return subjs


def proc_title_length(title, br='-<br>'):

    LIM = 50

    new_title = ''
    for i in range(LIM, len(title)+(LIM-1), LIM):

        if i >= len(title):
            new_title += title[i-LIM:]
        else:
            new_title += title[i-LIM:i] + br

    return new_title
