import argparse
import os
import pickle as pkl
from utils import save_error
from ML import run_setup, base_run


def main(user_dr, job_name):

    # Init setup
    params, job_dr, error_output_loc = run_setup(user_dr, job_name)

    # Get base job submission / overlap with test
    model_pipeline, problem_spec, ML =\
        base_run(params, job_dr, error_output_loc, job_name)

    # Run Evaluate
    try:
        results = ML.Test(model_pipeline=model_pipeline,
                          problem_spec=problem_spec,
                          train_subjects='train',
                          test_subjects='test',
                          return_raw_preds=True)
        results['scorer_strs'] = ML.evaluator.scorer_strs
        results['n_repeats'], results['n_splits'] = 1, 1

    except Exception as e:
        results = None
        save_error('Error starting Test', error_output_loc, e)

    # Save raw_preds seperate
    raw_preds = results.pop('raw_preds')

    # Save results
    results_loc = os.path.join(job_dr, 'results.pkl')
    with open(results_loc, 'wb') as f:
        pkl.dump(results, f)

    # Save raw preds
    preds_loc = os.path.join(job_dr, 'raw_preds.pkl')
    with open(preds_loc, 'wb') as f:
        pkl.dump(raw_preds, f)


if __name__ == "__main__":

    parser = argparse.ArgumentParser(description='BPt Test Interface')
    parser.add_argument('user_dr', type=str,
                        help='Location of the created users directory to work '
                             'in')
    parser.add_argument('n', type=str,
                        help='The job name')
    args = parser.parse_args()
    main(args.user_dr, args.n)
