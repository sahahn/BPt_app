import argparse
import json
import os
import pickle as pkl
from utils import save_error, save_results


def get_raw_preds_table_html(df):

    table_html = '<table id="TEMP-ID" class="table table-striped" '
    table_html += 'style="width: 100%">'
    table_html += '<thead><tr>'

    cols = ['src_subject_id'] + list(df)
    for col in cols:
        table_html += '<th scope="col">' + str(col) + '</th>'

    table_html += '</tr></thead><tbody>'

    f_rows = []
    for subj, row in df.iterrows():
        f_rows.append([str(subj)] + [str(v) for v in row.values])

    table_html += '</tbody></table>'
    return table_html, f_rows


def main(user_dr, job_name):

    temp_dr = os.path.join(user_dr, 'temp')
    params_loc = os.path.join(temp_dr, 'ML_Params_' + str(job_name) + '.json')
    output_loc = os.path.join(temp_dr, 'ML_Output_' + str(job_name) + '.json')

    with open(params_loc, 'r') as f:
        params = json.load(f)['params']

    project_dr = os.path.join(user_dr, 'Jobs', params['project_id'])
    job_dr = os.path.join(project_dr, job_name)
    preds_loc = os.path.join(job_dr, 'raw_preds.pkl')

    try:
        with open(preds_loc, 'rb') as f:
            preds = pkl.load(f)
    except Exception as e:
        preds = None
        save_error('Error loading raw preds', output_loc, e)

    try:
        raw_preds, pred_rows = get_raw_preds_table_html(preds)
    except Exception as e:
        raw_preds, pred_rows = None, None
        save_error('Error generating raw preds table', output_loc, e)

    output = {'raw_preds': raw_preds,
              'pred_rows': pred_rows}

    save_results(output_loc, output)


if __name__ == "__main__":

    parser = argparse.ArgumentParser(
        description='BPt Show Raw Preds Script')
    parser.add_argument('user_dr', type=str,
                        help='Location of the created users'
                             'directory to work in')
    parser.add_argument('n', type=str,
                        help='')
    args = parser.parse_args()
    main(args.user_dr, args.n)
