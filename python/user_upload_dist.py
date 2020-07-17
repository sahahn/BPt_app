import argparse
import json
import os


def main(user_dr):

    main_dr = '/'.join(user_dr.split('/')[:-1])
    user_name = user_dr.split('/')[-1]

    user_params_loc = os.path.join(user_dr, 'upload_public_params.json')
    with open(user_params_loc, 'r') as f:
        user_params = json.load(f)

    # Process the user passed dists, i.e., append username
    for param in user_params:
        dist_names = list(user_params[param])
        for dist_name in dist_names:
            dist = user_params[param].pop(dist_name)

            if len(dist) > 0:
                user_params[param][dist_name + ' - ' + user_name] = dist

    public_params_loc = os.path.join(main_dr, 'public_params.json')

    # If public params don't exist, save just this set of user params
    if not os.path.exists(public_params_loc):
        with open(public_params_loc, 'w') as f:
            json.dump(user_params, f)

    # Otherwise, merge public params with user and save
    else:

        with open(public_params_loc, 'r') as f:
            public_params = json.load(f)

        for param in user_params:

            # If new, copy full
            if param not in public_params:
                public_params[param] = user_params[param]

            # If already exists, update
            else:
                public_params[param].update(user_params[param])

        # Save new version
        with open(public_params_loc, 'w') as f:
            json.dump(user_params, f)


if __name__ == "__main__":

    parser = argparse.ArgumentParser(description='ABCD_ML upload dist')
    parser.add_argument('user_dr', type=str,
                        help='Location of the created users directory to work '
                             'in')
    args = parser.parse_args()
    main(args.user_dr)
