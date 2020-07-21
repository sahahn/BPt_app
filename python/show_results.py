import argparse
import os
import json
import pickle as pkl
from utils import save_error
from loading import save_results
import numpy as np


def check_round(val):
    try:
        return str(np.round(float(val), 5))
    except ValueError:
        return str(val)


def get_table_html(results):

    table_html = '<table id="TEMP-ID" class="table table-striped" '
    table_html += 'style="width:100%">'
    table_html += '<thead><tr>'

    for col in ['Metric', 'Mean', 'Macro STD', 'Micro STD']:
        table_html += '<th scope="col">' + col + '</th>'

    table_html += '</tr></thead><tbody>'

    for i, scorer in enumerate(results['scorer_strs']):
        table_html += '<tr>'
        table_html += '<th>' + scorer + '</th>'

        for field in results['summary_scores'][i]:
            table_html += '<td>' + check_round(field) + '</td>'
        table_html += '</tr>'

    table_html += '</tbody></table>'

    return table_html


def main(user_dr, job_name):

    # Should switch over all quick py runs to using temp
    # temp_dr = os.path.join(user_dr, 'temp')
    temp_dr = user_dr

    params_loc = os.path.join(temp_dr, 'ML_Params' + str(job_name) + '.json')
    output_loc = os.path.join(temp_dr, 'ML_Output' + str(job_name) + '.json')

    with open(params_loc, 'r') as f:
        params = json.load(f)['params']

    project_dr = os.path.join(user_dr, 'Jobs', params['project_id'])
    job_dr = os.path.join(project_dr, job_name)
    results_loc = os.path.join(job_dr, 'results.pkl')

    try:
        with open(results_loc, 'rb') as f:
            results = pkl.load(f)
    except Exception as e:
        save_error('Error reading params', output_loc, e)

    try:
        table_html = get_table_html(results)
    except Exception as e:
        save_error('Error generating summary table', output_loc, e)

    output = {'table_html': table_html}
    save_results(output_loc, output)


if __name__ == "__main__":

    parser = argparse.ArgumentParser(
        description='ABCD_ML Show Results Script')
    parser.add_argument('user_dr', type=str,
                        help='Location of the created users'
                             'directory to work in')
    parser.add_argument('n', type=str,
                        help='')
    args = parser.parse_args()
    main(args.user_dr, args.n)
