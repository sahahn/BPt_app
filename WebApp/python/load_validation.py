import argparse
import os
from utils import save_error
from loading import (load_params, load_all_data, get_CV_from_params,
                     get_val_output_from_logs, save_results)


def main(user_dr, n):

    temp_dr = os.path.join(user_dr, 'temp')
    output_loc = os.path.join(temp_dr, 'ML_Output_' + str(n) + '.json')

    # If existing output, remove
    if os.path.exists(output_loc):
        os.remove(output_loc)

    # Load in params
    params = load_params(user_dr, output_loc, n)

    # Load all data first
    loading_params = params['loading_params']

    try:
        ML = load_all_data(loading_params, output_loc, user_dr, n)
    except Exception as e:
        ML = None
        save_error('Error loading data', output_loc, e)

    log_dr = os.path.join(temp_dr, 'ML_Logs_' + str(n))

    # Get the CV param object
    try:
        cv_params = get_CV_from_params(params['val_params'], output_loc,
                                       ML.strat_u_name)
    except Exception as e:
        cv_params = None
        save_error('Error creating CV params', output_loc, e)

    # Obtain the CV splits from the BPt object
    try:
        cv, df = ML._get_CV(cv_params, show=True,
                            show_original=True, return_df=True)
    except Exception as e:
        save_error('Error generating CV splits info', output_loc, e)

    # Create output results
    try:
        output = {}
        output['html_output'], output['html_table'] =\
            get_val_output_from_logs(log_dr, df)
        output['status'] = 1
    except Exception as e:
        output = None
        save_error('Error extracting CV info table', output_loc, e)

    # Save results
    save_results(output_loc, output)


if __name__ == "__main__":

    parser = argparse.ArgumentParser(
        description='BPt Load Validation Script')
    parser.add_argument('user_dr', type=str,
                        help='Location of the created users'
                             'directory to work in')
    parser.add_argument('n', type=str,
                        help='')
    args = parser.parse_args()
    main(args.user_dr, args.n)
