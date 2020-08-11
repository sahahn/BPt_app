import argparse
import os
from utils import save_error
from loading import (load_params, load_all_data,
                     save_results, apply_test_split,
                     get_test_output_from_logs)


def base_test_load(params, user_dr, output_loc, n):

    # Load all data first
    loading_params = params['loading_params']
    try:
        ML = load_all_data(loading_params, output_loc, user_dr, n)
    except Exception as e:
        save_error('Error loading data', output_loc, e)

    ML._print('Loaded All Data.')

    # Apply the test split
    try:
        apply_test_split(params['test_params'], ML, output_loc)
    except Exception as e:
        save_error('Error applying test split', output_loc, e)

    ML._print('Performed test split.')

    return ML


def main(user_dr, n):

    output_loc = os.path.join(user_dr, 'ML_Output' + str(n) + '.json')

    # Load in params
    params = load_params(user_dr, output_loc, n)

    # Base apply test
    ML = base_test_load(params, user_dr, output_loc, n)
    ML._print('loaded')

    log_dr = os.path.join(user_dr, 'ML_Logs_' + str(n))

    # Create output results
    output = {}

    try:
        output['html_output'], output['html_table'] =\
            get_test_output_from_logs(log_dr)
    except Exception as e:
        save_error('Problem getting output', output_loc, e)
    output['status'] = 1

    # Save results
    save_results(output_loc, output)


if __name__ == "__main__":

    parser = argparse.ArgumentParser(
        description='BPt Load Test Splits Script')
    parser.add_argument('user_dr', type=str,
                        help='Location of the created users'
                             'directory to work in')
    parser.add_argument('n', type=str,
                        help='')
    args = parser.parse_args()
    main(args.user_dr, args.n)
