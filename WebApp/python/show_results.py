import argparse
import os
import json
import pickle as pkl
from utils import save_error
from loading import save_results
import numpy as np
import time


def check_round(val):
    try:
        return str(np.round(float(val), 5))
    except ValueError:
        return str(val)


def get_table_html(results):

    if 'summary_scores' not in results:
        results['summary_scores'] = results['scores']

    n_repeats = int(float(results['n_repeats']))
    n_splits = int(float(results['n_splits']))

    table_html = '<table id="TEMP-ID" class="table table-striped" '
    table_html += 'style="width:100%">'
    table_html += '<thead><tr>'

    cols = ['Metric']

    if n_splits == 1:
        cols.append('Score')

        if n_repeats > 1:
            cols.append('STD')

    else:
        cols.append('Mean Score')

        if n_repeats == 1:
            cols.append('STD')
        else:
            cols += ['Macro STD', 'Micro STD']

    for col in cols:
        table_html += '<th scope="col">' + col + '</th>'

    table_html += '</tr></thead><tbody>'

    for i, scorer in enumerate(results['scorer_strs']):
        table_html += '<tr>'
        table_html += '<th>' + scorer + '</th>'

        for field in results['summary_scores'][i][:len(cols)-1]:
            table_html += '<td>' + check_round(field) + '</td>'
        table_html += '</tr>'

    table_html += '</tbody></table>'

    return table_html


def get_raw_preds_table_html(results):

    df = results['raw_preds']

    table_html = '<table id="TEMP-ID" class="table table-striped" '
    table_html += 'style="width: 100%">'
    table_html += '<thead><tr>'

    cols = ['src_subject_id'] + list(df)
    for col in cols:
        table_html += '<th scope="col">' + str(col) + '</th>'

    table_html += '</tr></thead><tbody>'

    # for subj, row in df.iterrows():
    #     table_html += '<tr>'
    #     table_html += '<th>' + str(subj) + '</th>'
    #     for val in row.values:
    #         table_html += '<td>' + str(val) + '</td>'
    #     table_html += '</tr>'

    f_rows = []
    for subj, row in df.iterrows():
        f_rows.append([str(subj)] + [str(v) for v in row.values])

    table_html += '</tbody></table>'
    return table_html, f_rows


def main(user_dr, job_name):

    # Should switch over all quick py runs to using temp
    temp_dr = os.path.join(user_dr, 'temp')
    params_loc = os.path.join(temp_dr, 'ML_Params_' + str(job_name) + '.json')
    output_loc = os.path.join(temp_dr, 'ML_Output_' + str(job_name) + '.json')

    with open(params_loc, 'r') as f:
        params = json.load(f)['params']

    project_dr = os.path.join(user_dr, 'Jobs', params['project_id'])
    job_dr = os.path.join(project_dr, job_name)
    results_loc = os.path.join(job_dr, 'results.pkl')

    retry_cnt = 0
    while retry_cnt < 10:

        try:
            with open(results_loc, 'rb') as f:
                results = pkl.load(f)
                retry_cnt = 20
        except FileNotFoundError:
            time.sleep(1)
            retry_cnt += 1

    if retry_cnt != 20:
        save_error('Error reading saved results', output_loc)

    try:
        table_html = get_table_html(results)
    except Exception as e:
        save_error('Error generating summary table', output_loc, e)

    try:
        raw_preds, pred_rows = get_raw_preds_table_html(results)
    except Exception as e:
        save_error('Error generating raw preds table', output_loc, e)

    output = {'table_html': table_html,
              'raw_preds': raw_preds,
              'pred_rows': pred_rows}

    save_results(output_loc, output)


if __name__ == "__main__":

    parser = argparse.ArgumentParser(
        description='BPt Show Results Script')
    parser.add_argument('user_dr', type=str,
                        help='Location of the created users'
                             'directory to work in')
    parser.add_argument('n', type=str,
                        help='')
    args = parser.parse_args()
    main(args.user_dr, args.n)
