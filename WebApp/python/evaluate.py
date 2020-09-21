import argparse
import os
import pickle as pkl
from utils import save_error
from ML import run_setup, base_run, get_splits_CV


def main(user_dr, job_name):

    # Init setup
    params, job_dr, error_output_loc = run_setup(user_dr, job_name)

    # Get base job submission / overlap with test
    model_pipeline, problem_spec, ML =\
        base_run(params, job_dr, error_output_loc, job_name)

    # Get the Evaluate CV + splits info
    try:
        splits, n_repeats, CV =\
            get_splits_CV(params['eval_params'], error_output_loc,
                          ML.strat_u_name)
    except Exception as e:
        save_error('Error parsing evaluate params', error_output_loc, e)

    # Run Evaluate
    try:
        results = ML.Evaluate(model_pipeline,
                              problem_spec,
                              splits=splits,
                              n_repeats=n_repeats,
                              CV=CV,
                              train_subjects='train')
        results['scorer_strs'] = ML.evaluator.scorer_strs
        results['n_repeats'] = n_repeats
        results['n_splits'] = ML.evaluator.n_splits_
    except Exception as e:
        save_error('Error starting Evaluate', error_output_loc, e)

    # Save results
    results_loc = os.path.join(job_dr, 'results.pkl')
    with open(results_loc, 'wb') as f:
        pkl.dump(results, f)


if __name__ == "__main__":

    parser = argparse.ArgumentParser(description='BPt Evaluate Interface')
    parser.add_argument('user_dr', type=str,
                        help='Location of the created users directory to work '
                             'in')
    parser.add_argument('n', type=str,
                        help='The job name')
    args = parser.parse_args()
    main(args.user_dr, args.n)
