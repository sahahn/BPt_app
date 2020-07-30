import argparse
from loading import variable_load


def main(user_dr, n):

    variable_load(user_dr, 'strat', n)


if __name__ == "__main__":

    parser = argparse.ArgumentParser(description='ABCD_ML Load Strat Script')
    parser.add_argument('user_dr', type=str,
                        help='Location of the created users directory to work '
                             'in')
    parser.add_argument('n', type=str,
                        help='')
    args = parser.parse_args()
    main(args.user_dr, args.n)
